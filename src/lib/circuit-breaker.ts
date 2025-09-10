/**
 * In-memory circuit breaker implementation for database operations
 * States: closed (normal) -> open (failing) -> half-open (testing)
 */

import { safeEnv } from './env';
import { logger } from './logger';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  monitoringWindowMs: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  nextAttemptTime?: number;
}

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private nextAttemptTime?: number;
  private readonly config: CircuitBreakerConfig;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? safeEnv.BREAKER_THRESHOLD,
      resetTimeoutMs: config?.resetTimeoutMs ?? safeEnv.BREAKER_RESET_MS,
      monitoringWindowMs: config?.monitoringWindowMs ?? 60000, // 1 minute
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        logger.info('Circuit breaker transitioning to half-open state');
      } else {
        if (fallback) {
          logger.debug('Circuit breaker open, using fallback');
          return fallback();
        }
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback && (this.state as CircuitState) === 'open') {
        logger.debug('Operation failed, circuit open, using fallback');
        return fallback();
      }
      throw error;
    }
  }

  /**
   * Check if operation is allowed (circuit not open)
   */
  isCallAllowed(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'half-open') return true;
    if (this.state === 'open') return this.shouldAttemptReset();
    return false;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
    logger.info('Circuit breaker manually reset to closed state');
  }

  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();

    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failures = 0;
      this.nextAttemptTime = undefined;
      logger.info(
        'Circuit breaker reset to closed state after successful operation'
      );
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      this.state = 'open';
      this.nextAttemptTime = Date.now() + this.config.resetTimeoutMs;
      logger.warn('Circuit breaker opened from half-open state after failure');
    } else if (
      this.state === 'closed' &&
      this.failures >= this.config.failureThreshold
    ) {
      this.state = 'open';
      this.nextAttemptTime = Date.now() + this.config.resetTimeoutMs;
      logger.warn(
        `Circuit breaker opened after ${this.failures} failures (threshold: ${this.config.failureThreshold})`
      );
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.nextAttemptTime !== undefined && Date.now() >= this.nextAttemptTime
    );
  }
}

// Global circuit breaker instance for database operations
export const dbCircuitBreaker = new CircuitBreaker();

/**
 * Wrapper for database operations with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> {
  return dbCircuitBreaker.execute(operation, fallback);
}

/**
 * Check if database operations are currently allowed
 */
export function isDatabaseCallAllowed(): boolean {
  return dbCircuitBreaker.isCallAllowed();
}

/**
 * Get current circuit breaker state and statistics
 */
export function getCircuitBreakerStats(): CircuitBreakerStats {
  return dbCircuitBreaker.getStats();
}

/**
 * Reset circuit breaker (for testing or manual recovery)
 */
export function resetCircuitBreaker(): void {
  dbCircuitBreaker.reset();
}
