import { cache, CACHE_CONFIG } from '../redis';
import { logger } from '../logger';
import type { MediaRecord, MediaUsage } from './media-tracker';

// Media-specific cache configuration
export const MEDIA_CACHE_CONFIG = {
  // Media metadata caching
  MEDIA_METADATA_TTL: 60 * 30, // 30 minutes
  MEDIA_LIST_TTL: 60 * 10, // 10 minutes
  MEDIA_SEARCH_TTL: 60 * 15, // 15 minutes
  
  // Gallery pagination caching
  GALLERY_PAGE_TTL: 60 * 5, // 5 minutes
  GALLERY_FILTERS_TTL: 60 * 10, // 10 minutes
  
  // Usage tracking caching
  USAGE_DATA_TTL: 60 * 20, // 20 minutes
  ORPHAN_LIST_TTL: 60 * 60, // 1 hour
  
  // Upload progress caching
  UPLOAD_PROGRESS_TTL: 60 * 5, // 5 minutes
  
  // Cleanup operation caching
  CLEANUP_STATUS_TTL: 60 * 30, // 30 minutes
} as const;

// Media cache key prefixes
export const MEDIA_CACHE_KEYS = {
  MEDIA_METADATA: 'media:metadata:',
  MEDIA_LIST: 'media:list:',
  MEDIA_SEARCH: 'media:search:',
  GALLERY_PAGE: 'media:gallery:page:',
  GALLERY_FILTERS: 'media:gallery:filters:',
  USAGE_DATA: 'media:usage:',
  ORPHAN_LIST: 'media:orphans:',
  UPLOAD_PROGRESS: 'media:upload:progress:',
  CLEANUP_STATUS: 'media:cleanup:status:',
  MEDIA_STATS: 'media:stats:',
} as const;

export interface MediaCacheStats {
  totalFiles: number;
  totalSize: number;
  orphanCount: number;
  recentUploads: number;
  lastUpdated: Date;
}

export interface GalleryPageData {
  items: MediaRecord[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

export interface MediaSearchResult {
  items: MediaRecord[];
  totalCount: number;
  facets: {
    formats: Record<string, number>;
    folders: Record<string, number>;
    sizes: Record<string, number>;
  };
}

export interface UploadProgressData {
  uploadId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
  result?: {
    publicId: string;
    url: string;
    size: number;
  };
}

/**
 * Media-specific cache manager with optimized operations
 */
export class MediaCacheManager {
  /**
   * Cache media metadata
   */
  async cacheMediaMetadata(publicId: string, metadata: MediaRecord): Promise<void> {
    const key = `${MEDIA_CACHE_KEYS.MEDIA_METADATA}${publicId}`;
    await cache.set(key, metadata, MEDIA_CACHE_CONFIG.MEDIA_METADATA_TTL);
  }

  /**
   * Get cached media metadata
   */
  async getMediaMetadata(publicId: string): Promise<MediaRecord | null> {
    const key = `${MEDIA_CACHE_KEYS.MEDIA_METADATA}${publicId}`;
    return await cache.get<MediaRecord>(key);
  }

  /**
   * Cache gallery page data
   */
  async cacheGalleryPage(
    page: number,
    pageSize: number,
    filters: Record<string, any>,
    data: GalleryPageData
  ): Promise<void> {
    const filterHash = this.hashFilters(filters);
    const key = `${MEDIA_CACHE_KEYS.GALLERY_PAGE}${page}:${pageSize}:${filterHash}`;
    await cache.set(key, data, MEDIA_CACHE_CONFIG.GALLERY_PAGE_TTL);
  }

  /**
   * Get cached gallery page data
   */
  async getGalleryPage(
    page: number,
    pageSize: number,
    filters: Record<string, any>
  ): Promise<GalleryPageData | null> {
    const filterHash = this.hashFilters(filters);
    const key = `${MEDIA_CACHE_KEYS.GALLERY_PAGE}${page}:${pageSize}:${filterHash}`;
    return await cache.get<GalleryPageData>(key);
  }

  /**
   * Cache media search results
   */
  async cacheSearchResults(
    query: string,
    filters: Record<string, any>,
    results: MediaSearchResult
  ): Promise<void> {
    const filterHash = this.hashFilters(filters);
    const queryHash = this.hashQuery(query);
    const key = `${MEDIA_CACHE_KEYS.MEDIA_SEARCH}${queryHash}:${filterHash}`;
    await cache.set(key, results, MEDIA_CACHE_CONFIG.MEDIA_SEARCH_TTL);
  }

  /**
   * Get cached search results
   */
  async getSearchResults(
    query: string,
    filters: Record<string, any>
  ): Promise<MediaSearchResult | null> {
    const filterHash = this.hashFilters(filters);
    const queryHash = this.hashQuery(query);
    const key = `${MEDIA_CACHE_KEYS.MEDIA_SEARCH}${queryHash}:${filterHash}`;
    return await cache.get<MediaSearchResult>(key);
  }

  /**
   * Cache media usage data
   */
  async cacheMediaUsage(publicId: string, usage: MediaUsage): Promise<void> {
    const key = `${MEDIA_CACHE_KEYS.USAGE_DATA}${publicId}`;
    await cache.set(key, usage, MEDIA_CACHE_CONFIG.USAGE_DATA_TTL);
  }

  /**
   * Get cached media usage data
   */
  async getMediaUsage(publicId: string): Promise<MediaUsage | null> {
    const key = `${MEDIA_CACHE_KEYS.USAGE_DATA}${publicId}`;
    return await cache.get<MediaUsage>(key);
  }

  /**
   * Cache orphaned media list
   */
  async cacheOrphanList(orphans: MediaRecord[]): Promise<void> {
    const key = MEDIA_CACHE_KEYS.ORPHAN_LIST;
    await cache.set(key, orphans, MEDIA_CACHE_CONFIG.ORPHAN_LIST_TTL);
  }

  /**
   * Get cached orphan list
   */
  async getOrphanList(): Promise<MediaRecord[] | null> {
    const key = MEDIA_CACHE_KEYS.ORPHAN_LIST;
    return await cache.get<MediaRecord[]>(key);
  }

  /**
   * Cache upload progress
   */
  async cacheUploadProgress(uploadId: string, progress: UploadProgressData): Promise<void> {
    const key = `${MEDIA_CACHE_KEYS.UPLOAD_PROGRESS}${uploadId}`;
    await cache.set(key, progress, MEDIA_CACHE_CONFIG.UPLOAD_PROGRESS_TTL);
  }

  /**
   * Get cached upload progress
   */
  async getUploadProgress(uploadId: string): Promise<UploadProgressData | null> {
    const key = `${MEDIA_CACHE_KEYS.UPLOAD_PROGRESS}${uploadId}`;
    return await cache.get<UploadProgressData>(key);
  }

  /**
   * Cache media statistics
   */
  async cacheMediaStats(stats: MediaCacheStats): Promise<void> {
    const key = MEDIA_CACHE_KEYS.MEDIA_STATS;
    await cache.set(key, stats, MEDIA_CACHE_CONFIG.MEDIA_METADATA_TTL);
  }

  /**
   * Get cached media statistics
   */
  async getMediaStats(): Promise<MediaCacheStats | null> {
    const key = MEDIA_CACHE_KEYS.MEDIA_STATS;
    return await cache.get<MediaCacheStats>(key);
  }

  /**
   * Invalidate media-related caches
   */
  async invalidateMediaCaches(publicId?: string): Promise<void> {
    try {
      if (publicId) {
        // Invalidate specific media caches
        await cache.del(`${MEDIA_CACHE_KEYS.MEDIA_METADATA}${publicId}`);
        await cache.del(`${MEDIA_CACHE_KEYS.USAGE_DATA}${publicId}`);
      }

      // Invalidate list and search caches
      await cache.delPattern(`${MEDIA_CACHE_KEYS.MEDIA_LIST}*`);
      await cache.delPattern(`${MEDIA_CACHE_KEYS.MEDIA_SEARCH}*`);
      await cache.delPattern(`${MEDIA_CACHE_KEYS.GALLERY_PAGE}*`);
      await cache.delPattern(`${MEDIA_CACHE_KEYS.GALLERY_FILTERS}*`);
      
      // Invalidate orphan list and stats
      await cache.del(MEDIA_CACHE_KEYS.ORPHAN_LIST);
      await cache.del(MEDIA_CACHE_KEYS.MEDIA_STATS);

      logger.info('Media caches invalidated', { publicId });
    } catch (error) {
      logger.error('Failed to invalidate media caches:', error);
    }
  }

  /**
   * Invalidate upload progress cache
   */
  async invalidateUploadProgress(uploadId: string): Promise<void> {
    const key = `${MEDIA_CACHE_KEYS.UPLOAD_PROGRESS}${uploadId}`;
    await cache.del(key);
  }

  /**
   * Batch cache media metadata
   */
  async batchCacheMetadata(mediaItems: MediaRecord[]): Promise<void> {
    const promises = mediaItems.map(item =>
      this.cacheMediaMetadata(item.publicId, item)
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Batch get media metadata
   */
  async batchGetMetadata(publicIds: string[]): Promise<Record<string, MediaRecord | null>> {
    const promises = publicIds.map(async (publicId) => ({
      publicId,
      metadata: await this.getMediaMetadata(publicId),
    }));

    const results = await Promise.allSettled(promises);
    const metadata: Record<string, MediaRecord | null> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        metadata[result.value.publicId] = result.value.metadata;
      } else {
        metadata[publicIds[index]] = null;
      }
    });

    return metadata;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache(): Promise<void> {
    try {
      logger.info('Starting media cache warmup');

      // This would typically be called during application startup
      // or as part of a scheduled task to pre-populate cache
      // with frequently accessed media data

      logger.info('Media cache warmup completed');
    } catch (error) {
      logger.error('Media cache warmup failed:', error);
    }
  }

  /**
   * Get cache hit/miss statistics
   */
  async getCacheStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    // This would require implementing hit/miss tracking
    // For now, return placeholder data
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
    };
  }

  /**
   * Hash filters for consistent cache keys
   */
  private hashFilters(filters: Record<string, any>): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {} as Record<string, any>);

    return Buffer.from(JSON.stringify(sortedFilters)).toString('base64');
  }

  /**
   * Hash search query for consistent cache keys
   */
  private hashQuery(query: string): string {
    return Buffer.from(query.toLowerCase().trim()).toString('base64');
  }
}

// Global media cache manager instance
export const mediaCache = new MediaCacheManager();