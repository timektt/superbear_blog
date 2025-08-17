/**
 * Base error class for application errors
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly userMessage: string;

  constructor(message: string, public readonly context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

/**
 * Database unavailable error
 */
export class DbUnavailableError extends AppError {
  readonly code = 'DB_UNAVAILABLE';
  readonly statusCode = 503;
  readonly userMessage = 'Service temporarily unavailable. Please try again later.';

  constructor(message = 'Database is unavailable', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Database timeout error
 */
export class TimeoutError extends AppError {
  readonly code = 'TIMEOUT';
  readonly statusCode = 408;
  readonly userMessage = 'Request timed out. Please try again.';

  constructor(message = 'Operation timed out', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly userMessage = 'Invalid input provided.';

  constructor(message = 'Validation failed', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  readonly userMessage = 'The requested resource was not found.';

  constructor(message = 'Resource not found', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
  readonly userMessage = 'Authentication required.';

  constructor(message = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
  readonly userMessage = 'You do not have permission to access this resource.';

  constructor(message = 'Authorization failed', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;
  readonly userMessage = 'Too many requests. Please try again later.';

  constructor(message = 'Rate limit exceeded', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Internal server error
 */
export class InternalServerError extends AppError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = 500;
  readonly userMessage = 'An internal server error occurred. Please try again later.';

  constructor(message = 'Internal server error', context?: Record<string, unknown>) {
    super(message, context);
  }
}