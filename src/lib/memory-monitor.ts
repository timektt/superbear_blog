/**
 * Memory usage monitoring and optimization utilities
 */

import { logger } from './logger';
import { metricsCollector } from './monitoring';

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsedPercent: number;
  timestamp: number;
}

export interface MemoryOptimizationConfig {
  enableAutoGC: boolean;
  gcThreshold: number; // Percentage threshold to trigger GC
  enableCacheCleanup: boolean;
  cacheCleanupThreshold: number;
  enableMemoryLeakDetection: boolean;
  leakDetectionWindow: number; // Time window in ms
  maxCacheSize: number; // Maximum cache entries
  enableObjectPooling: boolean;
}

export interface MemoryOptimizationResult {
  beforeStats: MemoryStats;
  afterStats: MemoryStats;
  optimizationsApplied: string[];
  memoryFreed: number;
  success: boolean;
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private memoryHistory: MemoryStats[] = [];
  private readonly maxHistorySize = 100;
  private monitoringInterval?: NodeJS.Timeout;
  private optimizationConfig: MemoryOptimizationConfig;
  private cacheRegistry: Map<string, WeakRef<any>> = new Map();
  private objectPools: Map<string, any[]> = new Map();
  private lastOptimization: number = 0;
  private readonly optimizationCooldown = 30000; // 30 seconds

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  constructor() {
    this.optimizationConfig = {
      enableAutoGC: process.env.NODE_ENV === 'production',
      gcThreshold: 85, // Trigger GC at 85% memory usage
      enableCacheCleanup: true,
      cacheCleanupThreshold: 80,
      enableMemoryLeakDetection: true,
      leakDetectionWindow: 300000, // 5 minutes
      maxCacheSize: 1000,
      enableObjectPooling: true,
    };
  }

  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.recordMemoryUsage();
    }, intervalMs);

    // Record initial measurement
    this.recordMemoryUsage();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  recordMemoryUsage(): MemoryStats | null {
    try {
      if (typeof process === 'undefined' || !process.memoryUsage) {
        return null;
      }

      const memUsage = process.memoryUsage();
      const stats: MemoryStats = {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        heapUsedPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        timestamp: Date.now(),
      };

      // Store in history
      this.memoryHistory.push(stats);
      if (this.memoryHistory.length > this.maxHistorySize) {
        this.memoryHistory.shift();
      }

      // Record metrics
      metricsCollector.recordMetric('memory_heap_used', stats.heapUsed);
      metricsCollector.recordMetric('memory_heap_total', stats.heapTotal);
      metricsCollector.recordMetric(
        'memory_heap_percent',
        stats.heapUsedPercent
      );
      metricsCollector.recordMetric('memory_rss', stats.rss);

      // Log warnings for high memory usage and trigger optimization
      if (stats.heapUsedPercent > 90) {
        logger.warn('High memory usage detected', {
          heapUsedPercent: stats.heapUsedPercent.toFixed(1),
          heapUsed: this.formatBytes(stats.heapUsed),
          heapTotal: this.formatBytes(stats.heapTotal),
        });
      }

      // Trigger automatic optimization if enabled and threshold reached
      if (
        this.optimizationConfig.enableAutoGC &&
        stats.heapUsedPercent > this.optimizationConfig.gcThreshold &&
        Date.now() - this.lastOptimization > this.optimizationCooldown
      ) {
        this.optimizeMemoryUsage().catch((error) => {
          logger.error(
            'Auto memory optimization failed',
            error instanceof Error ? error : new Error(String(error))
          );
        });
      }

      return stats;
    } catch (error) {
      logger.error(
        'Failed to record memory usage',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  getCurrentMemoryStats(): MemoryStats | null {
    return this.recordMemoryUsage();
  }

  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  getMemoryTrend(windowMs: number = 300000): {
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    samples: number;
  } {
    const cutoff = Date.now() - windowMs;
    const recentStats = this.memoryHistory.filter(
      (stat) => stat.timestamp > cutoff
    );

    if (recentStats.length < 2) {
      return { trend: 'stable', changePercent: 0, samples: recentStats.length };
    }

    const first = recentStats[0];
    const last = recentStats[recentStats.length - 1];
    const changePercent =
      ((last.heapUsedPercent - first.heapUsedPercent) / first.heapUsedPercent) *
      100;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
    } else if (changePercent > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      trend,
      changePercent: Math.abs(changePercent),
      samples: recentStats.length,
    };
  }

  forceGarbageCollection(): boolean {
    try {
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
        logger.info('Manual garbage collection triggered');
        return true;
      }
      return false;
    } catch (error) {
      logger.error(
        'Failed to trigger garbage collection',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  getMemoryPressureLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const current = this.getCurrentMemoryStats();
    if (!current) return 'low';

    if (current.heapUsedPercent > 95) return 'critical';
    if (current.heapUsedPercent > 85) return 'high';
    if (current.heapUsedPercent > 70) return 'medium';
    return 'low';
  }

  private formatBytes(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  // Cleanup old metrics to prevent memory leaks
  cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // Keep 24 hours
    this.memoryHistory = this.memoryHistory.filter(
      (stat) => stat.timestamp > cutoff
    );
  }

  // Comprehensive memory optimization
  async optimizeMemoryUsage(): Promise<MemoryOptimizationResult> {
    const beforeStats = this.getCurrentMemoryStats();
    if (!beforeStats) {
      return {
        beforeStats: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0,
          heapUsedPercent: 0,
          timestamp: Date.now(),
        },
        afterStats: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0,
          heapUsedPercent: 0,
          timestamp: Date.now(),
        },
        optimizationsApplied: [],
        memoryFreed: 0,
        success: false,
      };
    }

    const optimizationsApplied: string[] = [];
    this.lastOptimization = Date.now();

    try {
      // 1. Clean up weak references and expired cache entries
      if (this.optimizationConfig.enableCacheCleanup) {
        this.cleanupCaches();
        optimizationsApplied.push('cache_cleanup');
      }

      // 2. Clean up object pools
      if (this.optimizationConfig.enableObjectPooling) {
        this.cleanupObjectPools();
        optimizationsApplied.push('object_pool_cleanup');
      }

      // 3. Clean up old monitoring data
      this.cleanup();
      optimizationsApplied.push('monitoring_data_cleanup');

      // 4. Force garbage collection if available
      if (this.forceGarbageCollection()) {
        optimizationsApplied.push('garbage_collection');
      }

      // 5. Clean up Node.js internal caches
      this.cleanupNodeCaches();
      optimizationsApplied.push('node_cache_cleanup');

      // Wait a moment for GC to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const afterStats = this.getCurrentMemoryStats();
      if (!afterStats) {
        throw new Error('Failed to get memory stats after optimization');
      }

      const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;

      logger.info('Memory optimization completed', {
        beforeHeapUsed: this.formatBytes(beforeStats.heapUsed),
        afterHeapUsed: this.formatBytes(afterStats.heapUsed),
        memoryFreed: this.formatBytes(memoryFreed),
        optimizationsApplied,
        heapUsedPercentBefore: beforeStats.heapUsedPercent.toFixed(1),
        heapUsedPercentAfter: afterStats.heapUsedPercent.toFixed(1),
      });

      return {
        beforeStats,
        afterStats,
        optimizationsApplied,
        memoryFreed,
        success: true,
      };
    } catch (error) {
      logger.error(
        'Memory optimization failed',
        error instanceof Error ? error : new Error(String(error))
      );

      const afterStats = this.getCurrentMemoryStats() || beforeStats;
      return {
        beforeStats,
        afterStats,
        optimizationsApplied,
        memoryFreed: 0,
        success: false,
      };
    }
  }

  // Clean up weak references and expired cache entries
  private cleanupCaches(): void {
    let cleanedCount = 0;

    // Clean up weak references
    for (const [key, weakRef] of this.cacheRegistry.entries()) {
      if (weakRef.deref() === undefined) {
        this.cacheRegistry.delete(key);
        cleanedCount++;
      }
    }

    // Limit cache size
    if (this.cacheRegistry.size > this.optimizationConfig.maxCacheSize) {
      const keysToDelete = Array.from(this.cacheRegistry.keys()).slice(
        0,
        this.cacheRegistry.size - this.optimizationConfig.maxCacheSize
      );

      keysToDelete.forEach((key) => {
        this.cacheRegistry.delete(key);
        cleanedCount++;
      });
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} cache entries`);
    }
  }

  // Clean up object pools
  private cleanupObjectPools(): void {
    let cleanedCount = 0;

    for (const [poolName, pool] of this.objectPools.entries()) {
      // Keep only a reasonable number of pooled objects
      const maxPoolSize = 50;
      if (pool.length > maxPoolSize) {
        const removed = pool.splice(maxPoolSize);
        cleanedCount += removed.length;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cleaned up ${cleanedCount} pooled objects`);
    }
  }

  // Clean up Node.js internal caches
  private cleanupNodeCaches(): void {
    try {
      // Clear require cache for non-core modules (be very careful with this)
      if (typeof require !== 'undefined' && require.cache) {
        const cacheKeys = Object.keys(require.cache);
        let clearedCount = 0;

        // Only clear cache for specific patterns that are safe to clear
        const safeToClearPatterns = [/\/tmp\//, /\.temp\./, /\.cache\./];

        cacheKeys.forEach((key) => {
          if (safeToClearPatterns.some((pattern) => pattern.test(key))) {
            delete require.cache[key];
            clearedCount++;
          }
        });

        if (clearedCount > 0) {
          logger.debug(`Cleared ${clearedCount} require cache entries`);
        }
      }
    } catch (error) {
      logger.warn('Failed to clean Node.js caches', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Register cache entry for tracking
  registerCacheEntry(key: string, value: any): void {
    if (this.optimizationConfig.enableCacheCleanup) {
      this.cacheRegistry.set(key, new WeakRef(value));
    }
  }

  // Get object from pool or create new one
  getPooledObject<T>(poolName: string, factory: () => T): T {
    if (!this.optimizationConfig.enableObjectPooling) {
      return factory();
    }

    if (!this.objectPools.has(poolName)) {
      this.objectPools.set(poolName, []);
    }

    const pool = this.objectPools.get(poolName)!;
    const pooledObject = pool.pop();

    if (pooledObject) {
      return pooledObject as T;
    }

    return factory();
  }

  // Return object to pool
  returnToPool(poolName: string, object: any): void {
    if (!this.optimizationConfig.enableObjectPooling) {
      return;
    }

    if (!this.objectPools.has(poolName)) {
      this.objectPools.set(poolName, []);
    }

    const pool = this.objectPools.get(poolName)!;

    // Don't let pools grow too large
    if (pool.length < 20) {
      // Reset object state if it has a reset method
      if (typeof object.reset === 'function') {
        object.reset();
      }
      pool.push(object);
    }
  }

  // Detect potential memory leaks
  detectMemoryLeaks(): {
    hasLeak: boolean;
    leakSeverity: 'low' | 'medium' | 'high';
    details: string[];
  } {
    if (!this.optimizationConfig.enableMemoryLeakDetection) {
      return { hasLeak: false, leakSeverity: 'low', details: [] };
    }

    const windowMs = this.optimizationConfig.leakDetectionWindow;
    const cutoff = Date.now() - windowMs;
    const recentStats = this.memoryHistory.filter(
      (stat) => stat.timestamp > cutoff
    );

    if (recentStats.length < 10) {
      return {
        hasLeak: false,
        leakSeverity: 'low',
        details: ['Insufficient data for leak detection'],
      };
    }

    const details: string[] = [];
    let hasLeak = false;
    let leakSeverity: 'low' | 'medium' | 'high' = 'low';

    // Check for consistent memory growth
    const first = recentStats[0];
    const last = recentStats[recentStats.length - 1];
    const memoryGrowth = last.heapUsed - first.heapUsed;
    const growthPercent = (memoryGrowth / first.heapUsed) * 100;

    if (growthPercent > 50) {
      hasLeak = true;
      leakSeverity = 'high';
      details.push(
        `Significant memory growth: ${growthPercent.toFixed(1)}% over ${windowMs / 1000}s`
      );
    } else if (growthPercent > 20) {
      hasLeak = true;
      leakSeverity = 'medium';
      details.push(
        `Moderate memory growth: ${growthPercent.toFixed(1)}% over ${windowMs / 1000}s`
      );
    } else if (growthPercent > 10) {
      hasLeak = true;
      leakSeverity = 'low';
      details.push(
        `Minor memory growth: ${growthPercent.toFixed(1)}% over ${windowMs / 1000}s`
      );
    }

    // Check for consistently high memory usage
    const highUsageCount = recentStats.filter(
      (stat) => stat.heapUsedPercent > 80
    ).length;
    const highUsagePercent = (highUsageCount / recentStats.length) * 100;

    if (highUsagePercent > 80) {
      hasLeak = true;
      if (leakSeverity === 'low') leakSeverity = 'medium';
      details.push(
        `High memory usage ${highUsagePercent.toFixed(1)}% of the time`
      );
    }

    // Check cache registry size
    if (this.cacheRegistry.size > this.optimizationConfig.maxCacheSize * 1.5) {
      hasLeak = true;
      details.push(
        `Cache registry oversized: ${this.cacheRegistry.size} entries`
      );
    }

    return { hasLeak, leakSeverity, details };
  }

  // Update optimization configuration
  updateOptimizationConfig(config: Partial<MemoryOptimizationConfig>): void {
    this.optimizationConfig = { ...this.optimizationConfig, ...config };
    logger.info('Memory optimization configuration updated', config);
  }

  // Get optimization configuration
  getOptimizationConfig(): MemoryOptimizationConfig {
    return { ...this.optimizationConfig };
  }

  // Get memory optimization statistics
  getOptimizationStats(): {
    lastOptimization: number;
    cacheRegistrySize: number;
    objectPoolsCount: number;
    totalPooledObjects: number;
    optimizationConfig: MemoryOptimizationConfig;
  } {
    const totalPooledObjects = Array.from(this.objectPools.values()).reduce(
      (total, pool) => total + pool.length,
      0
    );

    return {
      lastOptimization: this.lastOptimization,
      cacheRegistrySize: this.cacheRegistry.size,
      objectPoolsCount: this.objectPools.size,
      totalPooledObjects,
      optimizationConfig: this.optimizationConfig,
    };
  }
}

// Export singleton instance
export const memoryMonitor = MemoryMonitor.getInstance();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  memoryMonitor.startMonitoring(60000); // Monitor every minute
}

// Cleanup old data every hour
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      memoryMonitor.cleanup();
    },
    60 * 60 * 1000
  );
}
