/**
 * Production monitoring utilities with comprehensive request/response tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { memoryMonitor } from './memory-monitor';

export interface MonitoringConfig {
  enableMetrics?: boolean;
  enableTracing?: boolean;
  slowQueryThreshold?: number;
  enableRequestLogging?: boolean;
  enableResponseLogging?: boolean;
  enableErrorTracking?: boolean;
  maxLoggedBodySize?: number;
}

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  requestId: string;
  userAgent?: string;
  ip?: string;
  requestSize?: number;
  responseSize?: number;
  error?: string;
}

export interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  uptime: number;
  memoryUsage?: NodeJS.MemoryUsage;
}

const defaultConfig: MonitoringConfig = {
  enableMetrics: process.env.NODE_ENV === 'production',
  enableTracing: process.env.NODE_ENV === 'production',
  slowQueryThreshold: 1000, // 1 second
  enableRequestLogging: true,
  enableResponseLogging: true,
  enableErrorTracking: true,
  maxLoggedBodySize: 1024, // 1KB max body size for logging
};

// Enhanced API route monitoring wrapper with comprehensive tracking
export function withMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: MonitoringConfig = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = req.headers.get('x-request-id') || generateRequestId();
    const url = new URL(req.url);
    const path = url.pathname;
    const userAgent = req.headers.get('user-agent') || undefined;
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      req.headers.get('cf-connecting-ip') ||
      undefined;

    let requestSize: number | undefined;
    let responseSize: number | undefined;
    let requestBody: string | undefined;

    try {
      // Capture request size and body for logging
      if (finalConfig.enableRequestLogging && req.body) {
        try {
          const clonedRequest = req.clone();
          const bodyText = await clonedRequest.text();
          requestSize = new Blob([bodyText]).size;

          if (bodyText.length <= (finalConfig.maxLoggedBodySize || 1024)) {
            requestBody = bodyText;
          }
        } catch (bodyError) {
          // Body reading failed, continue without it
        }
      }

      // Log incoming request with detailed information
      if (finalConfig.enableTracing) {
        const requestLog = {
          requestId,
          method: req.method,
          path,
          url: req.url,
          userAgent,
          ip,
          requestSize,
          headers: finalConfig.enableRequestLogging
            ? Object.fromEntries(req.headers.entries())
            : undefined,
          body: requestBody,
        };

        logger.info(`API Request: ${req.method} ${path}`, requestLog);
      }

      // Execute the handler
      const response = await handler(req);
      const duration = Date.now() - startTime;

      // Capture response size
      if (finalConfig.enableResponseLogging) {
        try {
          const responseText = await response.clone().text();
          responseSize = new Blob([responseText]).size;
        } catch (responseError) {
          // Response reading failed, continue without it
        }
      }

      // Record comprehensive metrics
      const requestMetrics: RequestMetrics = {
        method: req.method,
        path,
        statusCode: response.status,
        responseTime: duration,
        timestamp: startTime,
        requestId,
        userAgent,
        ip,
        requestSize,
        responseSize,
      };

      metricsCollector.recordRequest(requestMetrics);

      // Log response with detailed information
      if (finalConfig.enableMetrics) {
        const responseLog = {
          requestId,
          statusCode: response.status,
          responseTime: duration,
          responseSize,
          headers: finalConfig.enableResponseLogging
            ? Object.fromEntries(response.headers.entries())
            : undefined,
        };

        logger.logApiRequest(
          req.method,
          path,
          response.status,
          duration,
          responseLog
        );
      }

      // Warn about slow requests with additional context
      if (duration > finalConfig.slowQueryThreshold!) {
        logger.warn(`Slow API request detected: ${req.method} ${path}`, {
          requestId,
          duration,
          threshold: finalConfig.slowQueryThreshold,
          requestSize,
          responseSize,
          userAgent,
          ip,
        });
      }

      // Add comprehensive monitoring headers to response
      const monitoringHeaders: Record<string, string> = {
        'x-request-id': requestId,
        'x-response-time': duration.toString(),
        'x-timestamp': startTime.toString(),
      };

      if (responseSize !== undefined) {
        monitoringHeaders['x-response-size'] = responseSize.toString();
      }

      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...monitoringHeaders,
        },
      });

      return newResponse;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Record error metrics
      const errorMetrics: RequestMetrics = {
        method: req.method,
        path,
        statusCode: 500,
        responseTime: duration,
        timestamp: startTime,
        requestId,
        userAgent,
        ip,
        requestSize,
        error: errorMessage,
      };

      metricsCollector.recordRequest(errorMetrics);

      // Enhanced error logging
      if (finalConfig.enableErrorTracking) {
        logger.error(
          `API Error: ${req.method} ${path}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            requestId,
            duration,
            requestSize,
            userAgent,
            ip,
            requestBody:
              requestBody && requestBody.length <= 500
                ? requestBody
                : undefined,
          }
        );
      }

      // Return error response with comprehensive monitoring headers
      const errorResponse = {
        error: {
          message:
            process.env.NODE_ENV === 'development'
              ? errorMessage
              : 'Internal server error',
          requestId,
          timestamp: new Date().toISOString(),
        },
      };

      return new NextResponse(JSON.stringify(errorResponse), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': requestId,
          'x-response-time': duration.toString(),
          'x-timestamp': startTime.toString(),
          'x-error': 'true',
        },
      });
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

// Enhanced metrics collection with request/response monitoring
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, number[]> = new Map();
  private requestMetrics: RequestMetrics[] = [];
  private systemStartTime: number = Date.now();
  private readonly maxStoredRequests = 1000;

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

  recordRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics);

    // Keep only the most recent requests to prevent memory leaks
    if (this.requestMetrics.length > this.maxStoredRequests) {
      this.requestMetrics.shift();
    }

    // Record response time metric
    this.recordMetric('response_time', metrics.responseTime);
    this.recordMetric(
      `response_time_${metrics.method.toLowerCase()}`,
      metrics.responseTime
    );

    // Record status code metrics
    this.recordMetric('total_requests', 1);
    if (metrics.statusCode >= 200 && metrics.statusCode < 300) {
      this.recordMetric('successful_requests', 1);
    } else if (metrics.statusCode >= 400) {
      this.recordMetric('error_requests', 1);
    }

    // Record slow requests
    if (metrics.responseTime > defaultConfig.slowQueryThreshold!) {
      this.recordMetric('slow_requests', 1);
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

  getSystemMetrics(): SystemMetrics {
    const totalRequests = this.getMetrics('total_requests')?.count || 0;
    const successfulRequests =
      this.getMetrics('successful_requests')?.count || 0;
    const errorRequests = this.getMetrics('error_requests')?.count || 0;
    const averageResponseTime = this.getMetrics('response_time')?.avg || 0;
    const slowRequests = this.getMetrics('slow_requests')?.count || 0;
    const uptime = Date.now() - this.systemStartTime;

    let memoryUsage: NodeJS.MemoryUsage | undefined;
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        memoryUsage = process.memoryUsage();
      }
    } catch (error) {
      // Memory usage not available in this environment
    }

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      averageResponseTime,
      slowRequests,
      uptime,
      memoryUsage,
    };
  }

  getRecentRequests(limit: number = 100): RequestMetrics[] {
    return this.requestMetrics.slice(-limit);
  }

  getRequestsByPath(path: string, limit: number = 50): RequestMetrics[] {
    return this.requestMetrics.filter((req) => req.path === path).slice(-limit);
  }

  getErrorRequests(limit: number = 50): RequestMetrics[] {
    return this.requestMetrics
      .filter((req) => req.statusCode >= 400)
      .slice(-limit);
  }

  getSlowRequests(threshold?: number, limit: number = 50): RequestMetrics[] {
    const slowThreshold = threshold || defaultConfig.slowQueryThreshold!;
    return this.requestMetrics
      .filter((req) => req.responseTime > slowThreshold)
      .slice(-limit);
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.requestMetrics = [];
  }

  // Get metrics for a specific time window
  getMetricsInWindow(windowMs: number): {
    requests: RequestMetrics[];
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  } {
    const cutoff = Date.now() - windowMs;
    const windowRequests = this.requestMetrics.filter(
      (req) => req.timestamp > cutoff
    );

    const totalRequests = windowRequests.length;
    const errorRequests = windowRequests.filter(
      (req) => req.statusCode >= 400
    ).length;
    const errorRate =
      totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    const averageResponseTime =
      totalRequests > 0
        ? windowRequests.reduce((sum, req) => sum + req.responseTime, 0) /
          totalRequests
        : 0;

    return {
      requests: windowRequests,
      totalRequests,
      errorRate,
      averageResponseTime,
    };
  }
}

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Health check utilities
export function getHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<
    string,
    { status: 'pass' | 'fail'; message?: string; responseTime?: number }
  >;
  timestamp: string;
} {
  const checks: Record<
    string,
    { status: 'pass' | 'fail'; message?: string; responseTime?: number }
  > = {};

  // Check system metrics
  const systemMetrics = metricsCollector.getSystemMetrics();
  const recentWindow = metricsCollector.getMetricsInWindow(5 * 60 * 1000); // Last 5 minutes

  // Enhanced memory check with memory monitor
  const memoryStats = memoryMonitor.getCurrentMemoryStats();
  if (memoryStats) {
    const pressureLevel = memoryMonitor.getMemoryPressureLevel();
    checks.memory = {
      status:
        pressureLevel === 'low' || pressureLevel === 'medium' ? 'pass' : 'fail',
      message: `Memory usage: ${memoryStats.heapUsedPercent.toFixed(1)}% (${pressureLevel} pressure)`,
    };
  } else if (systemMetrics.memoryUsage) {
    const memoryUsagePercent =
      (systemMetrics.memoryUsage.heapUsed /
        systemMetrics.memoryUsage.heapTotal) *
      100;
    checks.memory = {
      status: memoryUsagePercent < 90 ? 'pass' : 'fail',
      message: `Memory usage: ${memoryUsagePercent.toFixed(1)}%`,
    };
  }

  // Response time check
  checks.responseTime = {
    status: systemMetrics.averageResponseTime < 2000 ? 'pass' : 'fail',
    message: `Average response time: ${systemMetrics.averageResponseTime.toFixed(0)}ms`,
    responseTime: systemMetrics.averageResponseTime,
  };

  // Error rate check
  const errorRate = recentWindow.totalRequests > 0 ? recentWindow.errorRate : 0;
  checks.errorRate = {
    status: errorRate < 5 ? 'pass' : 'fail',
    message: `Error rate: ${errorRate.toFixed(1)}%`,
  };

  // Determine overall status
  const failedChecks = Object.values(checks).filter(
    (check) => check.status === 'fail'
  ).length;
  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (failedChecks === 0) {
    status = 'healthy';
  } else if (failedChecks <= 1) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}

// Request correlation utilities
export function createRequestContext(req: NextRequest): {
  requestId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
} {
  const requestId = req.headers.get('x-request-id') || generateRequestId();
  const traceId = req.headers.get('x-trace-id') || generateTraceId();
  const spanId = generateSpanId();
  const parentSpanId = req.headers.get('x-parent-span-id') || undefined;

  return {
    requestId,
    traceId,
    spanId,
    parentSpanId,
  };
}

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 18)}`;
}

function generateSpanId(): string {
  return `span_${Math.random().toString(36).substring(2, 10)}`;
}

// Performance monitoring utilities
export function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<
  T & { __performanceMetrics?: { duration: number; operation: string } }
> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      // Record performance metric
      metricsCollector.recordMetric(`operation_${operation}`, duration);

      // Log slow operations
      if (duration > 1000) {
        logger.warn(`Slow operation detected: ${operation}`, {
          operation,
          duration,
        });
      }

      // Attach performance metadata if result is an object
      if (typeof result === 'object' && result !== null) {
        (result as any).__performanceMetrics = { duration, operation };
      }

      resolve(result);
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(
        `Operation failed: ${operation}`,
        error instanceof Error ? error : new Error(String(error)),
        { operation, duration }
      );

      reject(error);
    }
  });
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
