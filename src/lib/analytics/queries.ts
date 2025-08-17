import { PrismaClient } from '@prisma/client';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { logger } from '@/lib/logger';

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  status: string;
  createdAt: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    complained: number;
    unsubscribed: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    unsubscribeRate: number;
    bounceRate: number;
  };
}

/**
 * Get campaign performance data
 */
export async function getCampaignPerformance(
  campaignIds?: string[],
  startDate?: Date,
  endDate?: Date
): Promise<CampaignPerformance[]> {
  const prisma = getSafePrismaClient();
  
  if (!prisma) {
    return generateMockCampaignPerformance(campaignIds);
  }

  try {
    const whereClause: any = {};
    
    if (campaignIds && campaignIds.length > 0) {
      whereClause.id = { in: campaignIds };
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const campaigns = await prisma.emailCampaign.findMany({
      where: whereClause,
      include: {
        snapshots: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return campaigns.map(campaign => {
      const latestSnapshot = campaign.snapshots[0];
      const metrics = latestSnapshot?.metrics as any || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        unsubscribed: 0,
      };

      const rates = {
        deliveryRate: metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0,
        openRate: metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0,
        clickRate: metrics.opened > 0 ? (metrics.clicked / metrics.opened) * 100 : 0,
        unsubscribeRate: metrics.sent > 0 ? (metrics.unsubscribed / metrics.sent) * 100 : 0,
        bounceRate: metrics.sent > 0 ? (metrics.bounced / metrics.sent) * 100 : 0,
      };

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        scheduledAt: campaign.scheduledAt,
        sentAt: campaign.sentAt,
        metrics,
        rates,
      };
    });
  } catch (error) {
    logger.error('Failed to get campaign performance', error as Error);
    return generateMockCampaignPerformance(campaignIds);
  }
}

/**
 * Get top performing campaigns
 */
export async function getTopPerformingCampaigns(
  metric: 'openRate' | 'clickRate' | 'deliveryRate' = 'openRate',
  limit = 5,
  startDate?: Date,
  endDate?: Date
): Promise<CampaignPerformance[]> {
  const campaigns = await getCampaignPerformance(undefined, startDate, endDate);
  
  return campaigns
    .sort((a, b) => b.rates[metric] - a.rates[metric])
    .slice(0, limit);
}

/**
 * Get campaign analytics for dashboard
 */
export async function getDashboardAnalytics(days = 7): Promise<{
  summary: {
    totalCampaigns: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgDeliveryRate: number;
  };
  recentCampaigns: CampaignPerformance[];
  topPerformers: CampaignPerformance[];
  trends: {
    sent: number[];
    opened: number[];
    clicked: number[];
    dates: string[];
  };
}> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const campaigns = await getCampaignPerformance(undefined, startDate, endDate);
  const topPerformers = await getTopPerformingCampaigns('openRate', 3, startDate, endDate);

  // Calculate summary
  const summary = campaigns.reduce(
    (acc, campaign) => {
      acc.totalSent += campaign.metrics.sent;
      acc.totalDelivered += campaign.metrics.delivered;
      acc.totalOpened += campaign.metrics.opened;
      acc.totalClicked += campaign.metrics.clicked;
      return acc;
    },
    {
      totalCampaigns: campaigns.length,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgDeliveryRate: 0,
    }
  );

  // Calculate averages
  if (campaigns.length > 0) {
    summary.avgOpenRate = campaigns.reduce((sum, c) => sum + c.rates.openRate, 0) / campaigns.length;
    summary.avgClickRate = campaigns.reduce((sum, c) => sum + c.rates.clickRate, 0) / campaigns.length;
    summary.avgDeliveryRate = campaigns.reduce((sum, c) => sum + c.rates.deliveryRate, 0) / campaigns.length;
  }

  // Generate trends data (simplified)
  const trends = {
    sent: campaigns.slice(0, 7).map(c => c.metrics.sent),
    opened: campaigns.slice(0, 7).map(c => c.metrics.opened),
    clicked: campaigns.slice(0, 7).map(c => c.metrics.clicked),
    dates: campaigns.slice(0, 7).map(c => c.createdAt.toISOString().split('T')[0]),
  };

  return {
    summary,
    recentCampaigns: campaigns.slice(0, 5),
    topPerformers,
    trends,
  };
}

/**
 * Generate mock campaign performance data
 */
function generateMockCampaignPerformance(campaignIds?: string[]): CampaignPerformance[] {
  const mockCampaigns = [
    {
      campaignId: 'mock-campaign-1',
      campaignName: 'Weekly Tech Digest #42',
      status: 'sent',
      sent: 1250,
      delivered: 1198,
      opened: 456,
      clicked: 89,
      bounced: 52,
      complained: 3,
      unsubscribed: 12,
    },
    {
      campaignId: 'mock-campaign-2',
      campaignName: 'AI News Roundup',
      status: 'sent',
      sent: 890,
      delivered: 867,
      opened: 312,
      clicked: 67,
      bounced: 23,
      complained: 1,
      unsubscribed: 8,
    },
    {
      campaignId: 'mock-campaign-3',
      campaignName: 'Startup Spotlight',
      status: 'scheduled',
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      unsubscribed: 0,
    },
  ];

  return mockCampaigns
    .filter(campaign => !campaignIds || campaignIds.includes(campaign.campaignId))
    .map(campaign => {
      const rates = {
        deliveryRate: campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0,
        openRate: campaign.delivered > 0 ? (campaign.opened / campaign.delivered) * 100 : 0,
        clickRate: campaign.opened > 0 ? (campaign.clicked / campaign.opened) * 100 : 0,
        unsubscribeRate: campaign.sent > 0 ? (campaign.unsubscribed / campaign.sent) * 100 : 0,
        bounceRate: campaign.sent > 0 ? (campaign.bounced / campaign.sent) * 100 : 0,
      };

      return {
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        status: campaign.status,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        scheduledAt: campaign.status === 'scheduled' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
        sentAt: campaign.status === 'sent' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
        metrics: {
          sent: campaign.sent,
          delivered: campaign.delivered,
          opened: campaign.opened,
          clicked: campaign.clicked,
          bounced: campaign.bounced,
          complained: campaign.complained,
          unsubscribed: campaign.unsubscribed,
        },
        rates,
      };
    });
}