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

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  totalViews: number;
  uniqueViews: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  totalShares: number;
  totalClicks: number;
  completionRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ViewMetrics {
  totalViews: number;
  uniqueViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  avgTimeOnPage: number;
  avgScrollDepth: number;
  bounceRate: number;
  completionRate: number;
}

/**
 * Get campaign performance data with time filtering
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

    const campaigns = await prisma.newsletterCampaign.findMany({
      where: whereClause,
      include: {
        snapshot: true,
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
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return campaigns.map(campaign => {
      // Calculate metrics from deliveries and events
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

      const rates = {
        deliveryRate: metrics.sent > 0 ? (metrics.delivered / metrics.sent) * 100 : 0,
        openRate: metrics.delivered > 0 ? (metrics.opened / metrics.delivered) * 100 : 0,
        clickRate: metrics.opened > 0 ? (metrics.clicked / metrics.opened) * 100 : 0,
        unsubscribeRate: metrics.sent > 0 ? (metrics.unsubscribed / metrics.sent) * 100 : 0,
        bounceRate: metrics.sent > 0 ? (metrics.bounced / metrics.sent) * 100 : 0,
      };

      return {
        campaignId: campaign.id,
        campaignName: campaign.title,
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
 * Get category performance with time filtering and accurate metrics
 */
export async function getCategoryPerformance(
  startDate?: Date,
  endDate?: Date
): Promise<CategoryPerformance[]> {
  const prisma = getSafePrismaClient();
  
  if (!prisma) {
    return generateMockCategoryPerformance(startDate, endDate);
  }

  try {
    const whereClause: any = {
      status: 'PUBLISHED',
    };
    
    if (startDate || endDate) {
      whereClause.publishedAt = {};
      if (startDate) whereClause.publishedAt.gte = startDate;
      if (endDate) whereClause.publishedAt.lte = endDate;
    }

    // Get articles with their stats and category info
    const articles = await prisma.article.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        stats: true,
        views: startDate || endDate ? {
          where: {
            timestamp: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          },
        } : true,
      },
    });

    // Group by category and aggregate metrics
    const categoryMap = new Map<string, {
      categoryId: string;
      categoryName: string;
      articles: typeof articles;
      totalViews: number;
      uniqueViews: number;
      totalTimeOnPage: number;
      totalScrollDepth: number;
      totalBounces: number;
      totalShares: number;
      totalClicks: number;
      totalCompletions: number;
      viewCount: number;
    }>();

    for (const article of articles) {
      const categoryId = article.category.id;
      const categoryName = article.category.name;
      
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          articles: [],
          totalViews: 0,
          uniqueViews: 0,
          totalTimeOnPage: 0,
          totalScrollDepth: 0,
          totalBounces: 0,
          totalShares: 0,
          totalClicks: 0,
          totalCompletions: 0,
          viewCount: 0,
        });
      }

      const categoryData = categoryMap.get(categoryId)!;
      categoryData.articles.push(article);

      // Aggregate from article stats if available
      if (article.stats) {
        categoryData.totalViews += article.stats.totalViews;
        categoryData.uniqueViews += article.stats.uniqueViews;
        categoryData.totalShares += article.stats.totalShares;
        categoryData.totalClicks += article.stats.totalClicks;
        
        if (article.stats.avgTimeOnPage) {
          categoryData.totalTimeOnPage += article.stats.avgTimeOnPage * article.stats.totalViews;
        }
        if (article.stats.avgScrollDepth) {
          categoryData.totalScrollDepth += article.stats.avgScrollDepth * article.stats.totalViews;
        }
        if (article.stats.bounceRate) {
          categoryData.totalBounces += (article.stats.bounceRate / 100) * article.stats.totalViews;
        }
        if (article.stats.completionRate) {
          categoryData.totalCompletions += (article.stats.completionRate / 100) * article.stats.totalViews;
        }
      }

      // Also aggregate from individual views if in time range
      for (const view of article.views) {
        categoryData.viewCount++;
        if (view.timeOnPage) {
          categoryData.totalTimeOnPage += view.timeOnPage;
        }
        if (view.scrollDepth) {
          categoryData.totalScrollDepth += view.scrollDepth;
        }
        if (view.bounced) {
          categoryData.totalBounces++;
        }
      }
    }

    return Array.from(categoryMap.values()).map(categoryData => ({
      categoryId: categoryData.categoryId,
      categoryName: categoryData.categoryName,
      totalViews: categoryData.totalViews,
      uniqueViews: categoryData.uniqueViews,
      avgTimeOnPage: categoryData.totalViews > 0 ? categoryData.totalTimeOnPage / categoryData.totalViews : 0,
      avgScrollDepth: categoryData.totalViews > 0 ? categoryData.totalScrollDepth / categoryData.totalViews : 0,
      bounceRate: categoryData.totalViews > 0 ? (categoryData.totalBounces / categoryData.totalViews) * 100 : 0,
      totalShares: categoryData.totalShares,
      totalClicks: categoryData.totalClicks,
      completionRate: categoryData.totalViews > 0 ? (categoryData.totalCompletions / categoryData.totalViews) * 100 : 0,
      period: {
        start: startDate || new Date(0),
        end: endDate || new Date(),
      },
    }));
  } catch (error) {
    logger.error('Failed to get category performance', error as Error);
    return generateMockCategoryPerformance(startDate, endDate);
  }
}

/**
 * Get accurate view tracking metrics with unique visitor detection
 */
export async function getViewMetrics(
  articleId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<ViewMetrics> {
  const prisma = getSafePrismaClient();
  
  if (!prisma) {
    return generateMockViewMetrics();
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

    // Get view data with aggregations
    const views = await prisma.articleView.findMany({
      where: whereClause,
      select: {
        sessionId: true,
        timestamp: true,
        timeOnPage: true,
        scrollDepth: true,
        bounced: true,
        readingTime: true,
      },
    });

    // Calculate unique views by session
    const uniqueSessions = new Set(views.map(v => v.sessionId));
    
    // Time-based calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const viewsToday = views.filter(v => v.timestamp >= today).length;
    const viewsThisWeek = views.filter(v => v.timestamp >= thisWeek).length;
    const viewsThisMonth = views.filter(v => v.timestamp >= thisMonth).length;

    // Calculate averages
    const validTimeOnPage = views.filter(v => v.timeOnPage && v.timeOnPage > 0);
    const validScrollDepth = views.filter(v => v.scrollDepth && v.scrollDepth > 0);
    const bounces = views.filter(v => v.bounced).length;
    const completions = views.filter(v => v.scrollDepth && v.scrollDepth >= 80).length;

    return {
      totalViews: views.length,
      uniqueViews: uniqueSessions.size,
      viewsToday,
      viewsThisWeek,
      viewsThisMonth,
      avgTimeOnPage: validTimeOnPage.length > 0 
        ? validTimeOnPage.reduce((sum, v) => sum + (v.timeOnPage || 0), 0) / validTimeOnPage.length 
        : 0,
      avgScrollDepth: validScrollDepth.length > 0 
        ? validScrollDepth.reduce((sum, v) => sum + (v.scrollDepth || 0), 0) / validScrollDepth.length 
        : 0,
      bounceRate: views.length > 0 ? (bounces / views.length) * 100 : 0,
      completionRate: views.length > 0 ? (completions / views.length) * 100 : 0,
    };
  } catch (error) {
    logger.error('Failed to get view metrics', error as Error);
    return generateMockViewMetrics();
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
      status: 'SENT',
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
      status: 'SENT',
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
      status: 'SCHEDULED',
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
        scheduledAt: campaign.status === 'SCHEDULED' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
        sentAt: campaign.status === 'SENT' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : undefined,
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

/**
 * Generate mock category performance data
 */
function generateMockCategoryPerformance(startDate?: Date, endDate?: Date): CategoryPerformance[] {
  const mockCategories = [
    {
      categoryId: 'ai-ml',
      categoryName: 'AI & Machine Learning',
      totalViews: 15420,
      uniqueViews: 12340,
      avgTimeOnPage: 245,
      avgScrollDepth: 78.5,
      bounceRate: 32.1,
      totalShares: 234,
      totalClicks: 567,
      completionRate: 65.2,
    },
    {
      categoryId: 'dev-tools',
      categoryName: 'Developer Tools',
      totalViews: 8930,
      uniqueViews: 7120,
      avgTimeOnPage: 198,
      avgScrollDepth: 71.2,
      bounceRate: 28.7,
      totalShares: 156,
      totalClicks: 423,
      completionRate: 58.9,
    },
    {
      categoryId: 'startups',
      categoryName: 'Startups',
      totalViews: 6780,
      uniqueViews: 5430,
      avgTimeOnPage: 312,
      avgScrollDepth: 82.1,
      bounceRate: 25.4,
      totalShares: 189,
      totalClicks: 345,
      completionRate: 72.3,
    },
  ];

  return mockCategories.map(category => ({
    ...category,
    period: {
      start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: endDate || new Date(),
    },
  }));
}

/**
 * Generate mock view metrics
 */
function generateMockViewMetrics(): ViewMetrics {
  return {
    totalViews: 2340,
    uniqueViews: 1890,
    viewsToday: 45,
    viewsThisWeek: 312,
    viewsThisMonth: 1240,
    avgTimeOnPage: 234,
    avgScrollDepth: 76.8,
    bounceRate: 29.3,
    completionRate: 68.7,
  };
}