import { prisma } from '@/lib/prisma';
import { compileTemplate } from '@/lib/email-templates';
import { generateCampaignContent } from '@/lib/email-campaigns';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

export interface CampaignSnapshotData {
  subject: string;
  htmlContent: string;
  textContent: string;
  preheader: string;
  templateId?: string;
  templateVersion?: number;
  articleIds: string[];
  contentHash: string;
}

// Create campaign snapshot (freeze content before sending)
export async function createCampaignSnapshot(campaignId: string): Promise<CampaignSnapshotData> {
  logger.info('Creating campaign snapshot', { campaignId });

  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true,
    },
  });

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Generate campaign content with current articles
  const campaignContent = await generateCampaignContent(campaign.templateId!);
  
  // Get template variables
  const templateVariables = {
    subscriber: {
      name: 'Subscriber', // Placeholder, will be replaced per recipient
      email: 'subscriber@example.com',
      subscriptionDate: new Date().toLocaleDateString(),
    },
    articles: campaignContent.articles,
    site: {
      name: 'SuperBear Blog',
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      logo: `${process.env.NEXTAUTH_URL}/og-default.svg`,
    },
    campaign: {
      subject: campaign.subject,
      date: new Date().toLocaleDateString(),
      unsubscribeUrl: '{{UNSUBSCRIBE_URL}}', // Placeholder for per-recipient URL
    },
  };

  // Compile template to get final content
  const compiledEmail = await compileTemplate(
    campaign.templateId!,
    templateVariables
  );

  // Extract article IDs from content
  const articleIds = [
    ...(campaignContent.articles.featured ? [campaignContent.articles.featured.id] : []),
    ...campaignContent.articles.latest.map((article: any) => article.id),
  ];

  // Create content hash for verification
  const contentHash = createHash('sha256')
    .update(compiledEmail.html + compiledEmail.text + compiledEmail.subject)
    .digest('hex');

  const snapshotData: CampaignSnapshotData = {
    subject: compiledEmail.subject,
    htmlContent: compiledEmail.html,
    textContent: compiledEmail.text,
    preheader: compiledEmail.preheader,
    templateId: campaign.templateId,
    templateVersion: 1, // TODO: Get actual template version
    articleIds,
    contentHash,
  };

  // Save snapshot to database
  await prisma.campaignSnapshot.upsert({
    where: { campaignId },
    create: {
      campaignId,
      ...snapshotData,
      generatedAt: new Date(),
    },
    update: {
      ...snapshotData,
      generatedAt: new Date(),
    },
  });

  logger.info('Campaign snapshot created', { 
    campaignId, 
    contentHash,
    articleCount: articleIds.length 
  });

  return snapshotData;
}

// Get campaign snapshot
export async function getCampaignSnapshot(campaignId: string): Promise<CampaignSnapshotData | null> {
  const snapshot = await prisma.campaignSnapshot.findUnique({
    where: { campaignId },
  });

  if (!snapshot) {
    return null;
  }

  return {
    subject: snapshot.subject,
    htmlContent: snapshot.htmlContent,
    textContent: snapshot.textContent || '',
    preheader: snapshot.preheader || '',
    templateId: snapshot.templateId || undefined,
    templateVersion: snapshot.templateVersion || undefined,
    articleIds: Array.isArray(snapshot.articleIds) ? snapshot.articleIds as string[] : [],
    contentHash: snapshot.contentHash,
  };
}

// Verify snapshot integrity
export async function verifyCampaignSnapshot(campaignId: string): Promise<boolean> {
  const snapshot = await getCampaignSnapshot(campaignId);
  
  if (!snapshot) {
    return false;
  }

  // Recalculate content hash
  const calculatedHash = createHash('sha256')
    .update(snapshot.htmlContent + snapshot.textContent + snapshot.subject)
    .digest('hex');

  const isValid = calculatedHash === snapshot.contentHash;
  
  if (!isValid) {
    logger.warn('Campaign snapshot integrity check failed', { 
      campaignId,
      expectedHash: snapshot.contentHash,
      calculatedHash 
    });
  }

  return isValid;
}

// Delete campaign snapshot
export async function deleteCampaignSnapshot(campaignId: string): Promise<void> {
  await prisma.campaignSnapshot.delete({
    where: { campaignId },
  });

  logger.info('Campaign snapshot deleted', { campaignId });
}

// Get snapshot statistics
export async function getSnapshotStats() {
  const stats = await prisma.campaignSnapshot.groupBy({
    by: ['templateId'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });

  const totalSnapshots = await prisma.campaignSnapshot.count();
  const recentSnapshots = await prisma.campaignSnapshot.count({
    where: {
      generatedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  return {
    total: totalSnapshots,
    recent: recentSnapshots,
    byTemplate: stats.map(stat => ({
      templateId: stat.templateId,
      count: stat._count.id,
    })),
  };
}