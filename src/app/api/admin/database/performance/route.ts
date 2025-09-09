/**
 * Database Performance Monitoring API
 *
 * Provides real-time database performance metrics and query logs
 * for admin monitoring and debugging purposes.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPerformanceMonitoringData,
  performanceMonitor,
} from '@/lib/database/performance-monitor';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Apply rate limiting for admin endpoints
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const dataType = searchParams.get('type') || 'summary';
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    switch (dataType) {
      case 'summary':
        const performanceData = getPerformanceMonitoringData();
        return NextResponse.json({
          type: 'performance_summary',
          timestamp: new Date().toISOString(),
          ...performanceData,
        });

      case 'recent':
        const recentLogs = performanceMonitor.getRecentLogs(
          Math.min(limit, 100)
        );
        return NextResponse.json({
          type: 'recent_queries',
          timestamp: new Date().toISOString(),
          queries: recentLogs,
          count: recentLogs.length,
        });

      case 'slow':
        const threshold = parseInt(searchParams.get('threshold') || '100', 10);
        const slowQueries = performanceMonitor.getSlowQueries(threshold);
        return NextResponse.json({
          type: 'slow_queries',
          timestamp: new Date().toISOString(),
          threshold,
          queries: slowQueries.slice(0, Math.min(limit, 100)),
          count: slowQueries.length,
        });

      case 'stats':
        const stats = performanceMonitor.getPerformanceStats();
        const modelStats = performanceMonitor.getModelStats();
        return NextResponse.json({
          type: 'performance_stats',
          timestamp: new Date().toISOString(),
          overall: stats,
          byModel: modelStats,
        });

      default:
        return NextResponse.json(
          {
            error: 'Invalid data type',
            message: `Data type '${dataType}' is not supported`,
            supportedTypes: ['summary', 'recent', 'slow', 'stats'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Performance monitoring API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve performance data',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        type: dataType,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for performance monitoring actions
 */
export async function POST(request: NextRequest) {
  // Apply stricter rate limiting for actions
  const rateLimitResult = await rateLimit(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '300' } }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear_logs':
        performanceMonitor.clearLogs();
        return NextResponse.json({
          action: 'clear_logs',
          timestamp: new Date().toISOString(),
          message: 'Performance logs cleared successfully',
        });

      case 'export_slow_queries':
        const threshold = body.threshold || 100;
        const slowQueries = performanceMonitor.getSlowQueries(threshold);

        // In a real implementation, you might save this to a file or send via email
        return NextResponse.json({
          action: 'export_slow_queries',
          timestamp: new Date().toISOString(),
          threshold,
          count: slowQueries.length,
          queries: slowQueries,
          message: `Exported ${slowQueries.length} slow queries (>${threshold}ms)`,
        });

      case 'get_query_recommendations':
        const stats = performanceMonitor.getPerformanceStats();
        const modelStats = performanceMonitor.getModelStats();

        const recommendations = [];

        // Generate recommendations based on performance data
        if (stats.slowQueries > stats.totalQueries * 0.1) {
          recommendations.push(
            'High percentage of slow queries detected. Consider reviewing indexes.'
          );
        }

        if (stats.averageExecutionTime > 100) {
          recommendations.push(
            'Average query execution time is high. Review query optimization.'
          );
        }

        // Model-specific recommendations
        Object.entries(modelStats).forEach(([model, modelStat]) => {
          if (modelStat.slowQueries > modelStat.count * 0.2) {
            recommendations.push(
              `Model '${model}' has many slow queries. Review ${model} table indexes.`
            );
          }
        });

        if (recommendations.length === 0) {
          recommendations.push(
            'Query performance looks good! Continue monitoring.'
          );
        }

        return NextResponse.json({
          action: 'get_query_recommendations',
          timestamp: new Date().toISOString(),
          recommendations,
          basedOn: {
            totalQueries: stats.totalQueries,
            slowQueries: stats.slowQueries,
            averageTime: stats.averageExecutionTime,
          },
        });

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            message: `Action '${action}' is not supported`,
            supportedActions: [
              'clear_logs',
              'export_slow_queries',
              'get_query_recommendations',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Performance monitoring action error:', error);
    return NextResponse.json(
      {
        error: 'Action failed',
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
