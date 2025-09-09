import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { compressedApiRoute } from '@/lib/compression';

async function handler() {
  try {
    const prisma = getPrisma();
    
    if (!prisma) {
      logger.warn('Database not available, returning empty categories');
      return NextResponse.json([]);
    }

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
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
        name: 'asc',
      },
    });

    // Transform to include articleCount field as expected by magazine layout
    const categoriesWithCount = categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      articleCount: category._count.articles,
    }));

    // Filter to only include categories with articles (optional - can be removed if you want to show all categories)
    const categoriesWithArticles = categoriesWithCount.filter(
      (category: any) => category.articleCount > 0
    );

    return NextResponse.json(categoriesWithArticles, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200', // Longer cache for categories
      },
    });
  } catch (error) {
    logger.error('Error fetching categories with count:', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export const GET = compressedApiRoute(handler, {
  threshold: 512,
  level: 6,
});