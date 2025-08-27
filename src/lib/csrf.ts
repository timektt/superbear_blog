/**
 * CSRF (Cross-Site Request Forgery) Protection
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

interface CSRFTokenData {
  token: string;
  timestamp: number;
  sessionId?: string;
}

// In-memory store for CSRF tokens (use Redis in production)
const csrfTokenStore = new Map<string, CSRFTokenData>();

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(sessionId?: string): string {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const timestamp = Date.now();

  csrfTokenStore.set(token, {
    token,
    timestamp,
    sessionId,
  });

  // Clean up expired tokens
  cleanupExpiredTokens();

  return token;
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(
  token: string,
  sessionId?: string
): { valid: boolean; error?: string } {
  if (!token) {
    return { valid: false, error: 'CSRF token is required' };
  }

  const tokenData = csrfTokenStore.get(token);
  if (!tokenData) {
    return { valid: false, error: 'Invalid CSRF token' };
  }

  // Check if token has expired
  if (Date.now() - tokenData.timestamp > CSRF_TOKEN_EXPIRY) {
    csrfTokenStore.delete(token);
    return { valid: false, error: 'CSRF token has expired' };
  }

  // Check session ID if provided
  if (sessionId && tokenData.sessionId && tokenData.sessionId !== sessionId) {
    return { valid: false, error: 'CSRF token session mismatch' };
  }

  return { valid: true };
}

/**
 * Invalidate a CSRF token (use after successful form submission)
 */
export function invalidateCSRFToken(token: string): void {
  csrfTokenStore.delete(token);
}

/**
 * Clean up expired tokens from memory
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, data] of csrfTokenStore.entries()) {
    if (now - data.timestamp > CSRF_TOKEN_EXPIRY) {
      csrfTokenStore.delete(token);
    }
  }
}

/**
 * Extract CSRF token from request
 */
export function extractCSRFToken(request: NextRequest): string | null {
  // Check header first
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) return headerToken;

  // Check form data for POST requests
  const contentType = request.headers.get('content-type');
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    // This would need to be handled in the route handler after parsing form data
    return null;
  }

  return null;
}

/**
 * Middleware function to validate CSRF tokens
 */
export async function validateCSRFMiddleware(
  request: NextRequest,
  sessionId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return { valid: true };
  }

  // Skip for API routes that don't modify state
  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/analytics/track')
  ) {
    return { valid: true };
  }

  const token = extractCSRFToken(request);
  if (!token) {
    return { valid: false, error: 'CSRF token is required for this request' };
  }

  return validateCSRFToken(token, sessionId);
}

/**
 * Generate CSRF token for forms
 */
export function getCSRFTokenForForm(sessionId?: string): string {
  return generateCSRFToken(sessionId);
}

/**
 * CSRF protection headers
 */
export const CSRF_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Check origin header for CSRF protection
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    // Allow requests without origin (like direct navigation)
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const expectedOrigins = [
      `https://${host}`,
      `http://${host}`, // Allow HTTP in development
    ];

    // In development, also allow localhost variants
    if (process.env.NODE_ENV === 'development') {
      expectedOrigins.push(
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://localhost:3000',
        'https://127.0.0.1:3000'
      );
    }

    return expectedOrigins.includes(origin);
  } catch {
    return false;
  }
}

/**
 * Double submit cookie pattern for CSRF protection
 */
export function generateDoubleSubmitToken(): {
  token: string;
  cookieValue: string;
} {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const cookieValue = crypto.createHash('sha256').update(token).digest('hex');

  return { token, cookieValue };
}

/**
 * Validate double submit token
 */
export function validateDoubleSubmitToken(
  token: string,
  cookieValue: string
): boolean {
  if (!token || !cookieValue) return false;

  const expectedCookieValue = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  return cookieValue === expectedCookieValue;
}
