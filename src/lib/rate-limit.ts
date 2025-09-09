import { NextRequest } from 'next/server';
import { logger } from './logger';
import { IS_SAFE_MODE, canUseNodeAPIs } from './safe-mode';

// Safe imports for Edge runtime - avoid Redis in middleware
let cache: any = null;
let CACHE_KEYS: any = null;

// Dynamically import Redis only in Node.js runtime
async function getCache() {
  if (!canUseNodeAPIs() || IS_SAFE_MODE) {
    return null;
  }
  
  if (cache) return cache;
  
  try {
    const redisModule = await import('./redis');
    cache = redisModule.cache;
    CACHE_KEYS = redisModule.CACHE_KEYS;
    return cache;
  } catch (error) {
    logger.warn('Redis not available, using memory fallback for rate limiting');
    return null;
  }
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory fallback store for rate limiting
const memoryStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically (fallback only)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (now > value.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}

export async function rateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
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
  const now = Date.now();
  const resetTime = now + limits.windowMs;

  try {
    // Try Redis first (only in Node.js runtime)
    const cacheInstance = await getCache();
    if (!cacheInstance || !CACHE_KEYS) {
      return fallbackRateLimit(ip, pathname, limits, now, resetTime);
    }

    const cacheKey = `${CACHE_KEYS.RATE_LIMIT}${ip}:${pathname}`;
    const entry = await cacheInstance.get(cacheKey) as { count: number; resetTime: number } | null;

    if (!entry || entry.resetTime < now) {
      // First request in window or window expired
      const newEntry = { count: 1, resetTime };
      await cacheInstance.set(cacheKey, newEntry, Math.ceil(limits.windowMs / 1000));

      return {
        success: true,
        limit: limits.max,
        remaining: limits.max - 1,
        reset: resetTime,
      };
    }

    // Check if request exceeds limit
    if (entry.count >= limits.max) {
      return {
        success: false,
        limit: limits.max,
        remaining: 0,
        reset: entry.resetTime,
      };
    }

    // Increment counter
    const newCount = entry.count + 1;
    const updatedEntry = { count: newCount, resetTime: entry.resetTime };
    await cacheInstance.set(
      cacheKey,
      updatedEntry,
      Math.ceil((entry.resetTime - now) / 1000)
    );

    return {
      success: true,
      limit: limits.max,
      remaining: limits.max - newCount,
      reset: entry.resetTime,
    };
  } catch (error) {
    logger.error('Redis rate limiting failed, falling back to memory:', error as any);
    return fallbackRateLimit(ip, pathname, limits, now, resetTime);
  }
}

function fallbackRateLimit(
  ip: string,
  pathname: string,
  limits: { max: number; windowMs: number },
  now: number,
  resetTime: number
): RateLimitResult {
  const key = `${ip}:${pathname}`;

  // Get or create rate limit entry
  let entry = memoryStore.get(key);
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime,
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
  memoryStore.set(key, entry);

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
