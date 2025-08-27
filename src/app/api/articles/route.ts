import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Prisma } from '@prisma/client';
import { ArticleCache } from '@/lib/cache/article-cache';
import { logger } from '@/lib/logger';
import { compressedApiRoute } from '@/lib/compression';

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search');

    // Create filters object for caching
    const filters = {
      page,
      limit,
      category,
      tags: tags.sort(), // Sort for consistent cache keys
      search,
    };

    // Try to get from cache first
    const cachedResult = await ArticleCache.getArticleList(filters);
    if (cachedResult) {
      logger.debug('Serving articles from cache');
      return NextResponse.json(
        {
          articles: cachedResult.articles,
          pagination: {
            page: cachedResult.page,
            limit: cachedResult.limit,
            total: cachedResult.total,
            pages: Math.ceil(cachedResult.total / cachedResult.limit),
          },
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            'X-Cache': 'HIT',
          },
        }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: Prisma.ArticleWhereInput = {
      status: Status.PUBLISHED,
    };

    if (category) {
      where.category = {
        slug: category,
      };
    }

    // Support multiple tag filtering (AND logic - article must have all selected tags)
    if (tags.length > 0) {
      if (tags.length === 1) {
        where.tags = {
          some: {
            slug: tags[0],
          },
        };
      } else {
        // For multiple tags, we need to ensure the article has ALL selected tags
        where.AND = tags.map((tagSlug) => ({
          tags: {
            some: {
              slug: tagSlug,
            },
          },
        }));
      }
    }

    // Enhanced search (case-sensitive for SQLite)
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { title: { contains: searchTerm } },
        { summary: { contains: searchTerm } },
        // Note: Full-text search on JSON content would require database-specific implementation
        // For PostgreSQL, we could use to_tsvector and mode: 'insensitive'
      ];
    }

    // Get articles with related data
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
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
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    // Cache the result
    const cacheData = {
      articles,
      total,
      page,
      limit,
      hasMore: total > page * limit,
    };

    await ArticleCache.setArticleList(filters, cacheData);

    logger.debug('Serving articles from database and caching');

    return NextResponse.json(
      {
        articles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'MISS',
        },
      }
    );
  } catch (error) {
    logger.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export const GET = compressedApiRoute(handler, {
  threshold: 1024, // Compress responses larger than 1KB
  level: 6, // Balanced compression level
});
