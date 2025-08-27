import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/analytics/track/route';

describe('Analytics API - Development Mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should accept minimal payload in development mode', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/analytics/track',
      {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.mode).toBe('development');
  });

  it('should process valid payload in development mode', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/analytics/track',
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'view',
          articleId: 'test-article-id-123',
          sessionId: 'test-session',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle invalid article ID gracefully in development', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/analytics/track',
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'view',
          articleId: 'short',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.skipped).toBe(true);
  });
});

describe('Analytics API - Production Mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should require valid payload in production mode', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/analytics/track',
      {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should validate article ID format in production', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/analytics/track',
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'view',
          articleId: 'short',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.skipped).toBe(true);
  });
});
