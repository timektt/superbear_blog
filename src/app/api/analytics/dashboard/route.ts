import { NextRequest, NextResponse } from 'next/server';
import { getTopPerformingArticles } from '@/lib/analytics-core';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// GET /api/analytics/dashboard - Get analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'VIEWER');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || 'week';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top performing articles by different metrics
    const [topByViews, topByEngagement, topByShares, topByTime] =
      await Promise.all([
        getTopPerformingArticles('views', timeRange as any, limit),
        getTopPerformingArticles('engagement', timeRange as any, limit),
        getTopPerformingArticles('shares', timeRange as any, limit),
        getTopPerformingArticles('time', timeRange as any, limit),
      ]);

    // Get overall statistics
    const overallStats = await getOverallAnalyticsStats(timeRange);

    // Get category performance
    const categoryStats = await getCategoryPerformance(timeRange);

    // Get recent activity
    const recentActivity = await getRecentAnalyticsActivity();

    return NextResponse.json({
      success: true,
      data: {
        topPerforming: {
          byViews: topByViews,
          byEngagement: topByEngagement,
          byShares: topByShares,
          byTime: topByTime,
        },
        overallStats,
        categoryStats,
        recentActivity,
      },
    });
  } catch (error) {
    logger.error('Failed to get analytics dashboard data', error as Error);
    return NextResponse.json(
      { error: 'Failed to get analytics dashboard data' },
      { status: 500 }
    );
  }
}

// Helper function to get overall analytics statistics
async function getOverallAnalyticsStats(timeRange: string) {
  const timeFilter = getTimeFilter(timeRange);

  const [totalViews, totalArticles, avgEngagement, totalShares] =
    await Promise.all([
      // Total views
      prisma?.articleView.count({
        where: timeFilter,
      }) || 0,

      // Total published articles
      prisma?.article.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: timeFilter.timestamp,
        },
      }) || 0,

      // Average engagement (completion rate)
      prisma?.articleStats.aggregate({
        _avg: {
          completionRate: true,
          avgTimeOnPage: true,
          bounceRate: true,
        },
      }),

      // Total social shares
      prisma?.articleInteraction.count({
        where: {
          type: 'SOCIAL_SHARE',
          ...timeFilter,
        },
      }) || 0,
    ]);

  return {
    totalViews,
    totalArticles,
    avgCompletionRate: avgEngagement?._avg.completionRate || 0,
    avgTimeOnPage: avgEngagement?._avg.avgTimeOnPage || 0,
    avgBounceRate: avgEngagement?._avg.bounceRate || 0,
    totalShares,
  };
}

// Helper function to get category performance
async function getCategoryPerformance(timeRange: string) {
  const timeFilter = getTimeFilter(timeRange);

  try {
    let categoryStats: Array<{
      categoryName: string;
      categoryId: string;
      totalViews: number;
      uniqueViews: number;
      avgTimeOnPage: number;
      avgScrollDepth: number;
      articleCount: number;
    }> = [];

    if (prisma) {
      if (timeRange === 'all') {
        categoryStats = await prisma.$queryRaw`
          SELECT 
            c.name as categoryName,
            c.id as categoryId,
            COUNT(DISTINCT av.id) as totalViews,
            COUNT(DISTINCT av.fingerprint) as uniqueViews,
            AVG(av.timeOnPage) as avgTimeOnPage,
            AVG(av.scrollDepth) as avgScrollDepth,
            COUNT(DISTINCT a.id) as articleCount
          FROM categories c
          LEFT JOIN articles a ON a.categoryId = c.id AND a.status = 'PUBLISHED'
          LEFT JOIN article_views av ON av.articleId = a.id 
          GROUP BY c.id, c.name
          ORDER BY totalViews DESC
          LIMIT 10
        `;
      } else {
        // For now, return empty array for time-filtered queries
        // TODO: Implement proper time filtering when needed
        categoryStats = [];
      }
    }

    return categoryStats;
  } catch (error) {
    logger.error('Failed to get category performance', error as Error);
    return [];
  }
}

// Helper function to get recent analytics activity
async function getRecentAnalyticsActivity() {
  try {
    const recentViews =
      (await prisma?.articleView.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          article: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      })) || [];

    const recentInteractions =
      (await prisma?.articleInteraction.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          article: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
      })) || [];

    return {
      recentViews: recentViews.map((view) => ({
        id: view.id,
        articleTitle: view.article.title,
        articleSlug: view.article.slug,
        timestamp: view.timestamp,
        device: view.device,
        country: view.country,
      })),
      recentInteractions: recentInteractions.map((interaction) => ({
        id: interaction.id,
        articleTitle: interaction.article.title,
        articleSlug: interaction.article.slug,
        type: interaction.type,
        timestamp: interaction.timestamp,
      })),
    };
  } catch (error) {
    logger.error('Failed to get recent analytics activity', error as Error);
    return {
      recentViews: [],
      recentInteractions: [],
    };
  }
}

// Helper function to get time filter
function getTimeFilter(timeRange: string) {
  const now = new Date();
  let startDate: Date;

  switch (timeRange) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {}; // No filter for 'all'
  }

  return {
    timestamp: {
      gte: startDate,
    },
  };
}

// Helper function to get SQL time range
function getTimeRangeSQL(timeRange: string): string {
  switch (timeRange) {
    case 'today':
      return '1 day';
    case 'week':
      return '7 days';
    case 'month':
      return '30 days';
    case 'quarter':
      return '90 days';
    case 'year':
      return '365 days';
    default:
      return '30 days';
  }
}
