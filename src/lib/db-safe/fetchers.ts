import { getSafePrismaClient } from './client';
import {
  MOCK_FEATURED,
  MOCK_TOP_HEADLINES,
  MOCK_LATEST,
  mockRightRailItems,
  mockStorylinesItems,
  mockStartupsFeatured,
  mockStartupsSide,
  mockPodcastItems,
} from '@/lib/mockData';

// Types for safe data fetching
export interface SafeArticle {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content?: unknown;
  image: string | null;
  imageUrl?: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    avatar?: string | null;
    bio?: string | null;
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

export interface SafeHeadline {
  title: string;
  timeAgo: string;
  slug: string;
  createdAt?: Date;
}

/**
 * Safely fetch featured article with fallback to mock data
 */
export async function safeFetchFeaturedArticle(): Promise<SafeArticle> {
  const prisma = getSafePrismaClient();

  if (!prisma) {
    return {
      id: 'mock-featured',
      title: MOCK_FEATURED.title,
      slug: MOCK_FEATURED.slug,
      summary: MOCK_FEATURED.summary,
      image: MOCK_FEATURED.imageUrl,
      imageUrl: MOCK_FEATURED.imageUrl,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: 'mock-author',
        name: MOCK_FEATURED.author.name,
        avatar: null,
      },
      category: {
        id: 'mock-category',
        name: MOCK_FEATURED.category.name,
        slug: MOCK_FEATURED.category.slug,
      },
      tags: MOCK_FEATURED.tags.map((tag, index) => ({
        id: `mock-tag-${index}`,
        name: tag,
        slug: tag.toLowerCase().replace(/\s+/g, '-'),
      })),
    };
  }

  try {
    const article = await prisma.article.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });

    if (article) {
      return {
        ...article,
        imageUrl: article.image,
      };
    }
  } catch (error) {
    console.warn('Failed to fetch featured article, using mock data:', error);
  }

  // Fallback to mock data
  return safeFetchFeaturedArticle();
}

/**
 * Safely fetch headlines with fallback to mock data
 */
export async function safeFetchHeadlines(limit = 5): Promise<SafeHeadline[]> {
  const prisma = getSafePrismaClient();

  if (!prisma) {
    return MOCK_TOP_HEADLINES.slice(0, limit);
  }

  try {
    const headlines = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        title: true,
        slug: true,
        createdAt: true,
      },
    });

    if (headlines.length > 0) {
      return headlines.map((headline) => ({
        title: headline.title,
        slug: headline.slug,
        timeAgo: getTimeAgo(headline.createdAt),
        createdAt: headline.createdAt,
      }));
    }
  } catch (error) {
    console.warn('Failed to fetch headlines, using mock data:', error);
  }

  return MOCK_TOP_HEADLINES.slice(0, limit);
}

/**
 * Safely fetch latest articles with fallback to mock data
 */
export async function safeFetchLatestArticles(
  limit = 10
): Promise<SafeArticle[]> {
  const prisma = getSafePrismaClient();

  if (!prisma) {
    return MOCK_LATEST.slice(0, limit).map((article, index) => ({
      id: `mock-${index}`,
      title: article.title,
      slug: article.slug,
      summary: article.snippet || null,
      image: article.imageUrl,
      imageUrl: article.imageUrl,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      author: {
        id: `mock-author-${index}`,
        name: article.author,
      },
      category: {
        id: `mock-category-${index}`,
        name: article.category,
        slug: article.category.toLowerCase().replace(/\s+/g, '-'),
      },
      tags: (article.tags || []).map((tag, tagIndex) => ({
        id: `mock-tag-${index}-${tagIndex}`,
        name: tag,
        slug: tag.toLowerCase().replace(/\s+/g, '-'),
      })),
    }));
  }

  try {
    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });

    if (articles.length > 0) {
      return articles.map((article) => ({
        ...article,
        imageUrl: article.image,
      }));
    }
  } catch (error) {
    console.warn('Failed to fetch latest articles, using mock data:', error);
  }

  return safeFetchLatestArticles(limit);
}

/**
 * Safely fetch article by slug with fallback to mock data
 */
export async function safeFetchArticleBySlug(
  slug: string
): Promise<SafeArticle | null> {
  const prisma = getSafePrismaClient();

  if (!prisma) {
    // Return mock article if slug matches
    const mockArticle = MOCK_LATEST.find((article) => article.slug === slug);
    if (mockArticle) {
      return {
        id: 'mock-article',
        title: mockArticle.title,
        slug: mockArticle.slug,
        summary: mockArticle.snippet || null,
        content: `<p>${mockArticle.snippet || 'Mock article content'}</p>`,
        image: mockArticle.imageUrl,
        imageUrl: mockArticle.imageUrl,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: 'mock-author',
          name: mockArticle.author,
        },
        category: {
          id: 'mock-category',
          name: mockArticle.category,
          slug: mockArticle.category.toLowerCase().replace(/\s+/g, '-'),
        },
        tags: (mockArticle.tags || []).map((tag, index) => ({
          id: `mock-tag-${index}`,
          name: tag,
          slug: tag.toLowerCase().replace(/\s+/g, '-'),
        })),
      };
    }
    return null;
  }

  try {
    const article = await prisma.article.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
    });

    if (article) {
      return {
        ...article,
        imageUrl: article.image,
      };
    }
  } catch (error) {
    console.warn(`Failed to fetch article ${slug}, using mock data:`, error);
  }

  return null;
}

/**
 * Helper function to calculate time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
