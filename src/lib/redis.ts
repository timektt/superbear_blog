import { Redis } from 'ioredis';
import { logger } from './logger';

// Redis client singleton
let redis: Redis | null = null;

export { redis };

// Cache configuration
export const CACHE_CONFIG = {
  // Article caching
  ARTICLE_TTL: 60 * 15, // 15 minutes
  ARTICLE_LIST_TTL: 60 * 5, // 5 minutes

  // Search results caching
  SEARCH_TTL: 60 * 10, // 10 minutes

  // Analytics caching
  ANALYTICS_TTL: 60 * 30, // 30 minutes

  // Rate limiting
  RATE_LIMIT_TTL: 60 * 60, // 1 hour

  // Session/Auth caching
  SESSION_TTL: 60 * 60 * 24, // 24 hours
  CSRF_TTL: 60 * 60, // 1 hour

  // Newsletter/Campaign caching
  CAMPAIGN_TTL: 60 * 5, // 5 minutes
  NEWSLETTER_TTL: 60 * 10, // 10 minutes
} as const;

// Cache key prefixes
export const CACHE_KEYS = {
  ARTICLE: 'article:',
  ARTICLE_LIST: 'articles:',
  SEARCH: 'search:',
  ANALYTICS: 'analytics:',
  RATE_LIMIT: 'rate_limit:',
  SESSION: 'session:',
  CSRF: 'csrf:',
  CAMPAIGN: 'campaign:',
  NEWSLETTER: 'newsletter:',
  USER_PREFERENCES: 'user_prefs:',
} as const;

/**
 * Initialize Redis connection
 */
export function initRedis(): Redis | null {
  if (redis) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('REDIS_URL not configured - using in-memory fallback');
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });

    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis:', error as any);
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redis || initRedis();
}

/**
 * Cache interface for consistent caching operations
 */
export class CacheManager {
  private redis: Redis | null;
  private memoryFallback: Map<string, { value: any; expires: number }>;

  constructor() {
    this.redis = getRedisClient();
    this.memoryFallback = new Map();
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    const serializedValue = JSON.stringify(value);

    if (this.redis) {
      try {
        await this.redis.setex(key, ttl, serializedValue);
        return;
      } catch (error) {
        logger.error('Redis set error:', error as any);
      }
    }

    // Fallback to memory cache
    this.memoryFallback.set(key, {
      value: serializedValue,
      expires: Date.now() + ttl * 1000,
    });
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        logger.error('Redis get error:', error as any);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryFallback.get(key);
    if (cached) {
      if (Date.now() > cached.expires) {
        this.memoryFallback.delete(key);
        return null;
      }
      return JSON.parse(cached.value);
    }

    return null;
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (error) {
        logger.error('Redis del error:', error as any);
      }
    }

    // Fallback to memory cache
    this.memoryFallback.delete(key);
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return;
      } catch (error) {
        logger.error('Redis delPattern error:', error as any);
      }
    }

    // Fallback to memory cache
    for (const key of this.memoryFallback.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryFallback.delete(key);
      }
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (this.redis) {
      try {
        const result = await this.redis.exists(key);
        return result === 1;
      } catch (error) {
        logger.error('Redis exists error:', error as any);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryFallback.get(key);
    if (cached && Date.now() <= cached.expires) {
      return true;
    }

    if (cached) {
      this.memoryFallback.delete(key);
    }

    return false;
  }

  /**
   * Increment a counter in cache
   */
  async incr(key: string, ttl?: number): Promise<number> {
    if (this.redis) {
      try {
        const result = await this.redis.incr(key);
        if (ttl && result === 1) {
          await this.redis.expire(key, ttl);
        }
        return result;
      } catch (error) {
        logger.error('Redis incr error:', error as any);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryFallback.get(key);
    let currentValue = 0;

    if (cached && Date.now() <= cached.expires) {
      currentValue = parseInt(cached.value) || 0;
    }

    const newValue = currentValue + 1;
    const expires = ttl ? Date.now() + ttl * 1000 : Date.now() + 60 * 60 * 1000;

    this.memoryFallback.set(key, {
      value: newValue.toString(),
      expires,
    });

    return newValue;
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, ttl: number): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.expire(key, ttl);
        return;
      } catch (error) {
        logger.error('Redis expire error:', error as any);
      }
    }

    // Fallback to memory cache
    const cached = this.memoryFallback.get(key);
    if (cached) {
      this.memoryFallback.set(key, {
        ...cached,
        expires: Date.now() + ttl * 1000,
      });
    }
  }

  /**
   * Clean up expired entries from memory fallback
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.memoryFallback.entries()) {
      if (now > cached.expires) {
        this.memoryFallback.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    redis: boolean;
    memoryKeys: number;
    redisInfo?: any;
  }> {
    const stats = {
      redis: !!this.redis,
      memoryKeys: this.memoryFallback.size,
      redisInfo: undefined as any,
    };

    if (this.redis) {
      try {
        const info = await this.redis.info('memory');
        stats.redisInfo = info;
      } catch (error) {
        logger.error('Redis info error:', error as any);
      }
    }

    return stats;
  }
}

// Global cache manager instance
export const cache = new CacheManager();

// Cleanup memory cache every 5 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => {
      cache.cleanup();
    },
    5 * 60 * 1000
  );
}
