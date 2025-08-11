/**
 * Production monitoring utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

export interface MonitoringConfig {
  enableMetrics?: boolean;
  enableTracing?: boolean;
  slowQueryThreshold?: number;
}

const defaultConfig: MonitoringConfig = {
  enableMetrics: process.env.NODE_ENV === 'production',
  enableTracing: process.env.NODE_ENV === 'production',
  slowQueryThreshold: 1000, // 1 second
};

// API route monitoring wrapper
export function withMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: MonitoringConfig = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = req.headers.get('x-request-id') || generateRequestId();

    // Add request ID to headers for tracing
    const headers = new Headers();
    headers.set('x-request-id', requestId);

    try {
      // Log incoming request
      if (finalConfig.enableTracing) {
        logger.info(`API Request: ${req.method} ${req.url}`, {
          requestId,
          method: req.method,
          url: req.url,
          userAgent: req.headers.get('user-agent') || undefined,
          ip:
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            undefined,
        });
      }

      // Execute the handler
      const response = await handler(req);
      const duration = Date.now() - startTime;

      // Log response
      if (finalConfig.enableMetrics) {
        logger.logApiRequest(req.method, req.url, response.status, duration, {
          requestId,
        });
      }

      // Warn about slow requests
      if (duration > finalConfig.slowQueryThreshold!) {
        logger.warn(`Slow API request detected: ${req.method} ${req.url}`, {
          requestId,
          duration,
          threshold: finalConfig.slowQueryThreshold,
        });
      }

      // Add monitoring headers to response
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'x-request-id': requestId,
          'x-response-time': duration.toString(),
        },
      });

      return newResponse;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        `API Error: ${req.method} ${req.url}`,
        error instanceof Error ? error : new Error(String(error)),
        { requestId, duration }
      );

      // Return error response with monitoring headers
      return new NextResponse(
        JSON.stringify({
          error: {
            message:
              process.env.NODE_ENV === 'development'
                ? String(error)
                : 'Internal server error',
            requestId,
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'x-request-id': requestId,
            'x-response-time': duration.toString(),
          },
        }
      );
    }
  };
}

// Database query monitoring
export function withDatabaseMonitoring<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      // Log slow queries
      if (duration > defaultConfig.slowQueryThreshold!) {
        logger.warn(`Slow database query: ${queryName}`, {
          queryName,
          duration,
          threshold: defaultConfig.slowQueryThreshold,
        });
      }

      // Log query metrics in production
      if (process.env.NODE_ENV === 'production') {
        logger.debug(`Database query: ${queryName} (${duration}ms)`, {
          queryName,
          duration,
        });
      }

      resolve(result);
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        `Database query failed: ${queryName}`,
        error instanceof Error ? error : new Error(String(error)),
        { queryName, duration }
      );

      reject(error);
    }
  });
}

// Performance metrics collection
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 values to prevent memory leaks
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(
    name: string
  ): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    };
  }

  getAllMetrics(): Record<string, ReturnType<MetricsCollector['getMetrics']>> {
    const result: Record<
      string,
      ReturnType<MetricsCollector['getMetrics']>
    > = {};

    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }

    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export singleton instance
export const metricsCollector = MetricsCollector.getInstance();

// Error boundary for React components
export function createErrorBoundary(componentName: string) {
  return (error: Error, errorInfo: unknown) => {
    logger.error(`React Error Boundary: ${componentName}`, error, {
      componentName,
      componentStack: (errorInfo as { componentStack?: string })
        ?.componentStack,
    });
  };
}
