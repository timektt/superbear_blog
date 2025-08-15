import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export type SuppressionReason = 
  | 'HARD_BOUNCE' 
  | 'SOFT_BOUNCE' 
  | 'COMPLAINT' 
  | 'UNSUBSCRIBE' 
  | 'MANUAL' 
  | 'INVALID_EMAIL' 
  | 'BLOCKED';

export interface SuppressionEntry {
  email: string;
  reason: SuppressionReason;
  source?: string;
  bounceType?: string;
  errorCode?: string;
  errorMessage?: string;
}

// Add email to suppression list
export async function addSuppression(entry: SuppressionEntry): Promise<void> {
  try {
    await prisma.suppression.upsert({
      where: { email: entry.email.toLowerCase() },
      create: {
        email: entry.email.toLowerCase(),
        reason: entry.reason,
        source: entry.source,
        bounceType: entry.bounceType,
        errorCode: entry.errorCode,
        errorMessage: entry.errorMessage,
      },
      update: {
        reason: entry.reason,
        source: entry.source,
        bounceType: entry.bounceType,
        errorCode: entry.errorCode,
        errorMessage: entry.errorMessage,
        updatedAt: new Date(),
      },
    });

    // Also update newsletter status if exists
    await prisma.newsletter.updateMany({
      where: { email: entry.email.toLowerCase() },
      data: {
        status: entry.reason === 'UNSUBSCRIBE' ? 'UNSUBSCRIBED' : 'BOUNCED',
        unsubscribedAt: entry.reason === 'UNSUBSCRIBE' ? new Date() : undefined,
      },
    });

    logger.info('Email added to suppression list', { 
      email: entry.email,
      reason: entry.reason,
      source: entry.source 
    });

  } catch (error) {
    logger.error('Failed to add suppression', error as Error, { email: entry.email });
    throw error;
  }
}

// Remove email from suppression list
export async function removeSuppression(email: string): Promise<void> {
  try {
    await prisma.suppression.delete({
      where: { email: email.toLowerCase() },
    });

    // Reactivate newsletter subscription if exists
    await prisma.newsletter.updateMany({
      where: { email: email.toLowerCase() },
      data: {
        status: 'ACTIVE',
        unsubscribedAt: null,
      },
    });

    logger.info('Email removed from suppression list', { email });

  } catch (error) {
    logger.error('Failed to remove suppression', error as Error, { email });
    throw error;
  }
}

// Check if email is suppressed
export async function isSuppressed(email: string): Promise<boolean> {
  const suppression = await prisma.suppression.findUnique({
    where: { email: email.toLowerCase() },
  });

  return !!suppression;
}

// Get suppression details
export async function getSuppressionDetails(email: string) {
  return await prisma.suppression.findUnique({
    where: { email: email.toLowerCase() },
  });
}

// Filter out suppressed emails from recipient list
export async function filterSuppressedEmails(emails: string[]): Promise<string[]> {
  const suppressions = await prisma.suppression.findMany({
    where: {
      email: {
        in: emails.map(email => email.toLowerCase()),
      },
    },
    select: { email: true },
  });

  const suppressedEmails = new Set(suppressions.map(s => s.email));
  
  return emails.filter(email => !suppressedEmails.has(email.toLowerCase()));
}

// Get suppression statistics
export async function getSuppressionStats() {
  const stats = await prisma.suppression.groupBy({
    by: ['reason'],
    _count: {
      email: true,
    },
    orderBy: {
      _count: {
        email: 'desc',
      },
    },
  });

  const totalSuppressed = await prisma.suppression.count();
  const recentSuppressed = await prisma.suppression.count({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  return {
    total: totalSuppressed,
    recent: recentSuppressed,
    byReason: stats.map(stat => ({
      reason: stat.reason,
      count: stat._count.email,
    })),
  };
}

// Bulk add suppressions (for importing bounce lists)
export async function bulkAddSuppressions(entries: SuppressionEntry[]): Promise<void> {
  logger.info(`Bulk adding ${entries.length} suppressions`);

  const batchSize = 100;
  let processed = 0;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    
    try {
      await Promise.all(batch.map(entry => addSuppression(entry)));
      processed += batch.length;
      
      logger.info(`Processed ${processed}/${entries.length} suppressions`);
      
    } catch (error) {
      logger.error('Batch suppression failed', error as Error, { 
        batchStart: i,
        batchSize: batch.length 
      });
    }
  }

  logger.info('Bulk suppression completed', { 
    total: entries.length,
    processed 
  });
}

// Clean up old soft bounces (convert to active after 30 days)
export async function cleanupSoftBounces(): Promise<void> {
  const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  const result = await prisma.suppression.deleteMany({
    where: {
      reason: 'SOFT_BOUNCE',
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  logger.info('Soft bounce cleanup completed', { removed: result.count });
}

// Export suppression list (for compliance)
export async function exportSuppressionList(reason?: SuppressionReason) {
  const where = reason ? { reason } : {};
  
  const suppressions = await prisma.suppression.findMany({
    where,
    select: {
      email: true,
      reason: true,
      timestamp: true,
      source: true,
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  return suppressions;
}

// Handle webhook bounce/complaint events
export async function handleWebhookEvent(event: {
  email: string;
  type: 'bounce' | 'complaint' | 'unsubscribe';
  bounceType?: 'hard' | 'soft';
  reason?: string;
  campaignId?: string;
}): Promise<void> {
  let suppressionReason: SuppressionReason;
  
  switch (event.type) {
    case 'bounce':
      suppressionReason = event.bounceType === 'hard' ? 'HARD_BOUNCE' : 'SOFT_BOUNCE';
      break;
    case 'complaint':
      suppressionReason = 'COMPLAINT';
      break;
    case 'unsubscribe':
      suppressionReason = 'UNSUBSCRIBE';
      break;
    default:
      throw new Error(`Unknown event type: ${event.type}`);
  }

  await addSuppression({
    email: event.email,
    reason: suppressionReason,
    source: event.campaignId,
    bounceType: event.bounceType,
    errorMessage: event.reason,
  });

  // Record event
  await prisma.newsletterEvent.create({
    data: {
      recipientEmail: event.email,
      campaignId: event.campaignId,
      type: event.type.toUpperCase() as any,
      timestamp: new Date(),
      providerData: event,
    },
  });

  logger.info('Webhook event processed', { 
    email: event.email,
    type: event.type,
    reason: suppressionReason 
  });
}