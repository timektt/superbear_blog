import { NextResponse } from 'next/server';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { getCircuitBreakerStats } from '@/lib/circuit-breaker';
import { IS_DB_CONFIGURED, safeEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SystemStatus {
  timestamp: string;
  environment: string;
  database: {
    configured: boolean;
    connected: boolean;
    safeMode: boolean;
  };
  circuitBreaker: {
    state: string;
    failures: number;
    successes: number;
    lastFailureTime?: number;
    nextAttemptTime?: number;
  };
  services: {
    cron: {
      lastRun?: string;
      status: 'unknown' | 'healthy' | 'error';
    };
    queue: {
      depth: number;
      status: 'unknown' | 'healthy' | 'error';
    };
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    nodeVersion: string;
  };
}

export async function GET(): Promise<NextResponse<SystemStatus>> {
  const startTime = Date.now();

  // Check database connection
  let dbConnected = false;
  try {
    const prisma = getSafePrismaClient();
    if (prisma) {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    }
  } catch {
    dbConnected = false;
  }

  // Get circuit breaker stats
  const breakerStats = getCircuitBreakerStats();

  // Get memory usage
  const memoryUsage = process.memoryUsage();
  const memoryPercentage = Math.round(
    (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  );

  // Check cron status (simplified - would need actual cron tracking in production)
  const cronStatus = {
    lastRun: undefined as string | undefined,
    status: 'unknown' as const,
  };

  // Check queue depth (simplified - would need actual queue implementation)
  const queueStatus = {
    depth: 0,
    status: 'unknown' as const,
  };

  const systemStatus: SystemStatus = {
    timestamp: new Date().toISOString(),
    environment: safeEnv.NODE_ENV,
    database: {
      configured: IS_DB_CONFIGURED,
      connected: dbConnected,
      safeMode: !IS_DB_CONFIGURED || !dbConnected,
    },
    circuitBreaker: {
      state: breakerStats.state,
      failures: breakerStats.failures,
      successes: breakerStats.successes,
      lastFailureTime: breakerStats.lastFailureTime,
      nextAttemptTime: breakerStats.nextAttemptTime,
    },
    services: {
      cron: cronStatus,
      queue: queueStatus,
    },
    system: {
      uptime: Math.round(process.uptime()),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        percentage: memoryPercentage,
      },
      nodeVersion: process.version,
    },
  };

  logger.debug('System status check', {
    status: systemStatus,
    responseTime: Date.now() - startTime,
  });

  return NextResponse.json(systemStatus, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      Pragma: 'no-cache',
    },
  });
}
