import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const redis = getRedisClient();

    const health = {
      redis: {
        connected: false,
        latency: null as number | null,
        memory: null as any,
        error: null as string | null,
      },
      timestamp: new Date().toISOString(),
    };

    if (redis) {
      try {
        const start = Date.now();
        await redis.ping();
        const latency = Date.now() - start;

        health.redis.connected = true;
        health.redis.latency = latency;

        // Get Redis memory info
        const info = await redis.info('memory');
        health.redis.memory = info;
      } catch (error) {
        health.redis.error =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error('Redis health check failed:', error as Error);
      }
    } else {
      health.redis.error = 'Redis not configured';
    }

    const status = health.redis.connected ? 200 : 503;

    return NextResponse.json(health, {
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    logger.error('Cache health check error:', error as Error);

    return NextResponse.json(
      {
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
