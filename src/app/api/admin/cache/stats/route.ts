import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { cache } from '@/lib/redis';
import { ArticleCache } from '@/lib/cache/article-cache';
import { SearchCache } from '@/lib/cache/search-cache';
import { AnalyticsCache } from '@/lib/cache/analytics-cache';
import { SessionCache } from '@/lib/cache/session-cache';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cache statistics
    const [
      cacheStats,
      articleStats,
      searchStats,
      analyticsStats,
      sessionStats,
    ] = await Promise.allSettled([
      cache.getStats(),
      ArticleCache.getStats(),
      SearchCache.getStats(),
      AnalyticsCache.getStats(),
      SessionCache.getStats(),
    ]);

    const stats = {
      redis: {
        connected:
          cacheStats.status === 'fulfilled' ? cacheStats.value.redis : false,
        memoryKeys:
          cacheStats.status === 'fulfilled' ? cacheStats.value.memoryKeys : 0,
        info:
          cacheStats.status === 'fulfilled' ? cacheStats.value.redisInfo : null,
      },
      articles:
        articleStats.status === 'fulfilled'
          ? articleStats.value
          : { articleCount: 0, listCount: 0 },
      search:
        searchStats.status === 'fulfilled'
          ? searchStats.value
          : { cachedQueries: 0, popularQueries: 0, suggestions: 0 },
      analytics:
        analyticsStats.status === 'fulfilled'
          ? analyticsStats.value
          : { analyticsQueries: 0, campaignAnalytics: 0, articleViews: 0 },
      sessions:
        sessionStats.status === 'fulfilled'
          ? sessionStats.value
          : { activeSessions: 0, csrfTokens: 0, userPreferences: 0 },
      timestamp: new Date().toISOString(),
    };

    logger.info('Cache statistics requested', { userId: session.user.id });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get cache statistics:', error as Error);

    return NextResponse.json(
      { error: 'Failed to get cache statistics' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'articles') {
      await ArticleCache.invalidateAll();
    } else if (type === 'search') {
      await SearchCache.invalidateSearchCaches();
    } else if (type === 'analytics') {
      await AnalyticsCache.invalidateAnalytics();
    } else {
      // Clear all caches
      await Promise.allSettled([
        ArticleCache.invalidateAll(),
        SearchCache.invalidateSearchCaches(),
        AnalyticsCache.invalidateAnalytics(),
      ]);
    }

    logger.info('Cache cleared', {
      userId: session.user.id,
      type: type || 'all',
    });

    return NextResponse.json({
      success: true,
      message: `Cache cleared${type ? ` for type: ${type}` : ''}`,
    });
  } catch (error) {
    logger.error('Failed to clear cache:', error as Error);

    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
