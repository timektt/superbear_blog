import { prisma } from '../prisma';
import { ArticleCache } from './article-cache';
import { SearchCache } from './search-cache';
import { logger } from '../logger';
import type { Article } from '@prisma/client';

/**
 * Cache warming utilities
 */
export class CacheWarming {
  /**
   * Warm up article caches with popular content
   */
  static async warmupArticles(): Promise<void> {
    try {
      // Get recent published articles
      const recentArticles = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              bio: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        take: 20, // Warm up top 20 articles
      });

      // Cache individual articles
      const cachePromises = recentArticles.map((article: Article) =>
        ArticleCache.setArticle(article.slug, article as any)
      );

      await Promise.allSettled(cachePromises);

      // Cache common article list queries
      const commonFilters = [
        { page: 1, limit: 10 }, // Homepage
        { page: 1, limit: 20 }, // Extended list
        { page: 1, limit: 10, category: 'ai' }, // AI category
        { page: 1, limit: 10, category: 'devtools' }, // DevTools category
      ];

      for (const filters of commonFilters) {
        const articles = recentArticles.slice(0, filters.limit);
        const cacheData = {
          articles,
          total: articles.length,
          page: filters.page,
          limit: filters.limit,
          hasMore: false,
        };

        await ArticleCache.setArticleList(filters, cacheData as any);
      }

      logger.info(
        `Warmed up article cache with ${recentArticles.length} articles`
      );
    } catch (error) {
      logger.error('Failed to warm up article cache:', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Warm up search caches with popular queries
   */
  static async warmupSearch(): Promise<void> {
    try {
      const popularQueries = [
        'artificial intelligence',
        'machine learning',
        'javascript',
        'react',
        'nextjs',
        'typescript',
        'devtools',
        'startup',
        'ai tools',
        'open source',
      ];

      // Cache search suggestions
      for (const query of popularQueries) {
        const suggestions = popularQueries
          .filter((q) => q.includes(query.toLowerCase()) && q !== query)
          .slice(0, 5);

        await SearchCache.setSearchSuggestions(query, suggestions);
      }

      logger.info(
        `Warmed up search cache with ${popularQueries.length} popular queries`
      );
    } catch (error) {
      logger.error('Failed to warm up search cache:', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Warm up category and tag caches
   */
  static async warmupTaxonomy(): Promise<void> {
    try {
      // Get popular categories
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              articles: {
                where: {
                  status: 'PUBLISHED',
                },
              },
            },
          },
        },
        orderBy: {
          articles: {
            _count: 'desc',
          },
        },
        take: 10,
      });

      // Get popular tags
      const tags = await prisma.tag.findMany({
        include: {
          _count: {
            select: {
              articles: {
                where: {
                  status: 'PUBLISHED',
                },
              },
            },
          },
        },
        orderBy: {
          articles: {
            _count: 'desc',
          },
        },
        take: 20,
      });

      // Cache category-based article lists
      for (const category of categories.slice(0, 5)) {
        const articles = await prisma.article.findMany({
          where: {
            status: 'PUBLISHED',
            categoryId: category.id,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                bio: true,
                avatar: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: {
            publishedAt: 'desc',
          },
          take: 10,
        });

        const filters = { page: 1, limit: 10, category: category.slug };
        const cacheData = {
          articles,
          total: articles.length,
          page: 1,
          limit: 10,
          hasMore: false,
        };

        await ArticleCache.setArticleList(filters, cacheData as any);
      }

      logger.info(
        `Warmed up taxonomy cache with ${categories.length} categories and ${tags.length} tags`
      );
    } catch (error) {
      logger.error('Failed to warm up taxonomy cache:', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Full cache warmup
   */
  static async warmupAll(): Promise<void> {
    try {
      await Promise.allSettled([
        this.warmupArticles(),
        this.warmupSearch(),
        this.warmupTaxonomy(),
      ]);

      logger.info('Completed full cache warmup');
    } catch (error) {
      logger.error('Failed to complete full cache warmup:', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Scheduled cache warmup (for cron jobs)
   */
  static async scheduledWarmup(): Promise<void> {
    try {
      // Only warm up critical caches during scheduled runs
      await Promise.allSettled([this.warmupArticles(), this.warmupTaxonomy()]);

      logger.info('Completed scheduled cache warmup');
    } catch (error) {
      logger.error('Failed to complete scheduled cache warmup:', error instanceof Error ? error : undefined);
    }
  }
}
