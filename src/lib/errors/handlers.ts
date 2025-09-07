import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import {
  AppError,
  DbUnavailableError,
  TimeoutError,
  ValidationError,
  NotFoundError,
  InternalServerError,
} from './types';
import { logger } from '@/lib/logger';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    userMessage: string;
    statusCode: number;
    timestamp: string;
    requestId?: string;
  };
  success: false;
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleApiError(
  error: unknown,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  let appError: AppError;

  // Convert known error types to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof ZodError) {
    appError = new ValidationError('Invalid input data', {
      zodErrors: (error as any).errors,
    });
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    appError = new DbUnavailableError('Database connection failed');
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    appError = new DbUnavailableError('Database initialization failed');
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    appError = new ValidationError('Database query validation failed');
  } else if (error instanceof Error) {
    // Check for timeout errors
    if (
      error.message.includes('timeout') ||
      error.message.includes('ETIMEDOUT')
    ) {
      appError = new TimeoutError(error.message);
    } else {
      appError = new InternalServerError(error.message);
    }
  } else {
    appError = new InternalServerError('Unknown error occurred');
  }

  // Log error for debugging
  logger.error('API Error', appError, {
    requestId,
    stack: appError.stack,
    context: appError.context,
  });

  // Create error response
  const errorResponse: ApiErrorResponse = {
    error: {
      code: appError.code,
      message: appError.message,
      userMessage: appError.userMessage,
      statusCode: appError.statusCode,
      timestamp: new Date().toISOString(),
      requestId,
    },
    success: false,
  };

  return NextResponse.json(errorResponse, {
    status: appError.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): AppError {
  switch (error.code) {
    case 'P2002':
      return new ValidationError('Unique constraint violation', {
        field: error.meta?.target,
      });
    case 'P2025':
      return new NotFoundError('Record not found');
    case 'P2003':
      return new ValidationError('Foreign key constraint violation');
    case 'P2021':
      return new DbUnavailableError('Table does not exist');
    case 'P2022':
      return new DbUnavailableError('Column does not exist');
    case 'P1001':
      return new DbUnavailableError('Cannot reach database server');
    case 'P1002':
      return new TimeoutError('Database connection timeout');
    case 'P1008':
      return new TimeoutError('Database operation timeout');
    default:
      return new InternalServerError(`Database error: ${error.message}`, {
        prismaCode: error.code,
      });
  }
}

/**
 * Wrap async API route handlers with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ApiErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Create a safe database operation wrapper
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.warn('Database operation failed, using fallback', error as any);

    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
}

/**
 * Check if error is a database connectivity issue
 */
export function isDatabaseError(error: unknown): boolean {
  if (error instanceof DbUnavailableError || error instanceof TimeoutError) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const connectivityCodes = ['P1001', 'P1002', 'P1008', 'P1017'];
    return connectivityCodes.includes(error.code);
  }

  return false;
}
