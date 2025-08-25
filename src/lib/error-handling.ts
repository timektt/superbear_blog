/**
 * Comprehensive error handling system for the SuperBear CMS
 * Provides centralized error management, classification, and user-friendly messaging
 */

export interface AppError {
  type: 'network' | 'validation' | 'auth' | 'server' | 'unknown';
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  context?: string;
  retryable?: boolean;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  context?: string;
  retryable?: boolean;
  logError?: boolean;
}

export class AppErrorHandler {
  /**
   * Handles and classifies errors into AppError format
   */
  static handle(error: unknown, context?: string): AppError {
    const timestamp = new Date();
    
    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        timestamp,
        context,
        retryable: true,
        details: error
      };
    }

    // Handle HTTP response errors
    if (error instanceof Response) {
      const status = error.status;
      
      if (status === 401) {
        return {
          type: 'auth',
          message: 'Your session has expired. Please log in again.',
          code: 'UNAUTHORIZED',
          timestamp,
          context,
          retryable: false,
          details: { status }
        };
      }
      
      if (status === 403) {
        return {
          type: 'auth',
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          timestamp,
          context,
          retryable: false,
          details: { status }
        };
      }
      
      if (status === 404) {
        return {
          type: 'server',
          message: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          timestamp,
          context,
          retryable: false,
          details: { status }
        };
      }
      
      if (status >= 500) {
        return {
          type: 'server',
          message: 'A server error occurred. Please try again later.',
          code: 'SERVER_ERROR',
          timestamp,
          context,
          retryable: true,
          details: { status }
        };
      }
      
      if (status >= 400) {
        return {
          type: 'validation',
          message: 'Invalid request. Please check your input and try again.',
          code: 'BAD_REQUEST',
          timestamp,
          context,
          retryable: false,
          details: { status }
        };
      }
    }

    // Handle validation errors (Zod, form validation, etc.)
    if (error && typeof error === 'object' && 'issues' in error) {
      return {
        type: 'validation',
        message: 'Please correct the highlighted fields and try again.',
        code: 'VALIDATION_ERROR',
        timestamp,
        context,
        retryable: false,
        details: error
      };
    }

    // Handle JavaScript errors
    if (error instanceof Error) {
      // Check for specific error types
      if (error.name === 'AbortError') {
        return {
          type: 'network',
          message: 'Request was cancelled.',
          code: 'REQUEST_CANCELLED',
          timestamp,
          context,
          retryable: true,
          details: error
        };
      }

      if (error.name === 'TimeoutError') {
        return {
          type: 'network',
          message: 'Request timed out. Please try again.',
          code: 'REQUEST_TIMEOUT',
          timestamp,
          context,
          retryable: true,
          details: error
        };
      }

      return {
        type: 'unknown',
        message: error.message || 'An unexpected error occurred.',
        code: 'UNKNOWN_ERROR',
        timestamp,
        context,
        retryable: false,
        details: error
      };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return {
        type: 'unknown',
        message: error,
        code: 'STRING_ERROR',
        timestamp,
        context,
        retryable: false,
        details: { originalError: error }
      };
    }

    // Fallback for unknown error types
    return {
      type: 'unknown',
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
      timestamp,
      context,
      retryable: false,
      details: error
    };
  }

  /**
   * Handles async operations with error catching
   */
  static async handleAsync<T>(
    promise: Promise<T>,
    context?: string
  ): Promise<[T | null, AppError | null]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      const appError = this.handle(error, context);
      return [null, appError];
    }
  }

  /**
   * Creates a retry function for retryable errors
   */
  static createRetryHandler<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    context?: string
  ) {
    return async (): Promise<T> => {
      let lastError: AppError | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const [result, error] = await this.handleAsync(operation(), context);
        
        if (result !== null) {
          return result;
        }
        
        lastError = error;
        
        if (!error?.retryable || attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
      
      throw lastError || new Error('Max retries exceeded');
    };
  }

  /**
   * Logs errors to console in development, external service in production
   */
  static logError(error: AppError): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('AppError:', {
        type: error.type,
        message: error.message,
        code: error.code,
        context: error.context,
        timestamp: error.timestamp,
        details: error.details
      });
    } else {
      // In production, send to error tracking service (Sentry, etc.)
      // This would be implemented based on your error tracking setup
      try {
        // Example: Sentry.captureException(error);
      } catch (loggingError) {
        console.error('Failed to log error:', loggingError);
      }
    }
  }

  /**
   * Gets user-friendly error messages based on error type and context
   */
  static getUserMessage(error: AppError): string {
    const contextMessages: Record<string, Record<string, string>> = {
      'article-save': {
        network: 'Failed to save article. Please check your connection and try again.',
        validation: 'Please fill in all required fields correctly.',
        auth: 'Your session expired. Please log in and try again.',
        server: 'Unable to save article due to server error. Please try again later.'
      },
      'image-upload': {
        network: 'Failed to upload image. Please check your connection.',
        validation: 'Please select a valid image file (JPG, PNG, WebP).',
        server: 'Image upload failed. Please try again later.'
      },
      'data-fetch': {
        network: 'Failed to load data. Please check your connection.',
        auth: 'Please log in to view this content.',
        server: 'Unable to load data. Please refresh the page.'
      }
    };

    const contextSpecific = error.context && contextMessages[error.context];
    if (contextSpecific && contextSpecific[error.type]) {
      return contextSpecific[error.type];
    }

    return error.message;
  }
}

/**
 * Utility function for handling API responses
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If we can't parse the error response, use the status text
      errorMessage = response.statusText || errorMessage;
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    throw error;
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * Utility function for making API requests with error handling
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  context?: string
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return await handleApiResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    throw AppErrorHandler.handle(error, context);
  }
}