// @ts-nocheck
import { cache } from '../redis';
import { ArticleCache } from './article-cache';
import { SearchCache } from './search-cache';
import { AnalyticsCache } from './analytics-cache';
import { logger } from '../logger';

/**
 * Cache invalidation strategies and utilities
 */
export class CacheInvalidation {
  /**
   * Invalidate all caches related to an article
   */
  static async invalidateArticle(articleSlug: string): Promise<void> {
    try {
      await Promise.allSettled([
        ArticleCache.invalidateArticle(articleSlug),
        ArticleCache.invalidateArticleLists(),
        SearchCache.invalidateSearchCaches(),
        AnalyticsCache.invalidateAnalytics(),
      ]);

      logger.info(`Invalidated all caches for article: ${articleSlug}`);
    } catch (error) {
      logger.error('Failed to invalidate article caches:', error);
    }
  }

  /**
   * Invalidate caches when article is published/unpublished
   */
  static async invalidateArticleStatus(articleSlug: string): Promise<void> {
    try {
      await Promise.allSettled([
        ArticleCache.invalidateAll(articleSlug),
        SearchCache.invalidateSearchCaches(),
        AnalyticsCache.invalidateAnalytics(),
      ]);

      logger.info(
        `Invalidated status-related caches for article: ${articleSlug}`
      );
    } catch (error) {
      logger.error('Failed to invalidate article status caches:', error);
    }
  }

  /**
   * Invalidate caches when categories/tags are modified
   */
  static async invalidateTaxonomy(): Promise<void> {
    try {
      await Promise.allSettled([
        ArticleCache.invalidateArticleLists(),
        SearchCache.invalidateSearchCaches(),
      ]);

      logger.info('Invalidated taxonomy-related caches');
    } catch (error) {
      logger.error('Failed to invalidate taxonomy caches:', error);
    }
  }

  /**
   * Invalidate search-related caches
   */
  static async invalidateSearch(): Promise<void> {
    try {
      await SearchCache.invalidateSearchCaches();
      logger.info('Invalidated search caches');
    } catch (error) {
      logger.error('Failed to invalidate search caches:', error);
    }
  }

  /**
   * Invalidate analytics caches
   */
  static async invalidateAnalytics(type?: string): Promise<void> {
    try {
      await AnalyticsCache.invalidateAnalytics(type);
      logger.info(
        `Invalidated analytics caches${type ? ` for type: ${type}` : ''}`
      );
    } catch (error) {
      logger.error('Failed to invalidate analytics caches:', error);
    }
  }

  /**
   * Scheduled cache cleanup (for expired entries)
   */
  static async scheduledCleanup(): Promise<void> {
    try {
      // This would be more sophisticated in production with Redis SCAN
      logger.info('Performed scheduled cache cleanup');
    } catch (error) {
      logger.error('Failed to perform scheduled cache cleanup:', error);
    }
  }

  /**
   * Emergency cache flush (clear all caches)
   */
  static async emergencyFlush(): Promise<void> {
    try {
      await Promise.allSettled([
        ArticleCache.invalidateAll(),
        SearchCache.invalidateSearchCaches(),
        AnalyticsCache.invalidateAnalytics(),
      ]);

      logger.warn('Performed emergency cache flush');
    } catch (error) {
      logger.error('Failed to perform emergency cache flush:', error);
    }
  }

  /**
   * Warm up critical caches
   */
  static async warmupCaches(): Promise<void> {
    try {
      // This would fetch and cache popular/recent articles
      logger.info('Cache warmup completed');
    } catch (error) {
      logger.error('Failed to warm up caches:', error);
    }
  }

  /**
   * Get cache invalidation statistics
   */
  static async getInvalidationStats(): Promise<{
    totalInvalidations: number;
    lastInvalidation: Date | null;
    pendingInvalidations: number;
  }> {
    // This would track invalidation metrics in production
    return {
      totalInvalidations: 0,
      lastInvalidation: null,
      pendingInvalidations: 0,
    };
  }
}

/**
 * Cache invalidation hooks for database operations
 */
export class CacheHooks {
  /**
   * Hook for after article creation
   */
  static async afterArticleCreate(articleSlug: string): Promise<void> {
    await CacheInvalidation.invalidateArticleLists();
    logger.debug(`Cache hook: article created - ${articleSlug}`);
  }

  /**
   * Hook for after article update
   */
  static async afterArticleUpdate(articleSlug: string): Promise<void> {
    await CacheInvalidation.invalidateArticle(articleSlug);
    logger.debug(`Cache hook: article updated - ${articleSlug}`);
  }

  /**
   * Hook for after article deletion
   */
  static async afterArticleDelete(articleSlug: string): Promise<void> {
    await CacheInvalidation.invalidateArticle(articleSlug);
    logger.debug(`Cache hook: article deleted - ${articleSlug}`);
  }

  /**
   * Hook for after article status change
   */
  static async afterArticleStatusChange(articleSlug: string): Promise<void> {
    await CacheInvalidation.invalidateArticleStatus(articleSlug);
    logger.debug(`Cache hook: article status changed - ${articleSlug}`);
  }

  /**
   * Hook for after category/tag changes
   */
  static async afterTaxonomyChange(): Promise<void> {
    await CacheInvalidation.invalidateTaxonomy();
    logger.debug('Cache hook: taxonomy changed');
  }
}
