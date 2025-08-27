/**
 * Public health monitoring endpoint
 * Provides basic health status without sensitive information
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withMonitoring,
  getHealthStatus,
  metricsCollector,
} from '@/lib/monitoring';

async function handleHealthCheck(req: NextRequest): Promise<NextResponse> {
  try {
    const healthStatus = getHealthStatus();
    const systemMetrics = metricsCollector.getSystemMetrics();

    // Public health information (no sensitive data)
    const publicHealth = {
      status: healthStatus.status,
      timestamp: healthStatus.timestamp,
      uptime: systemMetrics.uptime,
      responseTime: systemMetrics.averageResponseTime,
      version: process.env.npm_package_version || '1.0.0',
    };

    // Set appropriate HTTP status based on health
    const httpStatus =
      healthStatus.status === 'healthy'
        ? 200
        : healthStatus.status === 'degraded'
          ? 200
          : 503;

    return NextResponse.json(publicHealth, { status: httpStatus });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

export const GET = withMonitoring(handleHealthCheck);
