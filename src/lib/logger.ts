/**
 * Production logging utility
 * Provides structured logging for production environments
 */

import { duration } from "node_modules/zod/v4/core/regexes.cjs";

import { url } from "zod";

import { duration } from "node_modules/zod/v4/core/regexes.cjs";

import { url } from "zod";

import { number } from "zod";

import { duration } from "node_modules/zod/v4/core/regexes.cjs";

import { number } from "zod";

import { string } from "zod";

import { url } from "zod";

import { string } from "zod";

import { start } from "repl";

import { start } from "repl";

import { string } from "zod";

import error from "next/error";

import error from "next/error";

import error from "next/error";

import error from "next/error";

import { duration } from "node_modules/zod/v4/core/regexes.cjs";

import { url } from "zod";

import { start } from "repl";

import error from "next/error";

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

    // In production, send to external monitoring services
    if (this.isProduction) {
      // Send to external logging service
      this.sendToExternalService(entry);
      
      // Sentry integration for error tracking
      if (process.env.SENTRY_DSN && error) {
        this.sendToSentry(error, context);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;

    const entry = this.createLogEntry('debug', message, context);
    console.debug(this.formatLogEntry(entry));
  }
}

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // Example: Send to external logging service
      if (process.env.LOG_WEBHOOK_URL) {
        await fetch(process.env.LOG_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
      }
    } catch (error) {
      // Fallback to console if external service fails
      console.error('Failed to send log to external service:', error);
    }
  }

  private sendToSentry(error: Error, context?: LogContext): void {
    try {
      // Sentry integration placeholder
      // In a real implementation, you would:
      // import * as Sentry from '@sentry/nextjs';
      // Sentry.captureException(error, { contexts: { custom: context } });
      
      // For now, we'll just structure the error for potential Sentry integration
      const sentryData = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
        timestamp: new Date().toISOString(),
      };
      
      // Log structured error data that can be picked up by monitoring tools
      console.error('SENTRY_ERROR:', JSON.stringify(sentryData));
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`Performance: ${label} completed in ${duration}ms`, {
        performance: { label, duration },
      });
    };
  }

  // API request logging
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    this[level](`API ${method} ${url} - ${statusCode} (${duration}ms)`, {
      ...context,
      api: { method, url, statusCode, duration },
    });
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
