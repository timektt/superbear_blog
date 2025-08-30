import { logger } from '../logger';
import { cache } from '../redis';

export interface UploadMetrics {
  uploadId: string;
  filename: string;
  fileSize: number;
  compressionRatio?: number;
  uploadDuration: number;
  processingDuration: number;
  networkDuration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
  userAgent?: string;
  connectionType?: string;
}

export interface PerformanceStats {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  averageUploadTime: number;
  averageFileSize: number;
  averageCompressionRatio: number;
  successRate: number;
  commonErrors: Record<string, number>;
  performanceTrends: {
    hourly: Record<string, number>;
    daily: Record<string, number>;
  };
}

/**
 * Upload performance monitoring and analytics
 */
export class UploadPerformanceMonitor {
  private static readonly METRICS_CACHE_KEY = 'upload:metrics:';
  private static readonly STATS_CACHE_KEY = 'upload:stats';
  private static readonly CACHE_TTL = 60 * 60 * 24; // 24 hours

  /**
   * Record upload metrics
   */
  static async recordMetrics(metrics: UploadMetrics): Promise<void> {
    try {
      const key = `${this.METRICS_CACHE_KEY}${metrics.uploadId}`;
      await cache.set(key, metrics, this.CACHE_TTL);

      // Update aggregated stats
      await this.updateAggregatedStats(metrics);

      logger.info('Upload metrics recorded', {
        uploadId: metrics.uploadId,
        success: metrics.success,
        duration: metrics.uploadDuration,
        fileSize: metrics.fileSize,
      });
    } catch (error) {
      logger.error('Failed to record upload metrics:', error);
    }
  }

  /**
   * Get performance statistics
   */
  static async getPerformanceStats(timeRange?: {
    from: Date;
    to: Date;
  }): Promise<PerformanceStats> {
    try {
      // Try to get cached stats first
      const cached = await cache.get<PerformanceStats>(this.STATS_CACHE_KEY);
      if (cached && !timeRange) {
        return cached;
      }

      // Calculate stats from individual metrics
      const stats = await this.calculateStats(timeRange);
      
      // Cache the results if no specific time range
      if (!timeRange) {
        await cache.set(this.STATS_CACHE_KEY, stats, 60 * 30); // Cache for 30 minutes
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get performance stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Get upload metrics for a specific upload
   */
  static async getUploadMetrics(uploadId: string): Promise<UploadMetrics | null> {
    try {
      const key = `${this.METRICS_CACHE_KEY}${uploadId}`;
      return await cache.get<UploadMetrics>(key);
    } catch (error) {
      logger.error('Failed to get upload metrics:', error);
      return null;
    }
  }

  /**
   * Get recent upload performance trends
   */
  static async getPerformanceTrends(hours: number = 24): Promise<{
    uploadCounts: Record<string, number>;
    averageTimes: Record<string, number>;
    successRates: Record<string, number>;
  }> {
    try {
      const now = new Date();
      const trends = {
        uploadCounts: {} as Record<string, number>,
        averageTimes: {} as Record<string, number>,
        successRates: {} as Record<string, number>,
      };

      // Generate hourly buckets
      for (let i = 0; i < hours; i++) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourKey = hour.toISOString().slice(0, 13); // YYYY-MM-DDTHH

        trends.uploadCounts[hourKey] = 0;
        trends.averageTimes[hourKey] = 0;
        trends.successRates[hourKey] = 0;
      }

      // This would be populated from actual metrics data
      // For now, return the structure
      return trends;
    } catch (error) {
      logger.error('Failed to get performance trends:', error);
      return {
        uploadCounts: {},
        averageTimes: {},
        successRates: {},
      };
    }
  }

  /**
   * Analyze upload performance and provide recommendations
   */
  static async analyzePerformance(): Promise<{
    recommendations: string[];
    issues: string[];
    optimizations: string[];
  }> {
    try {
      const stats = await this.getPerformanceStats();
      const recommendations: string[] = [];
      const issues: string[] = [];
      const optimizations: string[] = [];

      // Analyze success rate
      if (stats.successRate < 0.95) {
        issues.push(`Low success rate: ${(stats.successRate * 100).toFixed(1)}%`);
        recommendations.push('Investigate common upload failures and improve error handling');
      }

      // Analyze upload times
      if (stats.averageUploadTime > 10000) { // 10 seconds
        issues.push(`Slow average upload time: ${(stats.averageUploadTime / 1000).toFixed(1)}s`);
        recommendations.push('Consider implementing chunked uploads for large files');
        optimizations.push('Enable client-side compression to reduce upload size');
      }

      // Analyze file sizes
      if (stats.averageFileSize > 5 * 1024 * 1024) { // 5MB
        recommendations.push('Implement automatic image compression for large files');
        optimizations.push('Set up responsive image generation');
      }

      // Analyze compression effectiveness
      if (stats.averageCompressionRatio < 1.5) {
        optimizations.push('Improve compression settings for better file size reduction');
      }

      return {
        recommendations,
        issues,
        optimizations,
      };
    } catch (error) {
      logger.error('Failed to analyze performance:', error);
      return {
        recommendations: [],
        issues: [],
        optimizations: [],
      };
    }
  }

  /**
   * Clean up old metrics data
   */
  static async cleanupOldMetrics(olderThanDays: number = 30): Promise<void> {
    try {
      // This would implement cleanup logic for old metrics
      // For now, just log the intent
      logger.info('Cleaning up old upload metrics', { olderThanDays });
    } catch (error) {
      logger.error('Failed to cleanup old metrics:', error);
    }
  }

  /**
   * Update aggregated statistics
   */
  private static async updateAggregatedStats(metrics: UploadMetrics): Promise<void> {
    try {
      // Increment counters
      const hourKey = metrics.timestamp.toISOString().slice(0, 13);
      const dayKey = metrics.timestamp.toISOString().slice(0, 10);

      await Promise.all([
        cache.incr(`upload:count:hour:${hourKey}`, 3600),
        cache.incr(`upload:count:day:${dayKey}`, 86400),
        metrics.success 
          ? cache.incr(`upload:success:hour:${hourKey}`, 3600)
          : cache.incr(`upload:failed:hour:${hourKey}`, 3600),
      ]);

      // Invalidate cached stats to force recalculation
      await cache.del(this.STATS_CACHE_KEY);
    } catch (error) {
      logger.error('Failed to update aggregated stats:', error);
    }
  }

  /**
   * Calculate statistics from metrics data
   */
  private static async calculateStats(timeRange?: {
    from: Date;
    to: Date;
  }): Promise<PerformanceStats> {
    // This would implement actual calculation from stored metrics
    // For now, return default stats
    return this.getDefaultStats();
  }

  /**
   * Get default statistics structure
   */
  private static getDefaultStats(): PerformanceStats {
    return {
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      averageUploadTime: 0,
      averageFileSize: 0,
      averageCompressionRatio: 1,
      successRate: 1,
      commonErrors: {},
      performanceTrends: {
        hourly: {},
        daily: {},
      },
    };
  }
}

/**
 * Performance timing utility for measuring upload operations
 */
export class UploadTimer {
  private startTime: number;
  private markers: Record<string, number> = {};

  constructor() {
    this.startTime = performance.now();
  }

  /**
   * Mark a timing point
   */
  mark(label: string): void {
    this.markers[label] = performance.now();
  }

  /**
   * Get duration from start to now or to a specific marker
   */
  getDuration(toMarker?: string): number {
    const endTime = toMarker ? this.markers[toMarker] : performance.now();
    return endTime - this.startTime;
  }

  /**
   * Get duration between two markers
   */
  getDurationBetween(fromMarker: string, toMarker: string): number {
    const fromTime = this.markers[fromMarker];
    const toTime = this.markers[toMarker];
    
    if (!fromTime || !toTime) {
      throw new Error(`Marker not found: ${!fromTime ? fromMarker : toMarker}`);
    }
    
    return toTime - fromTime;
  }

  /**
   * Get all timing data
   */
  getAllTimings(): Record<string, number> {
    const now = performance.now();
    const timings: Record<string, number> = {
      total: now - this.startTime,
    };

    Object.entries(this.markers).forEach(([label, time]) => {
      timings[label] = time - this.startTime;
    });

    return timings;
  }
}

/**
 * Network performance detector
 */
export class NetworkPerformanceDetector {
  /**
   * Detect connection type and speed
   */
  static getConnectionInfo(): {
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  } {
    // @ts-ignore - navigator.connection is not in TypeScript types
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      return {
        type: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }

    return {
      type: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
    };
  }

  /**
   * Estimate optimal upload settings based on connection
   */
  static getOptimalUploadSettings(): {
    chunkSize: number;
    maxConcurrent: number;
    compressionQuality: number;
  } {
    const connection = this.getConnectionInfo();
    
    // Adjust settings based on connection quality
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return {
        chunkSize: 256 * 1024, // 256KB
        maxConcurrent: 1,
        compressionQuality: 0.6,
      };
    }
    
    if (connection.effectiveType === '3g') {
      return {
        chunkSize: 512 * 1024, // 512KB
        maxConcurrent: 2,
        compressionQuality: 0.7,
      };
    }
    
    // 4g or better
    return {
      chunkSize: 1024 * 1024, // 1MB
      maxConcurrent: 3,
      compressionQuality: 0.8,
    };
  }
}

// Export utilities
export const uploadPerformanceMonitor = UploadPerformanceMonitor;
export const networkDetector = NetworkPerformanceDetector;