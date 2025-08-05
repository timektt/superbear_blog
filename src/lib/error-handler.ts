/**
 * Global error handling utilities for production
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleApiError(error: unknown, context?: any): NextResponse {
  // Log the error
  logger.error(
    'API Error occurred',
    error instanceof Error ? error : new Error(String(error)),
    context
  );

  // Handle different types of errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          {
            error: {
              message: 'A record with this value already exists',
              code: 'DUPLICATE_RECORD',
            },
          },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          {
            error: {
              message: 'Record not found',
              code: 'NOT_FOUND',
            },
          },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          {
            error: {
              message: 'Database error occurred',
              code: 'DATABASE_ERROR',
            },
          },
          { status: 500 }
        );
    }
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  return NextResponse.json(
    {
      error: {
        message: isDevelopment ? String(error) : 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  );
}

// Error boundary component helper
export function createErrorBoundary() {
  return class ErrorBoundary extends Error {
    constructor(
      message: string,
      public componentStack?: string
    ) {
      super(message);
      this.name = 'ErrorBoundary';
    }
  };
}

// Async error handler wrapper
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(
        'Async operation failed',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };
}
