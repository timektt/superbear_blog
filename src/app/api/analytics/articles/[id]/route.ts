import { NextRequest, NextResponse } from 'next/server';
import { getArticleAnalytics } from '@/lib/analytics-core';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export const runtime = 'nodejs';

// GET /api/analytics/articles/[id] - Get article analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'VIEWER');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    let timeRange: { start: Date; end: Date } | undefined;
    
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    }

    const analytics = await getArticleAnalytics(params.id, timeRange);

    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    logger.error('Failed to get article analytics', error as Error, { articleId: params.id });
    return NextResponse.json(
      { error: 'Failed to get article analytics' },
      { status: 500 }
    );
  }
}