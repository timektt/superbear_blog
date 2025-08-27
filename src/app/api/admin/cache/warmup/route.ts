import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CacheWarming } from '@/lib/cache/warming';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let message = '';

    if (type === 'articles') {
      await CacheWarming.warmupArticles();
      message = 'Article cache warmed up successfully';
    } else if (type === 'search') {
      await CacheWarming.warmupSearch();
      message = 'Search cache warmed up successfully';
    } else if (type === 'taxonomy') {
      await CacheWarming.warmupTaxonomy();
      message = 'Taxonomy cache warmed up successfully';
    } else {
      await CacheWarming.warmupAll();
      message = 'All caches warmed up successfully';
    }

    logger.info('Cache warmup completed', {
      userId: session.user.id,
      type: type || 'all',
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    logger.error('Failed to warm up cache:', error);

    return NextResponse.json(
      { error: 'Failed to warm up cache' },
      { status: 500 }
    );
  }
}
