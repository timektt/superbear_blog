// @ts-nocheck
import { cache, CACHE_CONFIG, CACHE_KEYS } from '../redis';
import { logger } from '../logger';

export interface CachedSession {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
  expires: string;
  sessionToken?: string;
}

export interface CSRFToken {
  token: string;
  expires: number;
}

/**
 * Session and authentication caching utilities
 */
export class SessionCache {
  /**
   * Cache user session
   */
  static async setSession(
    sessionToken: string,
    session: CachedSession
  ): Promise<void> {
    try {
      const key = `${CACHE_KEYS.SESSION}${sessionToken}`;
      await cache.set(key, session, CACHE_CONFIG.SESSION_TTL);
      logger.debug(`Cached session: ${sessionToken.slice(0, 8)}...`);
    } catch (error) {
      logger.error('Failed to cache session:', error);
    }
  }

  /**
   * Get cached session
   */
  static async getSession(sessionToken: string): Promise<CachedSession | null> {
    try {
      const key = `${CACHE_KEYS.SESSION}${sessionToken}`;
      const session = await cache.get<CachedSession>(key);

      if (session) {
        logger.debug(`Cache hit for session: ${sessionToken.slice(0, 8)}...`);
      }

      return session;
    } catch (error) {
      logger.error('Failed to get cached session:', error);
      return null;
    }
  }

  /**
   * Invalidate session cache
   */
  static async invalidateSession(sessionToken: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.SESSION}${sessionToken}`;
      await cache.del(key);
      logger.debug(`Invalidated session: ${sessionToken.slice(0, 8)}...`);
    } catch (error) {
      logger.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Cache CSRF token
   */
  static async setCSRFToken(
    sessionId: string,
    csrfToken: CSRFToken
  ): Promise<void> {
    try {
      const key = `${CACHE_KEYS.CSRF}${sessionId}`;
      await cache.set(key, csrfToken, CACHE_CONFIG.CSRF_TTL);
      logger.debug(
        `Cached CSRF token for session: ${sessionId.slice(0, 8)}...`
      );
    } catch (error) {
      logger.error('Failed to cache CSRF token:', error);
    }
  }

  /**
   * Get cached CSRF token
   */
  static async getCSRFToken(sessionId: string): Promise<CSRFToken | null> {
    try {
      const key = `${CACHE_KEYS.CSRF}${sessionId}`;
      const token = await cache.get<CSRFToken>(key);

      if (token) {
        // Check if token is expired
        if (Date.now() > token.expires) {
          await this.invalidateCSRFToken(sessionId);
          return null;
        }

        logger.debug(`Cache hit for CSRF token: ${sessionId.slice(0, 8)}...`);
      }

      return token;
    } catch (error) {
      logger.error('Failed to get cached CSRF token:', error);
      return null;
    }
  }

  /**
   * Invalidate CSRF token
   */
  static async invalidateCSRFToken(sessionId: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.CSRF}${sessionId}`;
      await cache.del(key);
      logger.debug(
        `Invalidated CSRF token for session: ${sessionId.slice(0, 8)}...`
      );
    } catch (error) {
      logger.error('Failed to invalidate CSRF token:', error);
    }
  }

  /**
   * Cache user preferences
   */
  static async setUserPreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<void> {
    try {
      const key = `${CACHE_KEYS.USER_PREFERENCES}${userId}`;
      await cache.set(key, preferences, CACHE_CONFIG.SESSION_TTL);
      logger.debug(`Cached user preferences: ${userId}`);
    } catch (error) {
      logger.error('Failed to cache user preferences:', error);
    }
  }

  /**
   * Get cached user preferences
   */
  static async getUserPreferences(
    userId: string
  ): Promise<Record<string, any> | null> {
    try {
      const key = `${CACHE_KEYS.USER_PREFERENCES}${userId}`;
      const preferences = await cache.get<Record<string, any>>(key);

      if (preferences) {
        logger.debug(`Cache hit for user preferences: ${userId}`);
      }

      return preferences;
    } catch (error) {
      logger.error('Failed to get cached user preferences:', error);
      return null;
    }
  }

  /**
   * Invalidate user preferences
   */
  static async invalidateUserPreferences(userId: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.USER_PREFERENCES}${userId}`;
      await cache.del(key);
      logger.debug(`Invalidated user preferences: ${userId}`);
    } catch (error) {
      logger.error('Failed to invalidate user preferences:', error);
    }
  }

  /**
   * Cache login attempt tracking
   */
  static async trackLoginAttempt(
    identifier: string,
    success: boolean
  ): Promise<number> {
    try {
      const key = `${CACHE_KEYS.RATE_LIMIT}login:${identifier}`;

      if (success) {
        // Clear failed attempts on successful login
        await cache.del(key);
        return 0;
      } else {
        // Increment failed attempts
        const attempts = await cache.incr(key, 60 * 60); // 1 hour TTL
        logger.debug(`Login attempt ${attempts} for: ${identifier}`);
        return attempts;
      }
    } catch (error) {
      logger.error('Failed to track login attempt:', error);
      return 0;
    }
  }

  /**
   * Get login attempt count
   */
  static async getLoginAttempts(identifier: string): Promise<number> {
    try {
      const key = `${CACHE_KEYS.RATE_LIMIT}login:${identifier}`;
      const attempts = await cache.get<number>(key);
      return attempts || 0;
    } catch (error) {
      logger.error('Failed to get login attempts:', error);
      return 0;
    }
  }

  /**
   * Clear login attempts
   */
  static async clearLoginAttempts(identifier: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.RATE_LIMIT}login:${identifier}`;
      await cache.del(key);
      logger.debug(`Cleared login attempts for: ${identifier}`);
    } catch (error) {
      logger.error('Failed to clear login attempts:', error);
    }
  }

  /**
   * Get session cache statistics
   */
  static async getStats(): Promise<{
    activeSessions: number;
    csrfTokens: number;
    userPreferences: number;
  }> {
    // This would require scanning Redis keys in production
    return {
      activeSessions: 0,
      csrfTokens: 0,
      userPreferences: 0,
    };
  }
}
