import { NextRequest, NextResponse } from 'next/server';
import { CacheHooks } from './invalidation';
import { logger } from '../logger';

/**
 * Cache middleware for automatic invalidation
 */
export class CacheMiddleware {
  /**
   * Middleware for article operations
   */
  static async articleMiddleware(
    request: NextRequest,
    response: NextResponse,
    operation: 'create' | 'update' | 'delete' | 'status_change',
    articleSlug?: string
  ): Promise<void> {
    try {
      switch (operation) {
        case 'create':
          if (articleSlug) {
            await CacheHooks.afterArticleCreate(articleSlug);
          }
          break;
        case 'update':
          if (articleSlug) {
            await CacheHooks.afterArticleUpdate(articleSlug);
          }
          break;
        case 'delete':
          if (articleSlug) {
            await CacheHooks.afterArticleDelete(articleSlug);
          }
          break;
        case 'status_change':
          if (articleSlug) {
            await CacheHooks.afterArticleStatusChange(articleSlug);
          }
          break;
      }
    } catch (error) {
      logger.error(
        'Cache middleware error:',
        error instanceof Error ? error : undefined
      );
      // Don't fail the request if cache invalidation fails
    }
  }

  /**
   * Middleware for taxonomy operations
   */
  static async taxonomyMiddleware(
    request: NextRequest,
    response: NextResponse,
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    try {
      await CacheHooks.afterTaxonomyChange();
    } catch (error) {
      logger.error(
        'Cache taxonomy middleware error:',
        error instanceof Error ? error : undefined
      );
      // Don't fail the request if cache invalidation fails
    }
  }

  /**
   * Add cache headers to response
   */
  static addCacheHeaders(
    response: NextResponse,
    cacheType: 'public' | 'private' | 'no-cache',
    maxAge: number = 300,
    staleWhileRevalidate: number = 600,
    cacheHit: boolean = false
  ): NextResponse {
    if (cacheType === 'no-cache') {
      response.headers.set(
        'Cache-Control',
        'no-cache, no-store, must-revalidate'
      );
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    } else {
      response.headers.set(
        'Cache-Control',
        `${cacheType}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      );
    }

    response.headers.set('X-Cache', cacheHit ? 'HIT' : 'MISS');
    response.headers.set('X-Cache-Date', new Date().toISOString());

    return response;
  }

  /**
   * Vary header for cache differentiation
   */
  static addVaryHeaders(
    response: NextResponse,
    varyOn: string[] = ['Accept-Encoding', 'User-Agent']
  ): NextResponse {
    response.headers.set('Vary', varyOn.join(', '));
    return response;
  }
}
