import { NextRequest, NextResponse } from 'next/server';
import {
  collectMetrics,
  getCurrentAlerts,
  getMetricsHistory,
} from '@/lib/observability';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// GET /api/admin/metrics - Get system metrics and alerts
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'VIEWER');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeHistory = searchParams.get('history') === 'true';
    const hours = parseInt(searchParams.get('hours') || '24');
    const severity = searchParams.get('severity') as
      | 'low'
      | 'medium'
      | 'high'
      | 'critical'
      | undefined;

    // Collect current metrics
    const currentMetrics = await collectMetrics();

    // Get current alerts
    const alerts = getCurrentAlerts(severity);

    // Get metrics history if requested
    const history = includeHistory ? getMetricsHistory(hours) : undefined;

    return NextResponse.json({
      success: true,
      data: {
        current: currentMetrics,
        alerts,
        ...(history && { history }),
      },
    });
  } catch (error) {
    logger.error('Failed to get metrics', error as Error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
