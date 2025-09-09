import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { compressedApiRoute } from '@/lib/compression';

async function handler() {
  try {
    const prisma = getPrisma();
    
    if (!prisma) {
      logger.warn('Database not available, returning empty featured articles');
      return NextResponse.json([]);
    }

    // For now, simulate featured articles by using the latest published articles
    // In the future, this would filter by isFeatured=true and sort by featureRank
    const featuredArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
      },
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
      take: 4, // Return 3-4 articles as specified
    });

    // Add simulated featureRank to articles (1 for first, 2+ for others)
    const articlesWithRank = featuredArticles.map((article: any, index: number) => ({
      ...article,
      featureRank: index + 1,
      isFeatured: true,
      // Use summary as excerpt, or create from title if no summary
      excerpt: article.summary || `${article.title.substring(0, 150)}...`,
      // Use image as coverUrl
      coverUrl: article.image,
    }));

    return NextResponse.json(articlesWithRank, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.error('Error fetching featured articles:', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch featured articles' },
      { status: 500 }
    );
  }
}

export const GET = compressedApiRoute(handler, {
  threshold: 1024,
  level: 6,
});