import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { getDashboardAnalytics, getCategoryPerformance, getViewMetrics } from '@/lib/analytics/queries';
import { getAnalyticsSummary, getEngagementMetrics } from '@/lib/analytics/aggregators';
import { handleApiError } from '@/lib/errors/handlers';
import { logger } from '@/lib/logger';
import { compressedApiRoute } from '@/lib/compression';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/campaigns/analytics - Get enhanced analytics with time filtering
async function getHandler(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const type = searchParams.get('type') || 'dashboard'; // dashboard, category, engagement, views
    const articleId = searchParams.get('articleId');
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Parse date parameters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format' },
          { status: 400 }
        );
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format' },
          { status: 400 }
        );
      }
    }

    // Default to days-based range if no specific dates provided
    if (!startDate && !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    logger.info(`Fetching ${type} analytics`, { 
      days, 
      startDate: startDate?.toISOString(), 
      endDate: endDate?.toISOString(),
      articleId 
    });

    let data;
    
    switch (type) {
      case 'category':
        data = await getCategoryPerformance(startDate, endDate);
        break;
      case 'engagement':
        data = await getEngagementMetrics(articleId, startDate, endDate);
        break;
      case 'views':
        data = await getViewMetrics(articleId, startDate, endDate);
        break;
      case 'summary':
        data = await getAnalyticsSummary(startDate!, endDate!);
        break;
      case 'dashboard':
      default:
        data = await getDashboardAnalytics(days);
        break;
    }

    // Set cache headers for performance
    const cacheMaxAge = type === 'dashboard' ? 300 : 600; // 5-10 minutes
    
    return NextResponse.json({
      success: true,
      data,
      meta: {
        type,
        days,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        articleId,
        generatedAt: new Date().toISOString(),
        userId: authResult.user?.id,
      },
    }, {
      headers: {
        'Cache-Control': `public, max-age=${cacheMaxAge}, stale-while-revalidate=300`,
        'Vary': 'Authorization',
      },
    });
  } catch (error) {
    logger.error('Failed to fetch campaign analytics', error as Error);
    return handleApiError(error);
  }
}

// POST /api/admin/campaigns/analytics - Refresh analytics data with time filtering
async function postHandler(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      days = 7, 
      startDate: startDateParam, 
      endDate: endDateParam, 
      type = 'dashboard',
      articleId,
      forceRefresh = false 
    } = await request.json();
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
    }

    // Parse date parameters
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid startDate format' },
          { status: 400 }
        );
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid endDate format' },
          { status: 400 }
        );
      }
    }

    // Default to days-based range if no specific dates provided
    if (!startDate && !endDate) {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    logger.info(`Refreshing ${type} analytics`, { 
      days, 
      startDate: startDate?.toISOString(), 
      endDate: endDate?.toISOString(),
      articleId,
      forceRefresh
    });

    let data;
    
    switch (type) {
      case 'category':
        data = await getCategoryPerformance(startDate, endDate);
        break;
      case 'engagement':
        data = await getEngagementMetrics(articleId, startDate, endDate);
        break;
      case 'views':
        data = await getViewMetrics(articleId, startDate, endDate);
        break;
      case 'summary':
        data = await getAnalyticsSummary(startDate!, endDate!);
        break;
      case 'dashboard':
      default:
        data = await getDashboardAnalytics(days);
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      refreshed: true,
      meta: {
        type,
        days,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        articleId,
        forceRefresh,
        generatedAt: new Date().toISOString(),
        userId: authResult.user?.id,
      },
    });
  } catch (error) {
    logger.error('Failed to refresh campaign analytics', error as Error);
    return handleApiError(error);
  }
}ex
port const GET = compressedApiRoute(getHandler, {
  threshold: 2048, // Compress analytics responses larger than 2KB
  level: 8, // High compression for analytics data
});

export const POST = compressedApiRoute(postHandler, {
  threshold: 2048, // Compress analytics responses larger than 2KB
  level: 8, // High compression for analytics data
});