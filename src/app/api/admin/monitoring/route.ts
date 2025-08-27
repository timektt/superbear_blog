/**
 * Admin monitoring API endpoint
 * Provides comprehensive monitoring data and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withMonitoring,
  metricsCollector,
  getHealthStatus,
} from '@/lib/monitoring';
import { logger } from '@/lib/logger';

async function handleMonitoringRequest(
  req: NextRequest
): Promise<NextResponse> {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'overview';
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const window = parseInt(url.searchParams.get('window') || '3600000'); // 1 hour default

  try {
    switch (action) {
      case 'overview':
        return NextResponse.json({
          systemMetrics: metricsCollector.getSystemMetrics(),
          healthStatus: getHealthStatus(),
          recentRequests: metricsCollector.getRecentRequests(10),
          windowMetrics: metricsCollector.getMetricsInWindow(window),
        });

      case 'metrics':
        return NextResponse.json({
          allMetrics: metricsCollector.getAllMetrics(),
          systemMetrics: metricsCollector.getSystemMetrics(),
        });

      case 'requests':
        const path = url.searchParams.get('path');
        const requests = path
          ? metricsCollector.getRequestsByPath(path, limit)
          : metricsCollector.getRecentRequests(limit);

        return NextResponse.json({ requests });

      case 'errors':
        return NextResponse.json({
          errorRequests: metricsCollector.getErrorRequests(limit),
          errorRate: metricsCollector.getMetricsInWindow(window).errorRate,
        });

      case 'slow':
        const threshold = parseInt(url.searchParams.get('threshold') || '1000');
        return NextResponse.json({
          slowRequests: metricsCollector.getSlowRequests(threshold, limit),
          threshold,
        });

      case 'health':
        return NextResponse.json(getHealthStatus());

      case 'clear':
        if (req.method === 'POST') {
          metricsCollector.clearMetrics();
          logger.info('Monitoring metrics cleared by admin');
          return NextResponse.json({
            success: true,
            message: 'Metrics cleared',
          });
        }
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error(
      'Monitoring API error',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withMonitoring(handleMonitoringRequest);
export const POST = withMonitoring(handleMonitoringRequest);
