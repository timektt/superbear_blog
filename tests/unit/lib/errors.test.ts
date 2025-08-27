import { describe, it, expect } from '@jest/globals';
import { ZodError } from 'zod';
import {
  DbUnavailableError,
  ValidationError,
  handleApiError,
  isDatabaseError,
} from '@/lib/errors/handlers';
import { Prisma } from '@prisma/client';

describe('Error Handling', () => {
  describe('AppError classes', () => {
    it('should create DbUnavailableError with correct properties', () => {
      const error = new DbUnavailableError('Test message');

      expect(error.code).toBe('DB_UNAVAILABLE');
      expect(error.statusCode).toBe(503);
      expect(error.userMessage).toBe(
        'Service temporarily unavailable. Please try again later.'
      );
      expect(error.message).toBe('Test message');
    });

    it('should create ValidationError with context', () => {
      const context = { field: 'email' };
      const error = new ValidationError('Invalid email', context);

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.context).toEqual(context);
    });

    it('should serialize error to JSON', () => {
      const error = new ValidationError('Test error', { field: 'test' });
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'ValidationError',
        code: 'VALIDATION_ERROR',
        message: 'Test error',
        userMessage: 'Invalid input provided.',
        statusCode: 400,
        context: { field: 'test' },
      });
    });
  });

  describe('handleApiError', () => {
    it('should handle ZodError', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
      ]);

      const response = handleApiError(zodError);
      expect(response.status).toBe(400);
    });

    it('should handle generic Error', () => {
      const error = new Error('Generic error');
      const response = handleApiError(error);
      expect(response.status).toBe(500);
    });

    it('should handle timeout errors', () => {
      const error = new Error('Connection timeout');
      const response = handleApiError(error);
      expect(response.status).toBe(408);
    });
  });

  describe('isDatabaseError', () => {
    it('should identify DbUnavailableError as database error', () => {
      const error = new DbUnavailableError();
      expect(isDatabaseError(error)).toBe(true);
    });

    it('should identify Prisma connection errors as database errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Connection failed',
        { code: 'P1001', clientVersion: '4.0.0' }
      );
      expect(isDatabaseError(error)).toBe(true);
    });

    it('should not identify ValidationError as database error', () => {
      const error = new ValidationError();
      expect(isDatabaseError(error)).toBe(false);
    });

    it('should not identify generic Error as database error', () => {
      const error = new Error('Generic error');
      expect(isDatabaseError(error)).toBe(false);
    });
  });
});
