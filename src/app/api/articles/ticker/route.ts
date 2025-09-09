import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { compressedApiRoute } from '@/lib/compression';

async function handler() {
  try {
    const prisma = getPrisma();
    
    if (!prisma) {
      logger.warn('Database not available, returning fallback ticker data');
      return NextResponse.json([
        { id: 'fallback', title: 'Breaking: Stay tuned for updates', slug: '#' }
      ]);
    }

    // For now, simulate ticker articles by using the latest published articles
    // In the future, this would filter by ticker=true field
    const tickerArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 5, // Limit to 5 ticker items
    });

    // If no articles found, return fallback
    if (tickerArticles.length === 0) {
      return NextResponse.json([
        { id: 'fallback', title: 'Breaking: Stay tuned for updates', slug: '#' }
      ]);
    }

    return NextResponse.json(tickerArticles, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    logger.error('Error fetching ticker articles:', error as Error);
    
    // Return fallback data on error
    return NextResponse.json([
      { id: 'fallback', title: 'Breaking: Stay tuned for updates', slug: '#' }
    ], { status: 200 }); // Return 200 with fallback instead of error
  }
}

export const GET = compressedApiRoute(handler, {
  threshold: 512,
  level: 6,
});