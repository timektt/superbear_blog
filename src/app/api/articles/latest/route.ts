import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { compressedApiRoute } from '@/lib/compression';

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('take') || '12');
    
    // Validate take parameter (max 50 for performance)
    const limit = Math.min(Math.max(take, 1), 50);

    const prisma = getPrisma();
    
    if (!prisma) {
      logger.warn('Database not available, returning empty latest articles');
      return NextResponse.json([]);
    }

    const latestArticles = await prisma.article.findMany({
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
      take: limit,
    });

    // Transform articles to include expected fields for magazine layout
    const transformedArticles = latestArticles.map((article) => ({
      ...article,
      // Use summary as excerpt, or create from title if no summary
      excerpt: article.summary || `${article.title.substring(0, 150)}...`,
      // Use image as coverUrl for consistency with magazine design
      coverUrl: article.image,
      // Add thumbnail as alias for image
      thumbnail: article.image,
    }));

    return NextResponse.json(transformedArticles, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.error('Error fetching latest articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest articles' },
      { status: 500 }
    );
  }
}

export const GET = compressedApiRoute(handler, {
  threshold: 1024,
  level: 6,
});