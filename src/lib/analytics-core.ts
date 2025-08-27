import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

// Privacy-compliant analytics core library

export interface AnalyticsEvent {
  articleId: string;
  sessionId: string;
  type: 'view' | 'interaction';
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ViewEvent extends AnalyticsEvent {
  type: 'view';
  userAgent?: string;
  referrer?: string;
  country?: string;
  device?: string;
}

export interface InteractionEvent extends AnalyticsEvent {
  type: 'interaction';
  interactionType:
    | 'LINK_CLICK'
    | 'SOCIAL_SHARE'
    | 'NEWSLETTER_SIGNUP'
    | 'SCROLL_MILESTONE'
    | 'TIME_MILESTONE';
  elementId?: string;
  linkUrl?: string;
  socialPlatform?: string;
  scrollPosition?: number;
  timeFromStart?: number;
}

// Privacy-compliant session ID generation
export function generateSessionId(userAgent: string, ip: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const sessionData = `${userAgent}:${ip}:${today}`;
  return createHash('sha256')
    .update(sessionData)
    .digest('hex')
    .substring(0, 16);
}

// Browser fingerprint generation (privacy-compliant)
export function generateFingerprint(
  userAgent: string,
  acceptLanguage?: string,
  timezone?: string
): string {
  const fingerprintData = `${userAgent}:${acceptLanguage || ''}:${timezone || ''}`;
  return createHash('sha256')
    .update(fingerprintData)
    .digest('hex')
    .substring(0, 12);
}

// Device type detection
export function detectDevice(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

// Track article view
export async function trackArticleView(
  event: ViewEvent
): Promise<string | null> {
  try {
    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: event.articleId },
      select: { id: true, status: true },
    });

    if (!article || article.status !== 'PUBLISHED') {
      return null;
    }

    // Generate fingerprint
    const fingerprint = generateFingerprint(
      event.userAgent || '',
      event.metadata?.acceptLanguage,
      event.metadata?.timezone
    );

    // Create view record
    const view = await prisma.articleView.create({
      data: {
        articleId: event.articleId,
        sessionId: event.sessionId,
        fingerprint,
        timestamp: event.timestamp || new Date(),
        userAgent: event.userAgent,
        referrer: event.referrer,
        country: event.country,
        device: detectDevice(event.userAgent || ''),
      },
    });

    // Update article stats asynchronously
    updateArticleStats(event.articleId).catch((error) => {
      logger.error('Failed to update article stats', error as Error, {
        articleId: event.articleId,
      });
    });

    return view.id;
  } catch (error) {
    logger.error('Failed to track article view', error as Error, {
      articleId: event.articleId,
    });
    return null;
  }
}

// Track article interaction
export async function trackArticleInteraction(
  event: InteractionEvent,
  viewId?: string
): Promise<void> {
  try {
    // If no viewId provided, try to find recent view for this session
    if (!viewId) {
      const recentView = await prisma.articleView.findFirst({
        where: {
          articleId: event.articleId,
          sessionId: event.sessionId,
          timestamp: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // Within last 30 minutes
          },
        },
        orderBy: { timestamp: 'desc' },
      });

      if (!recentView) {
        logger.warn('No recent view found for interaction', {
          articleId: event.articleId,
          sessionId: event.sessionId,
        });
        return;
      }

      viewId = recentView.id;
    }

    // Create interaction record
    await prisma.articleInteraction.create({
      data: {
        viewId,
        articleId: event.articleId,
        type: event.interactionType,
        timestamp: event.timestamp || new Date(),
        elementId: event.elementId,
        linkUrl: event.linkUrl,
        socialPlatform: event.socialPlatform,
        scrollPosition: event.scrollPosition,
        timeFromStart: event.timeFromStart,
      },
    });

    // Update article stats asynchronously
    updateArticleStats(event.articleId).catch((error) => {
      logger.error(
        'Failed to update article stats after interaction',
        error as Error,
        { articleId: event.articleId }
      );
    });
  } catch (error) {
    logger.error('Failed to track article interaction', error as Error, {
      articleId: event.articleId,
    });
  }
}

// Update reading session
export async function updateReadingSession(
  sessionId: string,
  updates: {
    endTime?: Date;
    duration?: number;
    articlesRead?: number;
    totalReadTime?: number;
    pagesViewed?: number;
    exitArticleId?: string;
  }
): Promise<void> {
  try {
    await prisma.readingSession.upsert({
      where: { sessionId },
      update: {
        ...updates,
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        startTime: new Date(),
        ...updates,
      },
    });
  } catch (error) {
    logger.error('Failed to update reading session', error as Error, {
      sessionId,
    });
  }
}

// Update article statistics (aggregated)
export async function updateArticleStats(articleId: string): Promise<void> {
  try {
    // Calculate stats from raw data
    const [viewStats, interactionStats, timeStats, scrollStats] =
      await Promise.all([
        // View statistics
        prisma.articleView.aggregate({
          where: { articleId },
          _count: { id: true },
          _avg: { timeOnPage: true, scrollDepth: true },
        }),

        // Interaction statistics
        prisma.articleInteraction.groupBy({
          by: ['type'],
          where: { articleId },
          _count: { id: true },
        }),

        // Time-based view statistics
        prisma.articleView.groupBy({
          by: ['timestamp'],
          where: {
            articleId,
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          _count: { id: true },
        }),

        // Scroll depth analysis
        prisma.articleView.aggregate({
          where: {
            articleId,
            scrollDepth: { gte: 90 }, // Consider 90%+ as "completed"
          },
          _count: { id: true },
        }),
      ]);

    // Calculate unique views (by fingerprint)
    const uniqueViews = await prisma.articleView.groupBy({
      by: ['fingerprint'],
      where: { articleId },
      _count: { fingerprint: true },
    });

    // Calculate bounce rate
    const bounceViews = await prisma.articleView.count({
      where: {
        articleId,
        bounced: true,
      },
    });

    // Process interaction stats
    const interactionCounts = interactionStats.reduce(
      (acc, stat) => {
        acc[stat.type] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate time-based metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [viewsToday, viewsThisWeek, viewsThisMonth] = await Promise.all([
      prisma.articleView.count({
        where: { articleId, timestamp: { gte: today } },
      }),
      prisma.articleView.count({
        where: { articleId, timestamp: { gte: thisWeek } },
      }),
      prisma.articleView.count({
        where: { articleId, timestamp: { gte: thisMonth } },
      }),
    ]);

    // Update or create stats record
    await prisma.articleStats.upsert({
      where: { articleId },
      update: {
        totalViews: viewStats._count.id,
        uniqueViews: uniqueViews.length,
        avgTimeOnPage: viewStats._avg.timeOnPage,
        avgScrollDepth: viewStats._avg.scrollDepth,
        bounceRate:
          viewStats._count.id > 0
            ? (bounceViews / viewStats._count.id) * 100
            : 0,
        totalShares: interactionCounts.SOCIAL_SHARE || 0,
        totalClicks: interactionCounts.LINK_CLICK || 0,
        newsletterSignups: interactionCounts.NEWSLETTER_SIGNUP || 0,
        completionRate:
          viewStats._count.id > 0
            ? (scrollStats._count.id / viewStats._count.id) * 100
            : 0,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        lastCalculated: new Date(),
      },
      create: {
        articleId,
        totalViews: viewStats._count.id,
        uniqueViews: uniqueViews.length,
        avgTimeOnPage: viewStats._avg.timeOnPage,
        avgScrollDepth: viewStats._avg.scrollDepth,
        bounceRate:
          viewStats._count.id > 0
            ? (bounceViews / viewStats._count.id) * 100
            : 0,
        totalShares: interactionCounts.SOCIAL_SHARE || 0,
        totalClicks: interactionCounts.LINK_CLICK || 0,
        newsletterSignups: interactionCounts.NEWSLETTER_SIGNUP || 0,
        completionRate:
          viewStats._count.id > 0
            ? (scrollStats._count.id / viewStats._count.id) * 100
            : 0,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
      },
    });
  } catch (error) {
    logger.error('Failed to update article stats', error as Error, {
      articleId,
    });
  }
}

// Get article analytics summary
export async function getArticleAnalytics(
  articleId: string,
  timeRange?: {
    start: Date;
    end: Date;
  }
): Promise<{
  stats: any;
  viewTrend: Array<{ date: string; views: number }>;
  topInteractions: Array<{ type: string; count: number }>;
  deviceBreakdown: Array<{ device: string; count: number; percentage: number }>;
  referrerBreakdown: Array<{
    referrer: string;
    count: number;
    percentage: number;
  }>;
}> {
  try {
    // Get current stats
    const stats = await prisma.articleStats.findUnique({
      where: { articleId },
    });

    // Build time filter
    const timeFilter = timeRange
      ? {
          timestamp: {
            gte: timeRange.start,
            lte: timeRange.end,
          },
        }
      : {};

    // Get view trend (last 30 days)
    const viewTrend = (await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as views
      FROM article_views 
      WHERE articleId = ${articleId}
        AND timestamp >= datetime('now', '-30 days')
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `) as Array<{ date: string; views: number }>;

    // Get interaction breakdown
    const topInteractions = await prisma.articleInteraction.groupBy({
      by: ['type'],
      where: {
        articleId,
        ...timeFilter,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Get device breakdown
    const deviceBreakdown = await prisma.articleView.groupBy({
      by: ['device'],
      where: {
        articleId,
        ...timeFilter,
      },
      _count: { id: true },
    });

    // Get referrer breakdown
    const referrerBreakdown = await prisma.articleView.groupBy({
      by: ['referrer'],
      where: {
        articleId,
        referrer: { not: null },
        ...timeFilter,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Calculate percentages
    const totalViews = deviceBreakdown.reduce(
      (sum, item) => sum + item._count.id,
      0
    );
    const totalReferrers = referrerBreakdown.reduce(
      (sum, item) => sum + item._count.id,
      0
    );

    return {
      stats,
      viewTrend,
      topInteractions: topInteractions.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      deviceBreakdown: deviceBreakdown.map((item) => ({
        device: item.device || 'unknown',
        count: item._count.id,
        percentage: totalViews > 0 ? (item._count.id / totalViews) * 100 : 0,
      })),
      referrerBreakdown: referrerBreakdown.map((item) => ({
        referrer: item.referrer || 'direct',
        count: item._count.id,
        percentage:
          totalReferrers > 0 ? (item._count.id / totalReferrers) * 100 : 0,
      })),
    };
  } catch (error) {
    logger.error('Failed to get article analytics', error as Error, {
      articleId,
    });
    throw error;
  }
}

// Get top performing articles
export async function getTopPerformingArticles(
  metric: 'views' | 'engagement' | 'shares' | 'time',
  timeRange: 'today' | 'week' | 'month' | 'all' = 'week',
  limit: number = 10
): Promise<
  Array<{
    articleId: string;
    title: string;
    slug: string;
    value: number;
    change?: number; // Percentage change from previous period
  }>
> {
  try {
    let orderBy: any;
    let selectValue: string;

    switch (metric) {
      case 'views':
        orderBy = { totalViews: 'desc' };
        selectValue = 'totalViews';
        break;
      case 'engagement':
        orderBy = { completionRate: 'desc' };
        selectValue = 'completionRate';
        break;
      case 'shares':
        orderBy = { totalShares: 'desc' };
        selectValue = 'totalShares';
        break;
      case 'time':
        orderBy = { avgTimeOnPage: 'desc' };
        selectValue = 'avgTimeOnPage';
        break;
    }

    const results = await prisma.articleStats.findMany({
      where: {
        article: {
          status: 'PUBLISHED',
        },
      },
      include: {
        article: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    return results.map((stat) => ({
      articleId: stat.articleId,
      title: stat.article.title,
      slug: stat.article.slug,
      value: (stat as any)[selectValue] || 0,
    }));
  } catch (error) {
    logger.error('Failed to get top performing articles', error as Error);
    throw error;
  }
}

// Clean up old analytics data (GDPR compliance)
export async function cleanupOldAnalyticsData(
  retentionDays: number = 365
): Promise<{
  deletedViews: number;
  deletedInteractions: number;
  deletedSessions: number;
}> {
  try {
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    );

    const [deletedViews, deletedInteractions, deletedSessions] =
      await Promise.all([
        prisma.articleView.deleteMany({
          where: {
            timestamp: { lt: cutoffDate },
          },
        }),
        prisma.articleInteraction.deleteMany({
          where: {
            timestamp: { lt: cutoffDate },
          },
        }),
        prisma.readingSession.deleteMany({
          where: {
            startTime: { lt: cutoffDate },
          },
        }),
      ]);

    logger.info('Analytics data cleanup completed', {
      deletedViews: deletedViews.count,
      deletedInteractions: deletedInteractions.count,
      deletedSessions: deletedSessions.count,
      retentionDays,
    });

    return {
      deletedViews: deletedViews.count,
      deletedInteractions: deletedInteractions.count,
      deletedSessions: deletedSessions.count,
    };
  } catch (error) {
    logger.error('Failed to cleanup old analytics data', error as Error);
    throw error;
  }
}
