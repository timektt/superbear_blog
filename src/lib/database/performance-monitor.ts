/**
 * Database Performance Monitoring Middleware
 *
 * Provides real-time query performance monitoring and logging
 * to help identify performance bottlenecks and optimization opportunities.
 */

import { PrismaClient } from '@prisma/client';

export interface QueryLog {
  id: string;
  query: string;
  model: string;
  operation: string;
  executionTime: number;
  timestamp: Date;
  params?: any;
  result?: {
    count?: number;
    error?: string;
  };
}

class PerformanceMonitor {
  private queryLogs: QueryLog[] = [];
  private maxLogs = 1000; // Keep last 1000 queries
  private slowQueryThreshold = 100; // Log queries slower than 100ms

  /**
   * Log a query execution
   */
  logQuery(log: QueryLog) {
    this.queryLogs.unshift(log);

    // Keep only the most recent logs
    if (this.queryLogs.length > this.maxLogs) {
      this.queryLogs = this.queryLogs.slice(0, this.maxLogs);
    }

    // Log slow queries to console
    if (log.executionTime > this.slowQueryThreshold) {
      console.warn(
        `Slow query detected: ${log.model}.${log.operation} took ${log.executionTime}ms`
      );
    }
  }

  /**
   * Get recent query logs
   */
  getRecentLogs(limit: number = 50): QueryLog[] {
    return this.queryLogs.slice(0, limit);
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = this.slowQueryThreshold): QueryLog[] {
    return this.queryLogs.filter((log) => log.executionTime > threshold);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    if (this.queryLogs.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        slowQueries: 0,
        fastestQuery: 0,
        slowestQuery: 0,
      };
    }

    const executionTimes = this.queryLogs.map((log) => log.executionTime);
    const slowQueries = this.queryLogs.filter(
      (log) => log.executionTime > this.slowQueryThreshold
    );

    return {
      totalQueries: this.queryLogs.length,
      averageExecutionTime: Math.round(
        executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
      ),
      slowQueries: slowQueries.length,
      fastestQuery: Math.min(...executionTimes),
      slowestQuery: Math.max(...executionTimes),
    };
  }

  /**
   * Get query statistics by model
   */
  getModelStats() {
    const modelStats: Record<
      string,
      {
        count: number;
        averageTime: number;
        slowQueries: number;
      }
    > = {};

    this.queryLogs.forEach((log) => {
      if (!modelStats[log.model]) {
        modelStats[log.model] = {
          count: 0,
          averageTime: 0,
          slowQueries: 0,
        };
      }

      modelStats[log.model].count++;
      modelStats[log.model].averageTime += log.executionTime;
      if (log.executionTime > this.slowQueryThreshold) {
        modelStats[log.model].slowQueries++;
      }
    });

    // Calculate averages
    Object.keys(modelStats).forEach((model) => {
      modelStats[model].averageTime = Math.round(
        modelStats[model].averageTime / modelStats[model].count
      );
    });

    return modelStats;
  }

  /**
   * Clear query logs
   */
  clearLogs() {
    this.queryLogs = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Create a Prisma client with performance monitoring
 */
export function createMonitoredPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
    ],
  });

  // Monitor query events
  prisma.$on('query', (e) => {
    const queryLog: QueryLog = {
      id: Math.random().toString(36).substr(2, 9),
      query: e.query,
      model: extractModelFromQuery(e.query),
      operation: extractOperationFromQuery(e.query),
      executionTime: e.duration,
      timestamp: new Date(e.timestamp),
      params: e.params,
    };

    performanceMonitor.logQuery(queryLog);
  });

  return prisma;
}

/**
 * Extract model name from SQL query
 */
function extractModelFromQuery(query: string): string {
  // Simple extraction - in production, this could be more sophisticated
  const match =
    query.match(/FROM\s+`?(\w+)`?/i) ||
    query.match(/UPDATE\s+`?(\w+)`?/i) ||
    query.match(/INSERT\s+INTO\s+`?(\w+)`?/i);
  return match ? match[1] : 'unknown';
}

/**
 * Extract operation type from SQL query
 */
function extractOperationFromQuery(query: string): string {
  const trimmedQuery = query.trim().toUpperCase();

  if (trimmedQuery.startsWith('SELECT')) return 'findMany';
  if (trimmedQuery.startsWith('INSERT')) return 'create';
  if (trimmedQuery.startsWith('UPDATE')) return 'update';
  if (trimmedQuery.startsWith('DELETE')) return 'delete';

  return 'unknown';
}

/**
 * Middleware to wrap Prisma operations with performance monitoring
 */
export function withPerformanceMonitoring<T extends PrismaClient>(
  prisma: T
): T {
  const originalFindMany = prisma.article.findMany;
  const originalFindUnique = prisma.article.findUnique;
  const originalCreate = prisma.article.create;
  const originalUpdate = prisma.article.update;
  const originalDelete = prisma.article.delete;

  // Wrap article operations
  prisma.article.findMany = async function (args?: any) {
    const startTime = Date.now();
    try {
      const result = await originalFindMany.call(this, args);
      const executionTime = Date.now() - startTime;

      performanceMonitor.logQuery({
        id: Math.random().toString(36).substr(2, 9),
        query: 'article.findMany',
        model: 'article',
        operation: 'findMany',
        executionTime,
        timestamp: new Date(),
        params: args,
        result: { count: Array.isArray(result) ? result.length : 1 },
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      performanceMonitor.logQuery({
        id: Math.random().toString(36).substr(2, 9),
        query: 'article.findMany',
        model: 'article',
        operation: 'findMany',
        executionTime,
        timestamp: new Date(),
        params: args,
        result: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  };

  // Similar wrapping for other operations...
  // (In a full implementation, you'd wrap all model operations)

  return prisma;
}

/**
 * Performance monitoring decorator for API routes
 */
export function withQueryPerformanceLogging<
  T extends (...args: any[]) => Promise<any>,
>(fn: T, operationName: string): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      const executionTime = Date.now() - startTime;

      // Log successful operation
      console.log(
        `API Operation: ${operationName} completed in ${executionTime}ms`
      );

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Log failed operation
      console.error(
        `API Operation: ${operationName} failed after ${executionTime}ms:`,
        error
      );

      throw error;
    }
  }) as T;
}

/**
 * Get performance monitoring data for admin dashboard
 */
export function getPerformanceMonitoringData() {
  return {
    recentLogs: performanceMonitor.getRecentLogs(20),
    slowQueries: performanceMonitor.getSlowQueries(),
    stats: performanceMonitor.getPerformanceStats(),
    modelStats: performanceMonitor.getModelStats(),
  };
}
