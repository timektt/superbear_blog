import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

// Email delivery queue system with Redis-like functionality
// For production, replace with actual Redis/BullMQ implementation

interface QueueJob {
  id: string;
  type: 'SEND_EMAIL' | 'PROCESS_WEBHOOK' | 'CLEANUP';
  data: any;
  attempts: number;
  maxAttempts: number;
  delay: number;
  createdAt: Date;
  processAt: Date;
}

interface EmailJob {
  campaignId: string;
  recipientId: string;
  recipientEmail: string;
  deliveryId: string;
  priority: number;
}

interface DomainThrottle {
  domain: string;
  maxPerMinute: number;
  currentCount: number;
  resetAt: Date;
}

// In-memory queue for development (replace with Redis in production)
class EmailQueue {
  private jobs: Map<string, QueueJob> = new Map();
  private processing: Set<string> = new Set();
  private domainThrottles: Map<string, DomainThrottle> = new Map();
  
  // Domain-specific throttling rules
  private readonly DOMAIN_LIMITS: Record<string, number> = {
    'gmail.com': 40,      // 40 emails per minute
    'googlemail.com': 40,
    'outlook.com': 15,    // 15 emails per minute
    'hotmail.com': 15,
    'live.com': 15,
    'yahoo.com': 20,      // 20 emails per minute
    'aol.com': 10,        // 10 emails per minute
    'icloud.com': 25,     // 25 emails per minute
    'me.com': 25,
    'default': 30,        // Default limit for other domains
  };

  // Add email to queue with idempotency
  async addEmailJob(job: EmailJob): Promise<string> {
    const idempotencyKey = this.generateIdempotencyKey(job.campaignId, job.recipientId);
    
    // Check if job already exists (idempotency)
    const existingDelivery = await prisma.campaignDelivery.findUnique({
      where: { idempotencyKey },
    });

    if (existingDelivery) {
      logger.info('Email job already exists, skipping', { idempotencyKey });
      return existingDelivery.id;
    }

    // Create delivery record
    const delivery = await prisma.campaignDelivery.create({
      data: {
        campaignId: job.campaignId,
        recipientId: job.recipientId,
        recipientEmail: job.recipientEmail,
        status: 'QUEUED',
        idempotencyKey,
        subject: '', // Will be filled when processing
        htmlContent: '', // Will be filled when processing
      },
    });

    // Add to queue
    const queueJob: QueueJob = {
      id: delivery.id,
      type: 'SEND_EMAIL',
      data: job,
      attempts: 0,
      maxAttempts: 3,
      delay: this.calculateDelay(job.recipientEmail),
      createdAt: new Date(),
      processAt: new Date(Date.now() + this.calculateDelay(job.recipientEmail)),
    };

    this.jobs.set(queueJob.id, queueJob);
    
    logger.info('Email job added to queue', { 
      jobId: queueJob.id, 
      recipientEmail: job.recipientEmail,
      delay: queueJob.delay 
    });

    return queueJob.id;
  }

  // Process next available job
  async processNext(): Promise<boolean> {
    const now = new Date();
    
    // Find next job ready to process
    const readyJobs = Array.from(this.jobs.values())
      .filter(job => 
        !this.processing.has(job.id) && 
        job.processAt <= now &&
        job.attempts < job.maxAttempts
      )
      .sort((a, b) => a.processAt.getTime() - b.processAt.getTime());

    if (readyJobs.length === 0) {
      return false;
    }

    const job = readyJobs[0];
    
    // Check domain throttling
    if (!this.canSendToDomain(job.data.recipientEmail)) {
      logger.debug('Domain throttle limit reached', { 
        email: job.data.recipientEmail,
        domain: this.extractDomain(job.data.recipientEmail)
      });
      return false;
    }

    // Mark as processing
    this.processing.add(job.id);
    
    try {
      await this.processEmailJob(job);
      
      // Remove from queue on success
      this.jobs.delete(job.id);
      
      logger.info('Email job processed successfully', { jobId: job.id });
      return true;
      
    } catch (error) {
      logger.error('Email job failed', error as Error, { jobId: job.id });
      
      // Increment attempts and reschedule with exponential backoff
      job.attempts++;
      job.processAt = new Date(Date.now() + this.calculateBackoffDelay(job.attempts));
      
      if (job.attempts >= job.maxAttempts) {
        // Move to dead letter queue
        await this.handleFailedJob(job, error as Error);
        this.jobs.delete(job.id);
      }
      
      return false;
      
    } finally {
      this.processing.delete(job.id);
    }
  }

  // Process email job
  private async processEmailJob(job: QueueJob): Promise<void> {
    const emailJob = job.data as EmailJob;
    
    // Get campaign and delivery details
    const delivery = await prisma.campaignDelivery.findUnique({
      where: { id: job.id },
      include: {
        campaign: {
          include: { snapshot: true }
        },
        recipient: true,
      },
    });

    if (!delivery) {
      throw new Error('Delivery record not found');
    }

    // Update delivery status
    await prisma.campaignDelivery.update({
      where: { id: job.id },
      data: {
        status: 'SENDING',
        attempts: job.attempts + 1,
        lastAttemptAt: new Date(),
      },
    });

    // Send email using existing email service
    const { sendCampaignEmail } = await import('@/lib/email-campaigns');
    
    // Create email content from snapshot
    const emailContent = {
      subject: delivery.campaign.snapshot?.subject || delivery.campaign.subject,
      html: delivery.campaign.snapshot?.htmlContent || '',
      text: delivery.campaign.snapshot?.textContent || '',
    };

    // Send email
    await sendCampaignEmail(
      delivery.campaign,
      { email: delivery.recipientEmail, id: delivery.recipientId },
      emailContent
    );

    // Update delivery status
    await prisma.campaignDelivery.update({
      where: { id: job.id },
      data: {
        status: 'SENT',
        deliveredAt: new Date(),
      },
    });

    // Update domain throttle
    this.updateDomainThrottle(delivery.recipientEmail);
  }

  // Handle failed job (Dead Letter Queue)
  private async handleFailedJob(job: QueueJob, error: Error): Promise<void> {
    await prisma.campaignDelivery.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        lastError: error.message,
      },
    });

    logger.error('Email job moved to dead letter queue', error, { 
      jobId: job.id,
      attempts: job.attempts 
    });
  }

  // Generate idempotency key
  private generateIdempotencyKey(campaignId: string, recipientId: string): string {
    return createHash('sha256')
      .update(`${campaignId}:${recipientId}`)
      .digest('hex');
  }

  // Calculate delay based on domain throttling
  private calculateDelay(email: string): number {
    const domain = this.extractDomain(email);
    const throttle = this.domainThrottles.get(domain);
    
    if (!throttle) {
      return 0; // No delay for first email to domain
    }

    const limit = this.DOMAIN_LIMITS[domain] || this.DOMAIN_LIMITS.default;
    
    if (throttle.currentCount >= limit) {
      // Calculate delay until reset
      const delayMs = throttle.resetAt.getTime() - Date.now();
      return Math.max(delayMs, 0);
    }

    return 0;
  }

  // Calculate exponential backoff delay
  private calculateBackoffDelay(attempts: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = baseDelay * Math.pow(2, attempts - 1);
    return Math.min(delay, maxDelay);
  }

  // Check if we can send to domain (throttling)
  private canSendToDomain(email: string): boolean {
    const domain = this.extractDomain(email);
    const limit = this.DOMAIN_LIMITS[domain] || this.DOMAIN_LIMITS.default;
    const throttle = this.domainThrottles.get(domain);
    
    if (!throttle) {
      return true; // No throttle record, can send
    }

    // Reset throttle if time window passed
    if (throttle.resetAt <= new Date()) {
      throttle.currentCount = 0;
      throttle.resetAt = new Date(Date.now() + 60000); // Reset in 1 minute
    }

    return throttle.currentCount < limit;
  }

  // Update domain throttle counter
  private updateDomainThrottle(email: string): void {
    const domain = this.extractDomain(email);
    const limit = this.DOMAIN_LIMITS[domain] || this.DOMAIN_LIMITS.default;
    
    let throttle = this.domainThrottles.get(domain);
    
    if (!throttle) {
      throttle = {
        domain,
        maxPerMinute: limit,
        currentCount: 0,
        resetAt: new Date(Date.now() + 60000), // Reset in 1 minute
      };
      this.domainThrottles.set(domain, throttle);
    }

    // Reset if time window passed
    if (throttle.resetAt <= new Date()) {
      throttle.currentCount = 0;
      throttle.resetAt = new Date(Date.now() + 60000);
    }

    throttle.currentCount++;
  }

  // Extract domain from email
  private extractDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || 'unknown';
  }

  // Get queue statistics
  getStats() {
    const now = new Date();
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      ready: jobs.filter(job => job.processAt <= now && job.attempts < job.maxAttempts).length,
      processing: this.processing.size,
      failed: jobs.filter(job => job.attempts >= job.maxAttempts).length,
      delayed: jobs.filter(job => job.processAt > now).length,
      domainThrottles: Array.from(this.domainThrottles.entries()).map(([domain, throttle]) => ({
        domain,
        currentCount: throttle.currentCount,
        maxPerMinute: throttle.maxPerMinute,
        resetAt: throttle.resetAt,
      })),
    };
  }

  // Clear completed and failed jobs
  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < cutoff && (job.attempts >= job.maxAttempts || this.processing.has(jobId))) {
        this.jobs.delete(jobId);
      }
    }

    logger.info('Queue cleanup completed', { remainingJobs: this.jobs.size });
  }
}

// Singleton instance
export const emailQueue = new EmailQueue();

// Queue processor (call this from cron job)
export async function processEmailQueue(): Promise<void> {
  const maxProcessingTime = 4 * 60 * 1000; // 4 minutes max processing time
  const startTime = Date.now();
  let processed = 0;

  logger.info('Starting email queue processing');

  while (Date.now() - startTime < maxProcessingTime) {
    const hasMore = await emailQueue.processNext();
    
    if (!hasMore) {
      // No more jobs ready, wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }

    processed++;
    
    // Small delay between jobs to avoid overwhelming email service
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logger.info('Email queue processing completed', { 
    processed,
    duration: Date.now() - startTime,
    stats: emailQueue.getStats()
  });
}

// Add campaign to queue
export async function queueCampaign(campaignId: string): Promise<void> {
  logger.info('Queueing campaign for delivery', { campaignId });

  // Get campaign recipients
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
    include: { snapshot: true },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Get active subscribers (excluding suppressed)
  const recipients = await prisma.newsletter.findMany({
    where: {
      status: 'ACTIVE',
      email: {
        notIn: await prisma.suppression.findMany({
          select: { email: true },
        }).then(suppressions => suppressions.map(s => s.email)),
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  logger.info(`Queueing ${recipients.length} emails for campaign`, { campaignId });

  // Add each recipient to queue
  for (const recipient of recipients) {
    await emailQueue.addEmailJob({
      campaignId,
      recipientId: recipient.id,
      recipientEmail: recipient.email,
      deliveryId: '', // Will be set by queue
      priority: 1,
    });
  }

  // Update campaign status
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { status: 'QUEUED' },
  });

  logger.info('Campaign queued successfully', { 
    campaignId, 
    recipients: recipients.length 
  });
}