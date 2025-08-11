import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface HealthCheck {
  name: string;
  status: 'ok' | 'error';
  responseTime?: number;
  error?: string;
}

export async function GET() {
  const startTime = Date.now();
  const checks: HealthCheck[] = [];
  let overallStatus = 'ok';

  // Database connectivity check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      name: 'database',
      status: 'ok',
      responseTime: Date.now() - dbStart,
    });
  } catch (error) {
    overallStatus = 'error';
    checks.push({
      name: 'database',
      status: 'error',
      error:
        process.env.NODE_ENV === 'development'
          ? String(error)
          : 'Database connection failed',
    });
  }

  // Cloudinary connectivity check (optional)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudinaryStart = Date.now();
      const response = await fetch(
        `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'HEAD' }
      );
      checks.push({
        name: 'cloudinary',
        status: response.ok ? 'ok' : 'error',
        responseTime: Date.now() - cloudinaryStart,
      });
    } catch (error) {
      checks.push({
        name: 'cloudinary',
        status: 'error',
        error: 'Cloudinary connection failed',
      });
    }
  }

  // Memory usage check
  const memoryUsage = process.memoryUsage();
  checks.push({
    name: 'memory',
    status: memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'ok' : 'error', // 500MB threshold
    responseTime: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
  });

  const healthData = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    responseTime: Date.now() - startTime,
    checks,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
    },
  };

  if (overallStatus === 'ok') {
    logger.info('Health check passed', { healthData });
    return NextResponse.json(healthData, { status: 200 });
  } else {
    logger.error('Health check failed', undefined, { healthData });
    return NextResponse.json(healthData, { status: 503 });
  }
}
