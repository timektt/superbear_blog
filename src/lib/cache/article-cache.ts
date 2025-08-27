import { cache, CACHE_CONFIG, CACHE_KEYS } from '../redis';
import { logger } from '../logger';

export interface CachedArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: any;
  image?: string;
  status: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface ArticleListCache {
  articles: CachedArticle[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Article caching utilities
 */
export class ArticleCache {
  /**
   * Cache a single article
   */
  static async setArticle(slug: string, article: CachedArticle): Promise<void> {
    try {
      const key = `${CACHE_KEYS.ARTICLE}${slug}`;
      await cache.set(key, article, CACHE_CONFIG.ARTICLE_TTL);
      logger.debug(`Cached article: ${slug}`);
    } catch (error) {
      logger.error('Failed to cache article:', error);
    }
  }

  /**
   * Get a cached article
   */
  static async getArticle(slug: string): Promise<CachedArticle | null> {
    try {
      const key = `${CACHE_KEYS.ARTICLE}${slug}`;
      const article = await cache.get<CachedArticle>(key);

      if (article) {
        logger.debug(`Cache hit for article: ${slug}`);
      }

      return article;
    } catch (error) {
      logger.error('Failed to get cached article:', error);
      return null;
    }
  }

  /**
   * Cache article list with filters
   */
  static async setArticleList(
    filters: Record<string, any>,
    data: ArticleListCache
  ): Promise<void> {
    try {
      const key = this.generateListKey(filters);
      await cache.set(key, data, CACHE_CONFIG.ARTICLE_LIST_TTL);
      logger.debug(`Cached article list: ${key}`);
    } catch (error) {
      logger.error('Failed to cache article list:', error);
    }
  }

  /**
   * Get cached article list
   */
  static async getArticleList(
    filters: Record<string, any>
  ): Promise<ArticleListCache | null> {
    try {
      const key = this.generateListKey(filters);
      const data = await cache.get<ArticleListCache>(key);

      if (data) {
        logger.debug(`Cache hit for article list: ${key}`);
      }

      return data;
    } catch (error) {
      logger.error('Failed to get cached article list:', error);
      return null;
    }
  }

  /**
   * Invalidate article cache
   */
  static async invalidateArticle(slug: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.ARTICLE}${slug}`;
      await cache.del(key);
      logger.debug(`Invalidated article cache: ${slug}`);
    } catch (error) {
      logger.error('Failed to invalidate article cache:', error);
    }
  }

  /**
   * Invalidate all article list caches
   */
  static async invalidateArticleLists(): Promise<void> {
    try {
      const pattern = `${CACHE_KEYS.ARTICLE_LIST}*`;
      await cache.delPattern(pattern);
      logger.debug('Invalidated all article list caches');
    } catch (error) {
      logger.error('Failed to invalidate article list caches:', error);
    }
  }

  /**
   * Invalidate all caches for an article (including lists)
   */
  static async invalidateAll(slug?: string): Promise<void> {
    try {
      if (slug) {
        await this.invalidateArticle(slug);
      }
      await this.invalidateArticleLists();
      logger.debug('Invalidated all article caches');
    } catch (error) {
      logger.error('Failed to invalidate all article caches:', error);
    }
  }

  /**
   * Generate cache key for article lists based on filters
   */
  private static generateListKey(filters: Record<string, any>): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = filters[key];
          return result;
        },
        {} as Record<string, any>
      );

    const filterString = JSON.stringify(sortedFilters);
    const hash = Buffer.from(filterString).toString('base64').slice(0, 16);

    return `${CACHE_KEYS.ARTICLE_LIST}${hash}`;
  }

  /**
   * Warm up cache with popular articles
   */
  static async warmupCache(articles: CachedArticle[]): Promise<void> {
    try {
      const promises = articles.map((article) =>
        this.setArticle(article.slug, article)
      );

      await Promise.allSettled(promises);
      logger.info(`Warmed up cache with ${articles.length} articles`);
    } catch (error) {
      logger.error('Failed to warm up article cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    articleCount: number;
    listCount: number;
  }> {
    // This would require scanning Redis keys in production
    // For now, return basic stats
    return {
      articleCount: 0,
      listCount: 0,
    };
  }
}
