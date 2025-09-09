/**
 * Enhanced search query utilities with full-text search and ranking
 */

import { PrismaClient } from '@prisma/client';

export interface SearchParams {
  query: string;
  tag?: string;
  category?: string;
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'popularity';
}

export interface SearchResult {
  articles: any[];
  total: number;
  facets: {
    tags: Array<{ name: string; slug: string; count: number }>;
    authors: Array<{ name: string; count: number }>;
    categories: Array<{ name: string; slug: string; count: number }>;
  };
}

export interface SearchSuggestion {
  type: 'article' | 'tag' | 'category' | 'author';
  title: string;
  slug?: string;
  url: string;
}

/**
 * Enhanced search with full-text search, filtering, and ranking
 */
export async function searchArticles(
  prisma: PrismaClient,
  params: SearchParams
): Promise<SearchResult> {
  const {
    query,
    tag,
    category,
    author,
    dateRange,
    limit = 20,
    offset = 0,
    sortBy = 'relevance',
  } = params;

  const where: any = {
    status: 'PUBLISHED',
    publishedAt: { lte: new Date() },
  };

  // Full-text search with ranking
  if (query && query.trim()) {
    const searchTerms = query.trim().toLowerCase().split(/\s+/);

    where.OR = [
      // Exact title match (highest priority)
      { title: { contains: query, mode: 'insensitive' } },
      // Summary match
      { summary: { contains: query, mode: 'insensitive' } },
      // Individual term matches
      ...searchTerms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { summary: { contains: term, mode: 'insensitive' } },
        ],
      })),
    ];
  }

  // Tag filter
  if (tag) {
    where.tags = {
      some: { slug: tag },
    };
  }

  // Category filter
  if (category) {
    where.category = { slug: category };
  }

  // Author filter
  if (author) {
    where.author = { name: { contains: author, mode: 'insensitive' } };
  }

  // Date range filter
  if (dateRange) {
    where.publishedAt = {
      ...where.publishedAt,
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  // Determine sort order
  let orderBy: any = { publishedAt: 'desc' };
  if (sortBy === 'popularity') {
    orderBy = [{ stats: { totalViews: 'desc' } }, { publishedAt: 'desc' }];
  } else if (sortBy === 'relevance' && query) {
    // For relevance, we'll use a combination of factors
    orderBy = [
      { publishedAt: 'desc' }, // Fallback to date for now
    ];
  }

  const [articles, total, facets] = await Promise.all([
    prisma.article.findMany({
      where,
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
        stats: { select: { totalViews: true, totalShares: true } },
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.article.count({ where }),
    getFacets(prisma, where),
  ]);

  // Apply relevance scoring if searching by relevance
  let rankedArticles = articles;
  if (sortBy === 'relevance' && query) {
    rankedArticles = rankArticlesByRelevance(articles, query);
  }

  return {
    articles: rankedArticles,
    total,
    facets,
  };
}

/**
 * Get search facets for filtering
 */
async function getFacets(prisma: PrismaClient, baseWhere: any) {
  const [tagFacets, authorFacets, categoryFacets] = await Promise.all([
    // Tag facets
    prisma.tag.findMany({
      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            articles: {
              where: baseWhere,
            },
          },
        },
      },
      where: {
        articles: {
          some: baseWhere,
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
      take: 20,
    }),

    // Author facets
    prisma.author.findMany({
      select: {
        name: true,
        _count: {
          select: {
            articles: {
              where: baseWhere,
            },
          },
        },
      },
      where: {
        articles: {
          some: baseWhere,
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
      take: 10,
    }),

    // Category facets
    prisma.category.findMany({
      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            articles: {
              where: baseWhere,
            },
          },
        },
      },
      where: {
        articles: {
          some: baseWhere,
        },
      },
      orderBy: {
        articles: {
          _count: 'desc',
        },
      },
    }),
  ]);

  return {
    tags: tagFacets
      .map((tag) => ({
        name: tag.name,
        slug: tag.slug,
        count: tag._count.articles,
      }))
      .filter((tag) => tag.count > 0),

    authors: authorFacets
      .map((author) => ({
        name: author.name,
        count: author._count.articles,
      }))
      .filter((author) => author.count > 0),

    categories: categoryFacets
      .map((category) => ({
        name: category.name,
        slug: category.slug,
        count: category._count.articles,
      }))
      .filter((category) => category.count > 0),
  };
}

/**
 * Rank articles by relevance to search query
 */
function rankArticlesByRelevance(articles: any[], query: string): any[] {
  const searchTerms = query.toLowerCase().split(/\s+/);

  return articles
    .map((article) => {
      let score = 0;
      const title = article.title.toLowerCase();
      const summary = (article.summary || '').toLowerCase();

      // Exact query match in title (highest score)
      if (title.includes(query.toLowerCase())) {
        score += 100;
      }

      // Exact query match in summary
      if (summary.includes(query.toLowerCase())) {
        score += 50;
      }

      // Individual term matches
      searchTerms.forEach((term) => {
        if (title.includes(term)) score += 20;
        if (summary.includes(term)) score += 10;

        // Bonus for term at start of title
        if (title.startsWith(term)) score += 30;
      });

      // Popularity boost
      const views = article.stats?.totalViews || 0;
      score += Math.min(views / 100, 20); // Max 20 points from views

      // Recency boost (newer articles get slight boost)
      const daysOld =
        (Date.now() - new Date(article.publishedAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 10;
      else if (daysOld < 30) score += 5;

      return { ...article, _relevanceScore: score };
    })
    .sort((a, b) => b._relevanceScore - a._relevanceScore)
    .map(({ _relevanceScore, ...article }) => article);
}

/**
 * Get search suggestions for autocomplete
 */
export async function getSearchSuggestions(
  prisma: PrismaClient,
  query: string,
  limit: number = 10
): Promise<SearchSuggestion[]> {
  if (!query || query.length < 2) return [];

  const suggestions: SearchSuggestion[] = [];

  // Article suggestions
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      OR: [
        { title: { contains: query } },
        { summary: { contains: query } },
      ],
    },
    select: { title: true, slug: true },
    take: 5,
    orderBy: { publishedAt: 'desc' },
  });

  suggestions.push(
    ...articles.map((article) => ({
      type: 'article' as const,
      title: article.title,
      slug: article.slug,
      url: `/news/${article.slug}`,
    }))
  );

  // Tag suggestions
  const tags = await prisma.tag.findMany({
    where: {
      name: { contains: query },
    },
    select: { name: true, slug: true },
    take: 3,
  });

  suggestions.push(
    ...tags.map((tag) => ({
      type: 'tag' as const,
      title: `#${tag.name}`,
      slug: tag.slug,
      url: `/tag/${tag.slug}`,
    }))
  );

  // Category suggestions
  const categories = await prisma.category.findMany({
    where: {
      name: { contains: query },
    },
    select: { name: true, slug: true },
    take: 2,
  });

  suggestions.push(
    ...categories.map((category) => ({
      type: 'category' as const,
      title: category.name,
      slug: category.slug,
      url: `/${category.slug}`,
    }))
  );

  return suggestions.slice(0, limit);
}
