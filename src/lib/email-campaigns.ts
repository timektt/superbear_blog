import { prisma } from '@/lib/prisma';
import { compileTemplate } from '@/lib/email-templates';
import { sendVerificationEmail } from '@/lib/newsletter';
import { logger } from '@/lib/logger';
import { CampaignStatus } from '@prisma/client';
import nodemailer from 'nodemailer';

// Email configuration for campaigns
const campaignTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface CampaignData {
  title: string;
  subject: string;
  templateId: string;
  scheduledAt?: Date;
  recipientFilter?: {
    status?: string[];
    subscribedAfter?: Date;
    subscribedBefore?: Date;
  };
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}

// Create new email campaign
export async function createCampaign(data: CampaignData): Promise<string> {
  try {
    // Get recipient count based on filter
    const recipientCount = await getRecipientCount(data.recipientFilter);

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        title: data.title,
        subject: data.subject,
        templateId: data.templateId,
        scheduledAt: data.scheduledAt,
        recipients: recipientCount,
        status: data.scheduledAt
          ? CampaignStatus.SCHEDULED
          : CampaignStatus.DRAFT,
        content: {}, // Will be populated when sending
      },
    });

    logger.info('Campaign created', {
      campaignId: campaign.id,
      title: data.title,
    });
    return campaign.id;
  } catch (error) {
    logger.error('Failed to create campaign', error as Error);
    throw new Error('Failed to create email campaign');
  }
}

// Get recipient count based on filter
export async function getRecipientCount(
  filter?: CampaignData['recipientFilter']
): Promise<number> {
  const whereClause: any = {
    status: 'ACTIVE', // Only active subscribers
  };

  if (filter?.status) {
    whereClause.status = { in: filter.status };
  }

  if (filter?.subscribedAfter) {
    whereClause.subscribedAt = { gte: filter.subscribedAfter };
  }

  if (filter?.subscribedBefore) {
    whereClause.subscribedAt = {
      ...whereClause.subscribedAt,
      lte: filter.subscribedBefore,
    };
  }

  return await prisma.newsletter.count({ where: whereClause });
}

// Get campaign recipients
export async function getCampaignRecipients(
  filter?: CampaignData['recipientFilter']
) {
  const whereClause: any = {
    status: 'ACTIVE',
  };

  if (filter?.status) {
    whereClause.status = { in: filter.status };
  }

  if (filter?.subscribedAfter) {
    whereClause.subscribedAt = { gte: filter.subscribedAfter };
  }

  if (filter?.subscribedBefore) {
    whereClause.subscribedAt = {
      ...whereClause.subscribedAt,
      lte: filter.subscribedBefore,
    };
  }

  return await prisma.newsletter.findMany({
    where: whereClause,
    select: {
      id: true,
      email: true,
      subscribedAt: true,
    },
  });
}

// Send campaign to all recipients (Production-ready version)
export async function sendCampaign(campaignId: string): Promise<void> {
  try {
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: campaignId },
      include: { template: true, snapshot: true },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (['SENT', 'COMPLETED', 'SENDING', 'QUEUED'].includes(campaign.status)) {
      throw new Error(`Campaign already ${campaign.status.toLowerCase()}`);
    }

    logger.info('Starting campaign send process', { campaignId });

    // Step 1: Create snapshot (freeze content)
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: 'SNAPSHOTTING' },
    });

    const { createCampaignSnapshot } = await import('@/lib/campaign-snapshot');
    await createCampaignSnapshot(campaignId);

    // Step 2: Queue campaign for delivery
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: 'QUEUED' },
    });

    const { queueCampaign } = await import('@/lib/email-queue');
    await queueCampaign(campaignId);

    logger.info('Campaign queued successfully', { campaignId });
  } catch (error) {
    // Update campaign status to failed
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' },
    });

    logger.error('Failed to send campaign', error as Error, { campaignId });
    throw error;
  }
}

// Send individual campaign email
async function sendCampaignEmail(
  campaign: any,
  recipient: { email: string; id: string },
  content: any
): Promise<void> {
  const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?token=${recipient.id}`;

  const templateVariables = {
    subscriber: {
      name: recipient.email.split('@')[0], // Simple name extraction
      email: recipient.email,
      subscriptionDate: new Date().toLocaleDateString(),
    },
    articles: content.articles,
    site: {
      name: 'SuperBear Blog',
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      logo: `${process.env.NEXTAUTH_URL}/og-default.svg`,
    },
    campaign: {
      subject: campaign.subject,
      date: new Date().toLocaleDateString(),
      unsubscribeUrl,
    },
  };

  // Compile template with variables
  const compiledEmail = await compileTemplate(
    campaign.templateId,
    templateVariables,
    recipient.email
  );

  const mailOptions = {
    from: {
      name: 'SuperBear Blog',
      address:
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        'noreply@superbear.blog',
    },
    to: recipient.email,
    subject: compiledEmail.subject,
    html: compiledEmail.html,
    text: compiledEmail.text,
    headers: {
      ...compiledEmail.headers,
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };

  // For development, just log the email
  if (process.env.NODE_ENV === 'development') {
    logger.info('Campaign email would be sent', {
      to: recipient.email,
      subject: compiledEmail.subject,
      unsubscribeUrl,
    });
    return;
  }

  // Send email in production
  await campaignTransporter.sendMail(mailOptions);
}

// Generate campaign content from latest articles
export async function generateCampaignContent(templateId: string) {
  // Get latest published articles
  const latestArticles = await prisma.article.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 10,
    include: {
      author: true,
      category: true,
      tags: true,
    },
  });

  // Get featured article (most recent)
  const featuredArticle = latestArticles[0];

  // Group articles by category
  const articlesByCategory: Record<string, any[]> = {};
  latestArticles.slice(1, 6).forEach((article) => {
    const categoryName = article.category.name;
    if (!articlesByCategory[categoryName]) {
      articlesByCategory[categoryName] = [];
    }
    articlesByCategory[categoryName].push({
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      publishedAt: article.publishedAt,
      author: article.author.name,
      category: article.category.name,
    });
  });

  return {
    articles: {
      featured: featuredArticle
        ? {
            id: featuredArticle.id,
            title: featuredArticle.title,
            slug: featuredArticle.slug,
            summary: featuredArticle.summary,
            publishedAt: featuredArticle.publishedAt,
            author: featuredArticle.author.name,
            category: featuredArticle.category.name,
          }
        : null,
      latest: latestArticles.slice(1, 6).map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        publishedAt: article.publishedAt,
        author: article.author.name,
        category: article.category.name,
      })),
      byCategory: articlesByCategory,
    },
    generatedAt: new Date().toISOString(),
  };
}

// Schedule campaign for later sending
export async function scheduleCampaign(
  campaignId: string,
  scheduledAt: Date
): Promise<void> {
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: {
      scheduledAt,
      status: CampaignStatus.SCHEDULED,
    },
  });

  logger.info('Campaign scheduled', { campaignId, scheduledAt });
}

// Get campaign statistics
export async function getCampaignStats(
  campaignId: string
): Promise<CampaignStats> {
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // For now, return basic stats
  // In a real implementation, you'd track opens, clicks, etc.
  return {
    sent: campaign.recipients,
    delivered: campaign.recipients, // Assume all delivered for now
    opened: Math.floor(campaign.recipients * (campaign.openRate || 0.25)), // 25% default open rate
    clicked: Math.floor(campaign.recipients * (campaign.clickRate || 0.05)), // 5% default click rate
    bounced: 0,
    unsubscribed: 0,
  };
}

// Get all campaigns with pagination
export async function getCampaigns(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [campaigns, total] = await Promise.all([
    prisma.newsletterCampaign.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { name: true },
        },
      },
    }),
    prisma.newsletterCampaign.count(),
  ]);

  return {
    campaigns,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

// Delete campaign
export async function deleteCampaign(campaignId: string): Promise<void> {
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status === CampaignStatus.SENDING) {
    throw new Error('Cannot delete campaign that is currently sending');
  }

  await prisma.newsletterCampaign.delete({
    where: { id: campaignId },
  });

  logger.info('Campaign deleted', { campaignId });
}

// Get scheduled campaigns that need to be sent
export async function getScheduledCampaigns(): Promise<any[]> {
  return await prisma.newsletterCampaign.findMany({
    where: {
      status: CampaignStatus.SCHEDULED,
      scheduledAt: {
        lte: new Date(),
      },
    },
    include: {
      template: true,
    },
  });
}
