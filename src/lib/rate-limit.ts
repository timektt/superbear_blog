import { NextRequest } from 'next/server';

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store for rate limiting (use Redis in production)
const store = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // Clean up every minute

export async function rateLimit(request: NextRequest): Promise<RateLimitResult> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  }
  
  // Skip if rate limiting is disabled
  if (process.env.ENABLE_RATE_LIMITING !== 'true') {
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: Date.now() + 60000,
    };
  }
  
  const ip = getClientIP(request);
  const pathname = request.nextUrl.pathname;
  
  // Different limits for different endpoints
  const limits = getRateLimits(pathname);
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const windowStart = now - limits.windowMs;
  
  // Get or create rate limit entry
  let entry = store.get(key);
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + limits.windowMs,
    };
  }
  
  // Check if request is within rate limit
  if (entry.count >= limits.max) {
    return {
      success: false,
      limit: limits.max,
      remaining: 0,
      reset: entry.resetTime,
    };
  }
  
  // Increment counter
  entry.count++;
  store.set(key, entry);
  
  return {
    success: true,
    limit: limits.max,
    remaining: limits.max - entry.count,
    reset: entry.resetTime,
  };
}

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

function getRateLimits(pathname: string): { max: number; windowMs: number } {
  // Default limits
  const defaultLimits = {
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  };
  
  // Stricter limits for sensitive endpoints
  if (pathname.startsWith('/api/admin')) {
    return {
      max: 50,
      windowMs: 900000, // 15 minutes
    };
  }
  
  if (pathname.startsWith('/api/auth')) {
    return {
      max: 10,
      windowMs: 900000, // 15 minutes
    };
  }
  
  if (pathname.startsWith('/api/upload')) {
    return {
      max: 20,
      windowMs: 3600000, // 1 hour
    };
  }
  
  // More lenient for public API
  if (pathname.startsWith('/api/')) {
    return {
      max: 200,
      windowMs: 900000, // 15 minutes
    };
  }
  
  return defaultLimits;
}