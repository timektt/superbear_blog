/**
 * Memory optimization management API
 * Admin-only endpoint for memory optimization operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { withMonitoring } from '@/lib/monitoring';
import { memoryMonitor } from '@/lib/memory-monitor';
import { logger } from '@/lib/logger';

async function handleMemoryOptimization(
  req: NextRequest
): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'status';

    switch (req.method) {
      case 'GET':
        return handleGetRequest(action);
      case 'POST':
        return handlePostRequest(req, action);
      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  } catch (error) {
    logger.error(
      'Memory optimization API error',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGetRequest(action: string): Promise<NextResponse> {
  switch (action) {
    case 'status':
      return getMemoryStatus();
    case 'config':
      return getOptimizationConfig();
    case 'stats':
      return getOptimizationStats();
    case 'leak-detection':
      return getLeakDetection();
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function handlePostRequest(
  req: NextRequest,
  action: string
): Promise<NextResponse> {
  switch (action) {
    case 'optimize':
      return optimizeMemory();
    case 'force-gc':
      return forceGarbageCollection();
    case 'update-config':
      return updateConfig(req);
    case 'cleanup-caches':
      return cleanupCaches();
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

async function getMemoryStatus(): Promise<NextResponse> {
  const currentStats = memoryMonitor.getCurrentMemoryStats();
  const memoryHistory = memoryMonitor.getMemoryHistory();
  const pressureLevel = memoryMonitor.getMemoryPressureLevel();
  const trend = memoryMonitor.getMemoryTrend();

  return NextResponse.json({
    currentStats,
    pressureLevel,
    trend,
    historyCount: memoryHistory.length,
    recentHistory: memoryHistory.slice(-10), // Last 10 measurements
  });
}

async function getOptimizationConfig(): Promise<NextResponse> {
  const config = memoryMonitor.getOptimizationConfig();
  return NextResponse.json({ config });
}

async function getOptimizationStats(): Promise<NextResponse> {
  const stats = memoryMonitor.getOptimizationStats();
  return NextResponse.json({ stats });
}

async function getLeakDetection(): Promise<NextResponse> {
  const leakDetection = memoryMonitor.detectMemoryLeaks();
  return NextResponse.json({ leakDetection });
}

async function optimizeMemory(): Promise<NextResponse> {
  try {
    const result = await memoryMonitor.optimizeMemoryUsage();

    return NextResponse.json({
      success: result.success,
      result,
      message: result.success
        ? 'Memory optimization completed successfully'
        : 'Memory optimization failed',
    });
  } catch (error) {
    logger.error(
      'Memory optimization failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Memory optimization failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function forceGarbageCollection(): Promise<NextResponse> {
  try {
    const beforeStats = memoryMonitor.getCurrentMemoryStats();
    const gcResult = memoryMonitor.forceGarbageCollection();

    // Wait a moment for GC to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    const afterStats = memoryMonitor.getCurrentMemoryStats();

    if (!gcResult) {
      return NextResponse.json({
        success: false,
        message: 'Garbage collection not available (requires --expose-gc flag)',
        beforeStats,
        afterStats,
      });
    }

    const memoryFreed =
      beforeStats && afterStats
        ? beforeStats.heapUsed - afterStats.heapUsed
        : 0;

    return NextResponse.json({
      success: true,
      message: 'Garbage collection triggered successfully',
      beforeStats,
      afterStats,
      memoryFreed,
    });
  } catch (error) {
    logger.error(
      'Force GC failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Force garbage collection failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function updateConfig(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Invalid configuration provided' },
        { status: 400 }
      );
    }

    // Validate configuration values
    const validKeys = [
      'enableAutoGC',
      'gcThreshold',
      'enableCacheCleanup',
      'cacheCleanupThreshold',
      'enableMemoryLeakDetection',
      'leakDetectionWindow',
      'maxCacheSize',
      'enableObjectPooling',
    ];

    const invalidKeys = Object.keys(config).filter(
      (key) => !validKeys.includes(key)
    );
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Invalid configuration keys: ${invalidKeys.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate value ranges
    if (
      config.gcThreshold !== undefined &&
      (config.gcThreshold < 50 || config.gcThreshold > 95)
    ) {
      return NextResponse.json(
        { error: 'gcThreshold must be between 50 and 95' },
        { status: 400 }
      );
    }

    if (config.maxCacheSize !== undefined && config.maxCacheSize < 100) {
      return NextResponse.json(
        { error: 'maxCacheSize must be at least 100' },
        { status: 400 }
      );
    }

    memoryMonitor.updateOptimizationConfig(config);
    const updatedConfig = memoryMonitor.getOptimizationConfig();

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    logger.error(
      'Config update failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Configuration update failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function cleanupCaches(): Promise<NextResponse> {
  try {
    const beforeStats = memoryMonitor.getCurrentMemoryStats();

    // Trigger cache cleanup
    memoryMonitor.cleanup();

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 100));

    const afterStats = memoryMonitor.getCurrentMemoryStats();
    const memoryFreed =
      beforeStats && afterStats
        ? beforeStats.heapUsed - afterStats.heapUsed
        : 0;

    return NextResponse.json({
      success: true,
      message: 'Cache cleanup completed successfully',
      beforeStats,
      afterStats,
      memoryFreed,
    });
  } catch (error) {
    logger.error(
      'Cache cleanup failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Cache cleanup failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = withMonitoring(handleMemoryOptimization);
export const POST = withMonitoring(handleMemoryOptimization);
