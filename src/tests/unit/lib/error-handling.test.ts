import { AppErrorHandler } from '@/lib/error-handling';
import { AppError } from '@/lib/errors/types';

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

// Mock toast notifications
const mockToast = jest.fn();
jest.mock('@/lib/hooks/useToast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('AppErrorHandler.handle', () => {
    it('should handle JavaScript Error objects', () => {
      const error = new Error('Test error message');
      const result = AppErrorHandler.handle(error, 'test-context');

      expect(result).toEqual({
        type: 'unknown',
        message: 'Test error message',
        code: undefined,
        details: error,
      });
    });

    it('should handle network errors', () => {
      const networkError = new Error('Failed to fetch');
      networkError.name = 'NetworkError';
      
      const result = AppErrorHandler.handle(networkError, 'api-call');

      expect(result.type).toBe('network');
      expect(result.message).toBe('Failed to fetch');
    });

    it('should handle validation errors', () => {
      const validationError = {
        name: 'ValidationError',
        message: 'Invalid input data',
        issues: [{ path: ['email'], message: 'Invalid email format' }],
      };

      const result = AppErrorHandler.handle(validationError, 'form-validation');

      expect(result.type).toBe('validation');
      expect(result.message).toBe('Invalid input data');
      expect(result.details).toEqual(validationError.issues);
    });

    it('should handle authentication errors', () => {
      const authError = new Error('Unauthorized access');
      authError.name = 'AuthenticationError';

      const result = AppErrorHandler.handle(authError, 'auth-check');

      expect(result.type).toBe('auth');
      expect(result.message).toBe('Unauthorized access');
    });

    it('should handle server errors with status codes', () => {
      const serverError = {
        status: 500,
        message: 'Internal server error',
        code: 'SERVER_ERROR',
      };

      const result = AppErrorHandler.handle(serverError, 'api-request');

      expect(result.type).toBe('server');
      expect(result.message).toBe('Internal server error');
      expect(result.code).toBe('SERVER_ERROR');
    });

    it('should handle string errors', () => {
      const stringError = 'Something went wrong';
      const result = AppErrorHandler.handle(stringError, 'string-error');

      expect(result).toEqual({
        type: 'unknown',
        message: 'Something went wrong',
        code: undefined,
        details: undefined,
      });
    });

    it('should handle null/undefined errors', () => {
      const result = AppErrorHandler.handle(null, 'null-error');

      expect(result).toEqual({
        type: 'unknown',
        message: 'An unknown error occurred',
        code: undefined,
        details: undefined,
      });
    });

    it('should log errors with context', () => {
      const error = new Error('Test error');
      AppErrorHandler.handle(error, 'test-context');

      expect(mockConsoleError).toHaveBeenCalledWith(
        '[test-context] Error:',
        error
      );
    });
  });

  describe('AppErrorHandler.showError', () => {
    it('should show toast notification by default', () => {
      const error: AppError = {
        type: 'validation',
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
      };

      AppErrorHandler.showError(error);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Validation Error',
        description: 'Invalid input',
        variant: 'destructive',
      });
    });

    it('should not show toast when disabled', () => {
      const error: AppError = {
        type: 'network',
        message: 'Connection failed',
      };

      AppErrorHandler.showError(error, false);

      expect(mockToast).not.toHaveBeenCalled();
    });

    it('should format different error types correctly', () => {
      const networkError: AppError = {
        type: 'network',
        message: 'Failed to connect',
      };

      AppErrorHandler.showError(networkError);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Network Error',
        description: 'Failed to connect',
        variant: 'destructive',
      });

      const authError: AppError = {
        type: 'auth',
        message: 'Access denied',
      };

      AppErrorHandler.showError(authError);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Authentication Error',
        description: 'Access denied',
        variant: 'destructive',
      });
    });
  });

  describe('AppErrorHandler.handleAsync', () => {
    it('should handle successful promises', async () => {
      const successPromise = Promise.resolve('success data');
      const [data, error] = await AppErrorHandler.handleAsync(successPromise);

      expect(data).toBe('success data');
      expect(error).toBeNull();
    });

    it('should handle rejected promises', async () => {
      const failurePromise = Promise.reject(new Error('Async error'));
      const [data, error] = await AppErrorHandler.handleAsync(failurePromise, 'async-context');

      expect(data).toBeNull();
      expect(error).toEqual({
        type: 'unknown',
        message: 'Async error',
        code: undefined,
        details: expect.any(Error),
      });
    });

    it('should handle network timeouts', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });

      const [data, error] = await AppErrorHandler.handleAsync(timeoutPromise, 'timeout-test');

      expect(data).toBeNull();
      expect(error?.type).toBe('unknown');
      expect(error?.message).toBe('Request timeout');
    });

    it('should handle API response errors', async () => {
      const apiError = {
        status: 404,
        message: 'Resource not found',
        code: 'NOT_FOUND',
      };
      const apiPromise = Promise.reject(apiError);

      const [data, error] = await AppErrorHandler.handleAsync(apiPromise, 'api-call');

      expect(data).toBeNull();
      expect(error?.type).toBe('server');
      expect(error?.message).toBe('Resource not found');
      expect(error?.code).toBe('NOT_FOUND');
    });
  });

  describe('Error Recovery', () => {
    it('should provide retry mechanisms for retryable errors', () => {
      const networkError: AppError = {
        type: 'network',
        message: 'Connection failed',
      };

      const isRetryable = AppErrorHandler.isRetryable(networkError);
      expect(isRetryable).toBe(true);
    });

    it('should not retry non-retryable errors', () => {
      const validationError: AppError = {
        type: 'validation',
        message: 'Invalid data',
      };

      const isRetryable = AppErrorHandler.isRetryable(validationError);
      expect(isRetryable).toBe(false);
    });

    it('should provide user-friendly error messages', () => {
      const networkError: AppError = {
        type: 'network',
        message: 'Failed to fetch',
      };

      const userMessage = AppErrorHandler.getUserMessage(networkError);
      expect(userMessage).toBe('Unable to connect to the server. Please check your internet connection and try again.');
    });

    it('should provide actionable guidance', () => {
      const authError: AppError = {
        type: 'auth',
        message: 'Token expired',
      };

      const guidance = AppErrorHandler.getActionableGuidance(authError);
      expect(guidance).toEqual({
        message: 'Your session has expired. Please log in again.',
        actions: [
          { label: 'Log In', action: 'redirect-login' },
          { label: 'Refresh Page', action: 'refresh' },
        ],
      });
    });
  });

  describe('Error Categorization', () => {
    it('should categorize fetch errors as network errors', () => {
      const fetchError = new TypeError('Failed to fetch');
      const result = AppErrorHandler.handle(fetchError);

      expect(result.type).toBe('network');
    });

    it('should categorize 4xx status codes as client errors', () => {
      const clientError = {
        status: 400,
        message: 'Bad request',
      };

      const result = AppErrorHandler.handle(clientError);
      expect(result.type).toBe('validation');
    });

    it('should categorize 5xx status codes as server errors', () => {
      const serverError = {
        status: 500,
        message: 'Internal server error',
      };

      const result = AppErrorHandler.handle(serverError);
      expect(result.type).toBe('server');
    });

    it('should categorize Zod errors as validation errors', () => {
      const zodError = {
        name: 'ZodError',
        issues: [
          { path: ['email'], message: 'Invalid email' },
          { path: ['password'], message: 'Password too short' },
        ],
      };

      const result = AppErrorHandler.handle(zodError);
      expect(result.type).toBe('validation');
      expect(result.details).toEqual(zodError.issues);
    });
  });

  describe('Context Preservation', () => {
    it('should preserve error context through the handling chain', () => {
      const originalError = new Error('Original error');
      originalError.stack = 'Error stack trace';

      const result = AppErrorHandler.handle(originalError, 'component-context');

      expect(result.details).toBe(originalError);
      expect(mockConsoleError).toHaveBeenCalledWith(
        '[component-context] Error:',
        originalError
      );
    });

    it('should maintain error metadata', () => {
      const errorWithMetadata = {
        message: 'API Error',
        status: 422,
        code: 'UNPROCESSABLE_ENTITY',
        timestamp: new Date().toISOString(),
        requestId: 'req-123',
      };

      const result = AppErrorHandler.handle(errorWithMetadata, 'api-context');

      expect(result.code).toBe('UNPROCESSABLE_ENTITY');
      expect(result.details).toEqual(errorWithMetadata);
    });
  });
});