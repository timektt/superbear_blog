import { PrismaClient } from '@prisma/client';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { logger } from '@/lib/logger';

export interface CampaignAnalytics {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
  complained: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface AnalyticsSummary {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Aggregate campaign analytics for a specific time period
 */
export async function aggregateCampaignAnalytics(
  startDate: Date,
  endDate: Date,
  campaignId?: string
): Promise<CampaignAnalytics[]> {
  const prisma = getSafePrismaClient();
  
  if (!prisma) {
    // Return mock data when database is unavailable
    return generateMockCampaignAnalytics(startDate, endDate, campaignId);
  }

  try {
    const whereClause = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(campaignId && { campaignId }),
    };

    // Get campaign snapshots for the period
    const snapshots = await prisma.campaignSnapshot.findMany({
      where: whereClause,
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Aggregate metrics by campaign
    const campaignMetrics = new Map<string, CampaignAnalytics>();

    for (const snapshot of snapshots) {
      const metrics = snapshot.metrics as any;
      const existing = campaignMetrics.get(snapshot.campaignId);

      if (!existing) {
        campaignMetrics.set(snapshot.campaignId, {
          campaignId: snapshot.campaignId,
          sent: metrics.sent || 0,
          delivered: metrics.delivered || 0,
          opened: metrics.opened || 0,
          clicked: metrics.clicked || 0,
          unsubscribed: metrics.unsubscribed || 0,
          bounced: metrics.bounced || 0,
          complained: metrics.complained || 0,
          period: {
            start: startDate,
            end: endDate,
          },
        });
      } else {
        // Aggregate metrics (take the latest values)
        existing.sent = Math.max(existing.sent, metrics.sent || 0);
        existing.delivered = Math.max(existing.delivered, metrics.delivered || 0);
        existing.opened = Math.max(existing.opened, metrics.opened || 0);
        existing.clicked = Math.max(existing.clicked, metrics.clicked || 0);
        existing.unsubscribed = Math.max(existing.unsubscribed, metrics.unsubscribed || 0);
        existing.bounced = Math.max(existing.bounced, metrics.bounced || 0);
        existing.complained = Math.max(existing.complained, metrics.complained || 0);
      }
    }

    return Array.from(campaignMetrics.values());
  } catch (error) {
    logger.error('Failed to aggregate campaign analytics', error as Error);
    return generateMockCampaignAnalytics(startDate, endDate, campaignId);
  }
}

/**
 * Get analytics summary for a time period
 */
export async function getAnalyticsSummary(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsSummary> {
  const campaignAnalytics = await aggregateCampaignAnalytics(startDate, endDate);

  const summary = campaignAnalytics.reduce(
    (acc, campaign) => {
      acc.totalSent += campaign.sent;
      acc.totalDelivered += campaign.delivered;
      acc.totalOpened += campaign.opened;
      acc.totalClicked += campaign.clicked;
      acc.totalUnsubscribed += campaign.unsubscribed;
      return acc;
    },
    {
      totalCampaigns: campaignAnalytics.length,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalUnsubscribed: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      unsubscribeRate: 0,
      period: {
        start: startDate,
        end: endDate,
      },
    }
  );

  // Calculate rates
  if (summary.totalSent > 0) {
    summary.deliveryRate = (summary.totalDelivered / summary.totalSent) * 100;
    summary.unsubscribeRate = (summary.totalUnsubscribed / summary.totalSent) * 100;
  }

  if (summary.totalDelivered > 0) {
    summary.openRate = (summary.totalOpened / summary.totalDelivered) * 100;
  }

  if (summary.totalOpened > 0) {
    summary.clickRate = (summary.totalClicked / summary.totalOpened) * 100;
  }

  return summary;
}

/**
 * Generate mock analytics data for safe mode
 */
function generateMockCampaignAnalytics(
  startDate: Date,
  endDate: Date,
  campaignId?: string
): CampaignAnalytics[] {
  const mockCampaigns = [
    {
      campaignId: campaignId || 'mock-campaign-1',
      sent: 1250,
      delivered: 1198,
      opened: 456,
      clicked: 89,
      unsubscribed: 12,
      bounced: 52,
      complained: 3,
    },
    {
      campaignId: 'mock-campaign-2',
      sent: 890,
      delivered: 867,
      opened: 312,
      clicked: 67,
      unsubscribed: 8,
      bounced: 23,
      complained: 1,
    },
  ];

  return mockCampaigns
    .filter((_, index) => !campaignId || index === 0)
    .map(campaign => ({
      ...campaign,
      period: {
        start: startDate,
        end: endDate,
      },
    }));
}