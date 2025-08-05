/**
 * Production logging utility
 * Provides structured logging for production environments
 */

export interface LogContext {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Simple console output for development
      return `[${entry.level.toUpperCase()}] ${entry.message}`;
    }

    // Structured JSON for production
    return JSON.stringify(entry);
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
      };
    }

    return entry;
  }

  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, context);
    console.log(this.formatLogEntry(entry));
  }

  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('warn', message, context);
    console.warn(this.formatLogEntry(entry));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, context, error);
    console.error(this.formatLogEntry(entry));

    // In production, you might want to send to external service
    if (this.isProduction && process.env.SENTRY_DSN) {
      // Sentry integration would go here
      // Sentry.captureException(error || new Error(message), { contexts: { custom: context } });
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('debug', message, context);
    console.debug(this.formatLogEntry(entry));
  }
}

export const logger = new Logger();

// Request context helper for API routes
export function getRequestContext(req: Request): LogContext {
  return {
    userAgent: req.headers.get('user-agent') || undefined,
    ip:
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      undefined,
    requestId: req.headers.get('x-request-id') || undefined,
  };
}
