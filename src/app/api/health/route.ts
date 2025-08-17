import { NextResponse } from 'next/server';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { logger } from '@/lib/logger';
import { safeEnv } from '@/lib/env';
import { withCircuitBreaker, getCircuitBreakerStats } from '@/lib/circuit-breaker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HealthStatus = 'ok' | 'degraded' | 'down';

interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  responseTime: number;
  database: {
    status: HealthStatus;
    responseTime?: number;
    error?: string;
  };
  circuitBreaker: {
    state: string;
    failures: number;
    successes: number;
  };
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startTime = Date.now();
  let dbStatus: HealthStatus = 'down';
  let dbResponseTime: number | undefined;
  let dbError: string | undefined;

  // Database health check with circuit breaker and timeout
  try {
    const result = await withCircuitBreaker(
      async () => {
        const dbStart = Date.now();
        const prisma = getSafePrismaClient();
        
        if (!prisma) {
          throw new Error('Database client unavailable');
        }

        // Race between query and timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database timeout')), safeEnv.DB_HEALTHCHECK_TIMEOUT_MS);
        });

        const queryPromise = prisma.$queryRaw`SELECT 1 as health_check`;
        
        await Promise.race([queryPromise, timeoutPromise]);
        
        const responseTime = Date.now() - dbStart;
        
        // Determine status based on response time
        if (responseTime < 500) {
          return { status: 'ok' as const, responseTime };
        } else if (responseTime < 1000) {
          return { status: 'degraded' as const, responseTime };
        } else {
          return { status: 'degraded' as const, responseTime };
        }
      },
      // Fallback when circuit is open
      async () => {
        return { status: 'degraded' as const, responseTime: 0 };
      }
    );

    dbStatus = result.status;
    dbResponseTime = result.responseTime;
  } catch (error) {
    dbStatus = 'down';
    dbError = error instanceof Error ? error.message : 'Database check failed';
    logger.warn('Database health check failed', error as Error);
  }

  // Get circuit breaker stats
  const breakerStats = getCircuitBreakerStats();

  // Determine overall status
  let overallStatus: HealthStatus = 'ok';
  if (dbStatus === 'down' || breakerStats.state === 'open') {
    overallStatus = 'down';
  } else if (dbStatus === 'degraded' || breakerStats.state === 'half-open') {
    overallStatus = 'degraded';
  }

  const healthResponse: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    database: {
      status: dbStatus,
      responseTime: dbResponseTime,
      error: dbError,
    },
    circuitBreaker: {
      state: breakerStats.state,
      failures: breakerStats.failures,
      successes: breakerStats.successes,
    },
  };

  // Log health check result
  if (overallStatus === 'ok') {
    logger.debug('Health check passed', { health: healthResponse });
  } else {
    logger.warn('Health check degraded/failed', { health: healthResponse });
  }

  // Return appropriate HTTP status
  const httpStatus = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;
  
  return NextResponse.json(healthResponse, { 
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}