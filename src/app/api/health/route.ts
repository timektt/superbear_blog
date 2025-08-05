import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
    };

    logger.info('Health check passed', { healthData });

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    const healthData = {
      status: 'error',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'disconnected',
      error:
        process.env.NODE_ENV === 'development'
          ? String(error)
          : 'Database connection failed',
    };

    logger.error(
      'Health check failed',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(healthData, { status: 503 });
  }
}
