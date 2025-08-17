/**
 * Performance metrics collection utilities
 * No external dependencies - uses built-in Node.js performance API
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  labels?: Record<string, string>;
}

class PerformanceCollector {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Prevent memory leaks

  /**
   * Record a timing metric
   */
  recordTiming(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.addMetric({
      name,
      value: durationMs,
      unit: 'ms',
      timestamp: Date.now(),
      labels,
    });
  }

  /**
   * Record a counter metric
   */
  recordCount(name: string, count: number = 1, labels?: Record<string, string>): void {
    this.addMetric({
      name,
      value: count,
      unit: 'count',
      timestamp: Date.now(),
      labels,
    });
  }

  /**
   * Record a memory metric
   */
  recordMemory(name: string, bytes: number, labels?: Record<string, string>): void {
    this.addMetric({
      name,
      value: bytes,
      unit: 'bytes',
      timestamp: Date.now(),
      labels,
    });
  }

  /**
   * Get recent metrics (last N entries)
   */
  getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByName(namePattern: string): PerformanceMetric[] {
    const regex = new RegExp(namePattern);
    return this.metrics.filter(metric => regex.test(metric.name));
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanup(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Periodic cleanup
    if (this.metrics.length % 100 === 0) {
      this.cleanup();
    }
  }
}

// Global performance collector instance
export const performanceCollector = new PerformanceCollector();

/**
 * Measure execution time of an async function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceCollector.recordTiming(name, duration, labels);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceCollector.recordTiming(name, duration, { 
      ...labels, 
      status: 'error' 
    });
    throw error;
  }
}

/**
 * Measure execution time of a sync function
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  labels?: Record<string, string>
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    performanceCollector.recordTiming(name, duration, labels);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceCollector.recordTiming(name, duration, { 
      ...labels, 
      status: 'error' 
    });
    throw error;
  }
}

/**
 * Get current memory usage metrics
 */
export function getMemoryMetrics(): Record<string, number> {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
  };
}

/**
 * Record current memory usage
 */
export function recordMemoryUsage(labels?: Record<string, string>): void {
  const memory = getMemoryMetrics();
  Object.entries(memory).forEach(([key, value]) => {
    performanceCollector.recordMemory(`memory.${key}`, value, labels);
  });
}