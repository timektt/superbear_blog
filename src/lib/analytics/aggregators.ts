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

export interface EngagementMetrics {
  articleId: string;
  timeOnPage: number;
  scrollDepth: number;
  bounceRate: number;
  interactionRate: number;
  socialShares: number;
  linkClicks: number;
  newsletterSignups: number;
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

    // Get campaigns with their deliveries and events for the period
    const campaigns = await prisma.newsletterCampaign.findMany({
      where: whereClause,
      include: {
        deliveries: {
          select: {
            status: true,
            deliveredAt: true,
            openedAt: true,
            clickedAt: true,
            bouncedAt: true,
            complainedAt: true,
          },
        },
        events: {
          select: {
            type: true,
            timestamp: true,
          },
          where: {
            timestamp: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          },
        },
      },
    });

    // Aggregate metrics by campaign
    const campaignMetrics = new Map<string, CampaignAnalytics>();

    for (const campaign of campaigns) {
      const deliveries = campaign.deliveries;
      const events = campaign.events;
      
      const metrics = {
        sent: deliveries.length,
        delivered: deliveries.filter(d => d.deliveredAt).length,
        opened: deliveries.filter(d => d.openedAt).length,
        clicked: deliveries.filter(d => d.clickedAt).length,
        bounced: deliveries.filter(d => d.bouncedAt).length,
        complained: deliveries.filter(d => d.complainedAt).length,
        unsubscribed: events.filter(e => e.type === 'UNSUBSCRIBED').length,
      };

      campaignMetrics.set(campaign.id, {
        campaignId: campaign.id,
        sent: metrics.sent,
        delivered: metrics.delivered,
        opened: metrics.opened,
        clicked: metrics.clicked,
        unsubscribed: metrics.unsubscribed,
        bounced: metrics.bounced,
        complained: metrics.complained,
        period: {
          start: startDate,
          end: endDate,
        },
      });
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
 * Get engagement metrics with time on page, bounce rate, and interaction tracking
 */
export async function getEngagementMetrics(
  articleId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<EngagementMetrics[]> {
  const prisma = getSafePrismaClient();
  
  if (!prisma) {
    return generateMockEngagementMetrics(articleId, startDate, endDate);
  }

  try {
    const whereClause: any = {};
    
    if (articleId) {
      whereClause.articleId = articleId;
    }
    
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) whereClause.timestamp.gte = startDate;
      if (endDate) whereClause.timestamp.lte = endDate;
    }

    // Get articles with their views and interactions
    const articles = await prisma.article.findMany({
      where: articleId ? { id: articleId } : { status: 'PUBLISHED' },
      include: {
        views: {
          where: whereClause.timestamp ? { timestamp: whereClause.timestamp } : {},
          include: {
            interactions: true,
          },
        },
      },
    });

    return articles.map(article => {
      const views = article.views;
      const totalViews = views.length;
      
      if (totalViews === 0) {
        return {
          articleId: article.id,
          timeOnPage: 0,
          scrollDepth: 0,
          bounceRate: 0,
          interactionRate: 0,
          socialShares: 0,
          linkClicks: 0,
          newsletterSignups: 0,
          period: {
            start: startDate || new Date(0),
            end: endDate || new Date(),
          },
        };
      }

      // Calculate engagement metrics
      const totalTimeOnPage = views.reduce((sum, view) => sum + (view.timeOnPage || 0), 0);
      const totalScrollDepth = views.reduce((sum, view) => sum + (view.scrollDepth || 0), 0);
      const bounces = views.filter(view => view.bounced).length;
      const viewsWithInteractions = views.filter(view => view.interactions.length > 0).length;
      
      // Count specific interaction types
      const allInteractions = views.flatMap(view => view.interactions);
      const socialShares = allInteractions.filter(i => i.type === 'SOCIAL_SHARE').length;
      const linkClicks = allInteractions.filter(i => i.type === 'LINK_CLICK').length;
      const newsletterSignups = views.filter(view => view.newsletterSignup).length;

      return {
        articleId: article.id,
        timeOnPage: totalTimeOnPage / totalViews,
        scrollDepth: totalScrollDepth / totalViews,
        bounceRate: (bounces / totalViews) * 100,
        interactionRate: (viewsWithInteractions / totalViews) * 100,
        socialShares,
        linkClicks,
        newsletterSignups,
        period: {
          start: startDate || new Date(0),
          end: endDate || new Date(),
        },
      };
    });
  } catch (error) {
    logger.error('Failed to get engagement metrics', error as Error);
    return generateMockEngagementMetrics(articleId, startDate, endDate);
  }
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

/**
 * Generate mock engagement metrics for safe mode
 */
function generateMockEngagementMetrics(
  articleId?: string,
  startDate?: Date,
  endDate?: Date
): EngagementMetrics[] {
  const mockMetrics = [
    {
      articleId: articleId || 'mock-article-1',
      timeOnPage: 245,
      scrollDepth: 78.5,
      bounceRate: 32.1,
      interactionRate: 45.2,
      socialShares: 23,
      linkClicks: 67,
      newsletterSignups: 12,
    },
    {
      articleId: 'mock-article-2',
      timeOnPage: 198,
      scrollDepth: 71.2,
      bounceRate: 28.7,
      interactionRate: 52.3,
      socialShares: 18,
      linkClicks: 43,
      newsletterSignups: 8,
    },
  ];

  return mockMetrics
    .filter((_, index) => !articleId || index === 0)
    .map(metrics => ({
      ...metrics,
      period: {
        start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: endDate || new Date(),
      },
    }));
}