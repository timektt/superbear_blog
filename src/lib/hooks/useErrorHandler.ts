'use client';

import { useCallback } from 'react';
import {
  AppError,
  AppErrorHandler,
  ErrorHandlerOptions,
} from '@/lib/error-handling';
import { useToast } from '@/lib/hooks/useToast';

export interface UseErrorHandlerReturn {
  handleError: (error: unknown, options?: ErrorHandlerOptions) => AppError;
  handleAsync: <T>(
    promise: Promise<T>,
    options?: ErrorHandlerOptions
  ) => Promise<[T | null, AppError | null]>;
  createRetryHandler: <T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    delay?: number,
    options?: ErrorHandlerOptions
  ) => () => Promise<T>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}): AppError => {
      const { showToast = true, context, logError = true } = options;

      const appError = AppErrorHandler.handle(error, context);

      // Log the error if requested
      if (logError) {
        AppErrorHandler.logError(appError);
      }

      // Show toast notification if requested
      if (showToast) {
        const userMessage = AppErrorHandler.getUserMessage(appError);

        toast({
          title: getErrorTitle(appError.type),
          description: userMessage,
          variant: 'destructive',
          duration: appError.retryable ? 5000 : 4000,
          action: appError.retryable
            ? {
                label: 'Retry',
                onClick: () => {
                  // The retry logic would be handled by the calling component
                  // This is just a placeholder for the retry button
                },
              }
            : undefined,
        });
      }

      return appError;
    },
    [toast]
  );

  const handleAsync = useCallback(
    async <T>(
      promise: Promise<T>,
      options: ErrorHandlerOptions = {}
    ): Promise<[T | null, AppError | null]> => {
      try {
        const result = await promise;
        return [result, null];
      } catch (error) {
        const appError = handleError(error, options);
        return [null, appError];
      }
    },
    [handleError]
  );

  const createRetryHandler = useCallback(
    <T>(
      operation: () => Promise<T>,
      maxRetries: number = 3,
      delay: number = 1000,
      options: ErrorHandlerOptions = {}
    ) => {
      return async (): Promise<T> => {
        let lastError: AppError | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const [result, error] = await handleAsync(operation(), {
            ...options,
            showToast: attempt === maxRetries, // Only show toast on final failure
          });

          if (result !== null) {
            return result;
          }

          lastError = error;

          if (!error?.retryable || attempt === maxRetries) {
            break;
          }

          // Show retry attempt toast
          if (attempt < maxRetries) {
            toast({
              title: 'Retrying...',
              description: `Attempt ${attempt + 1} of ${maxRetries}`,
              variant: 'default',
              duration: 2000,
            });
          }

          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, delay * Math.pow(2, attempt - 1))
          );
        }

        throw lastError || new Error('Max retries exceeded');
      };
    },
    [handleAsync, toast]
  );

  return {
    handleError,
    handleAsync,
    createRetryHandler,
  };
}

function getErrorTitle(errorType: AppError['type']): string {
  switch (errorType) {
    case 'network':
      return 'Connection Error';
    case 'validation':
      return 'Validation Error';
    case 'auth':
      return 'Authentication Error';
    case 'server':
      return 'Server Error';
    default:
      return 'Error';
  }
}
