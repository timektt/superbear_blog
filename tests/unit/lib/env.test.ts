import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { isDatabaseConfigured } from '@/lib/env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isDatabaseConfigured', () => {
    it('should return false when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;
      expect(isDatabaseConfigured()).toBe(false);
    });

    it('should return false when DATABASE_URL is empty', () => {
      process.env.DATABASE_URL = '';
      expect(isDatabaseConfigured()).toBe(false);
    });

    it('should return false when DATABASE_URL is whitespace', () => {
      process.env.DATABASE_URL = '   ';
      expect(isDatabaseConfigured()).toBe(false);
    });

    it('should return true for valid SQLite file URL', () => {
      process.env.DATABASE_URL = 'file:./dev.db';
      expect(isDatabaseConfigured()).toBe(true);
    });

    it('should return true for valid PostgreSQL URL', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      expect(isDatabaseConfigured()).toBe(true);
    });

    it('should return true for valid MySQL URL', () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db';
      expect(isDatabaseConfigured()).toBe(true);
    });

    it('should return false for invalid URL format', () => {
      process.env.DATABASE_URL = 'not-a-valid-url';
      expect(isDatabaseConfigured()).toBe(false);
    });

    it('should return false for unsupported protocol', () => {
      process.env.DATABASE_URL = 'ftp://example.com/db';
      expect(isDatabaseConfigured()).toBe(false);
    });

    it('should return false for file URL without path', () => {
      process.env.DATABASE_URL = 'file:';
      expect(isDatabaseConfigured()).toBe(false);
    });

    it('should return false for network URL without hostname', () => {
      process.env.DATABASE_URL = 'postgresql://';
      expect(isDatabaseConfigured()).toBe(false);
    });
  });
});