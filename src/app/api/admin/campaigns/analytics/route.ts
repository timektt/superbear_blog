import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { getDashboardAnalytics } from '@/lib/analytics/queries';
import { handleApiError } from '@/lib/errors/handlers';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/campaigns/analytics - Get campaign analytics dashboard data
export async function GET(request: NextRequest) {
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
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
    }

    logger.info(`Fetching campaign analytics for ${days} days`);

    // Get dashboard analytics
    const analytics = await getDashboardAnalytics(days);

    return NextResponse.json({
      success: true,
      data: analytics,
      meta: {
        days,
        generatedAt: new Date().toISOString(),
        userId: authResult.user?.id,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch campaign analytics', error as Error);
    return handleApiError(error);
  }
}

// POST /api/admin/campaigns/analytics - Refresh analytics data
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { days = 7 } = await request.json();
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
    }

    logger.info(`Refreshing campaign analytics for ${days} days`);

    // Get fresh analytics data
    const analytics = await getDashboardAnalytics(days);

    return NextResponse.json({
      success: true,
      data: analytics,
      refreshed: true,
      meta: {
        days,
        generatedAt: new Date().toISOString(),
        userId: authResult.user?.id,
      },
    });
  } catch (error) {
    logger.error('Failed to refresh campaign analytics', error as Error);
    return handleApiError(error);
  }
}