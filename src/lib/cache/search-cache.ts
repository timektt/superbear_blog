import { cache, CACHE_CONFIG, CACHE_KEYS } from '../redis';
import { logger } from '../logger';

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  image?: string;
  publishedAt?: Date;
  author: {
    name: string;
  };
  category: {
    name: string;
    slug: string;
  };
  tags: Array<{
    name: string;
    slug: string;
  }>;
  relevanceScore?: number;
}

export interface SearchCache {
  results: SearchResult[];
  total: number;
  query: string;
  filters: Record<string, any>;
  page: number;
  limit: number;
  executionTime: number;
}

/**
 * Search result caching utilities
 */
export class SearchCache {
  /**
   * Cache search results
   */
  static async setSearchResults(
    query: string,
    filters: Record<string, any>,
    page: number,
    limit: number,
    data: Omit<SearchCache, 'query' | 'filters' | 'page' | 'limit'>
  ): Promise<void> {
    try {
      const key = this.generateSearchKey(query, filters, page, limit);
      const cacheData: SearchCache = {
        ...data,
        query,
        filters,
        page,
        limit,
      };

      await cache.set(key, cacheData, CACHE_CONFIG.SEARCH_TTL);
      logger.debug(`Cached search results: ${key}`);
    } catch (error) {
      logger.error('Failed to cache search results:', error);
    }
  }

  /**
   * Get cached search results
   */
  static async getSearchResults(
    query: string,
    filters: Record<string, any>,
    page: number,
    limit: number
  ): Promise<SearchCache | null> {
    try {
      const key = this.generateSearchKey(query, filters, page, limit);
      const data = await cache.get<SearchCache>(key);

      if (data) {
        logger.debug(`Cache hit for search: ${key}`);
      }

      return data;
    } catch (error) {
      logger.error('Failed to get cached search results:', error);
      return null;
    }
  }

  /**
   * Invalidate search caches
   */
  static async invalidateSearchCaches(): Promise<void> {
    try {
      const pattern = `${CACHE_KEYS.SEARCH}*`;
      await cache.delPattern(pattern);
      logger.debug('Invalidated all search caches');
    } catch (error) {
      logger.error('Failed to invalidate search caches:', error);
    }
  }

  /**
   * Cache popular search queries
   */
  static async cachePopularQuery(query: string): Promise<void> {
    try {
      const key = `${CACHE_KEYS.SEARCH}popular:${query.toLowerCase()}`;
      await cache.incr(key, 60 * 60 * 24 * 7); // 7 days TTL
    } catch (error) {
      logger.error('Failed to cache popular query:', error);
    }
  }

  /**
   * Get popular search queries
   */
  static async getPopularQueries(limit: number = 10): Promise<string[]> {
    try {
      // This would require more complex Redis operations in production
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to get popular queries:', error);
      return [];
    }
  }

  /**
   * Cache search suggestions
   */
  static async setSearchSuggestions(
    query: string,
    suggestions: string[]
  ): Promise<void> {
    try {
      const key = `${CACHE_KEYS.SEARCH}suggestions:${query.toLowerCase()}`;
      await cache.set(key, suggestions, CACHE_CONFIG.SEARCH_TTL);
      logger.debug(`Cached search suggestions for: ${query}`);
    } catch (error) {
      logger.error('Failed to cache search suggestions:', error);
    }
  }

  /**
   * Get cached search suggestions
   */
  static async getSearchSuggestions(query: string): Promise<string[] | null> {
    try {
      const key = `${CACHE_KEYS.SEARCH}suggestions:${query.toLowerCase()}`;
      const suggestions = await cache.get<string[]>(key);

      if (suggestions) {
        logger.debug(`Cache hit for search suggestions: ${query}`);
      }

      return suggestions;
    } catch (error) {
      logger.error('Failed to get cached search suggestions:', error);
      return null;
    }
  }

  /**
   * Generate cache key for search results
   */
  private static generateSearchKey(
    query: string,
    filters: Record<string, any>,
    page: number,
    limit: number
  ): string {
    const searchParams = {
      query: query.toLowerCase().trim(),
      filters,
      page,
      limit,
    };

    const paramString = JSON.stringify(searchParams);
    const hash = Buffer.from(paramString).toString('base64').slice(0, 16);

    return `${CACHE_KEYS.SEARCH}${hash}`;
  }

  /**
   * Get search cache statistics
   */
  static async getStats(): Promise<{
    cachedQueries: number;
    popularQueries: number;
    suggestions: number;
  }> {
    // This would require scanning Redis keys in production
    return {
      cachedQueries: 0,
      popularQueries: 0,
      suggestions: 0,
    };
  }
}
