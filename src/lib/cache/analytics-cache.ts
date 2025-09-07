// @ts-nocheck
import { cache, CACHE_CONFIG, CACHE_KEYS } from '../redis';
import { logger } from '../logger';

export interface AnalyticsData {
  views: number;
  uniqueViews: number;
  avgReadTime: number;
  bounceRate: number;
  topArticles: Array<{
    id: string;
    title: string;
    slug: string;
    views: number;
  }>;
  topCategories: Array<{
    name: string;
    slug: string;
    views: number;
  }>;
  topTags: Array<{
    name: string;
    slug: string;
    views: number;
  }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface CampaignAnalytics {
  campaignId: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  revenue?: number;
}

/**
 * Analytics caching utilities
 */
export class AnalyticsCache {
  /**
   * Cache analytics data
   */
  static async setAnalytics(
    type: string,
    timeRange: string,
    filters: Record<string, any>,
    data: AnalyticsData
  ): Promise<void> {
    try {
      const key = this.generateAnalyticsKey(type, timeRange, filters);
      await cache.set(key, data, CACHE_CONFIG.ANALYTICS_TTL);
      logger.debug(`Cached analytics: ${key}`);
    } catch (error) {
      logger.error('Failed to cache analytics:', error);
    }
  }

  /**
   * Get cached analytics data
   */
  static async getAnalytics(
    type: string,
    timeRange: string,
    filters: Record<string, any>
  ): Promise<AnalyticsData | null> {
    try {
      const key = this.generateAnalyticsKey(type, timeRange, filters);
      const data = await cache.get<AnalyticsData>(key);

      if (data) {
        logger.debug(`Cache hit for analytics: ${key}`);
      }

      return data;
    } catch (error) {
      logger.error('Failed to get cached analytics:', error);
      return null;
    }
  }

  /**
   * Cache campaign analytics
   */
  static async setCampaignAnalytics(
    campaignId: string,
    data: CampaignAnalytics
  ): Promise<void> {
    try {
      const key = `${CACHE_KEYS.ANALYTICS}campaign:${campaignId}`;
      await cache.set(key, data, CACHE_CONFIG.ANALYTICS_TTL);
      logger.debug(`Cached campaign analytics: ${campaignId}`);
    } catch (error) {
      logger.error('Failed to cache campaign analytics:', error);
    }
  }

  /**
   * Get cached campaign analytics
   */
  static async getCampaignAnalytics(
    campaignId: string
  ): Promise<CampaignAnalytics | null> {
    try {
      const key = `${CACHE_KEYS.ANALYTICS}campaign:${campaignId}`;
      const data = await cache.get<CampaignAnalytics>(key);

      if (data) {
        logger.debug(`Cache hit for campaign analytics: ${campaignId}`);
      }

      return data;
    } catch (error) {
      logger.error('Failed to get cached campaign analytics:', error);
      return null;
    }
  }

  /**
   * Cache real-time metrics
   */
  static async setRealTimeMetrics(
    metrics: Record<string, number>
  ): Promise<void> {
    try {
      const key = `${CACHE_KEYS.ANALYTICS}realtime`;
      await cache.set(key, metrics, 60); // 1 minute TTL for real-time data
      logger.debug('Cached real-time metrics');
    } catch (error) {
      logger.error('Failed to cache real-time metrics:', error);
    }
  }

  /**
   * Get cached real-time metrics
   */
  static async getRealTimeMetrics(): Promise<Record<string, number> | null> {
    try {
      const key = `${CACHE_KEYS.ANALYTICS}realtime`;
      const data = await cache.get<Record<string, number>>(key);

      if (data) {
        logger.debug('Cache hit for real-time metrics');
      }

      return data;
    } catch (error) {
      logger.error('Failed to get cached real-time metrics:', error);
      return null;
    }
  }

  /**
   * Invalidate analytics caches
   */
  static async invalidateAnalytics(type?: string): Promise<void> {
    try {
      const pattern = type
        ? `${CACHE_KEYS.ANALYTICS}${type}:*`
        : `${CACHE_KEYS.ANALYTICS}*`;

      await cache.delPattern(pattern);
      logger.debug(`Invalidated analytics caches: ${pattern}`);
    } catch (error) {
      logger.error('Failed to invalidate analytics caches:', error);
    }
  }

  /**
   * Cache article view count
   */
  static async incrementArticleViews(
    articleId: string,
    isUnique: boolean = false
  ): Promise<number> {
    try {
      const viewKey = `${CACHE_KEYS.ANALYTICS}views:${articleId}`;
      const uniqueKey = `${CACHE_KEYS.ANALYTICS}unique_views:${articleId}`;

      const viewCount = await cache.incr(viewKey, 60 * 60 * 24); // 24 hours TTL

      if (isUnique) {
        await cache.incr(uniqueKey, 60 * 60 * 24); // 24 hours TTL
      }

      return viewCount;
    } catch (error) {
      logger.error('Failed to increment article views:', error);
      return 0;
    }
  }

  /**
   * Get article view counts
   */
  static async getArticleViews(articleId: string): Promise<{
    views: number;
    uniqueViews: number;
  }> {
    try {
      const viewKey = `${CACHE_KEYS.ANALYTICS}views:${articleId}`;
      const uniqueKey = `${CACHE_KEYS.ANALYTICS}unique_views:${articleId}`;

      const [views, uniqueViews] = await Promise.all([
        cache.get<number>(viewKey),
        cache.get<number>(uniqueKey),
      ]);

      return {
        views: views || 0,
        uniqueViews: uniqueViews || 0,
      };
    } catch (error) {
      logger.error('Failed to get article views:', error);
      return { views: 0, uniqueViews: 0 };
    }
  }

  /**
   * Generate cache key for analytics data
   */
  private static generateAnalyticsKey(
    type: string,
    timeRange: string,
    filters: Record<string, any>
  ): string {
    const params = {
      type,
      timeRange,
      filters,
    };

    const paramString = JSON.stringify(params);
    const hash = Buffer.from(paramString).toString('base64').slice(0, 16);

    return `${CACHE_KEYS.ANALYTICS}${type}:${hash}`;
  }

  /**
   * Get analytics cache statistics
   */
  static async getStats(): Promise<{
    analyticsQueries: number;
    campaignAnalytics: number;
    articleViews: number;
  }> {
    // This would require scanning Redis keys in production
    return {
      analyticsQueries: 0,
      campaignAnalytics: 0,
      articleViews: 0,
    };
  }
}
