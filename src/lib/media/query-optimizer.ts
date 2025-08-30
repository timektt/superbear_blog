import { prisma } from '../prisma';
import { logger } from '../logger';
import { mediaCache } from './media-cache';
import type { MediaRecord, MediaUsage } from './media-tracker';

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'uploadedAt' | 'size' | 'filename' | 'format';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    format?: string[];
    folder?: string[];
    sizeMin?: number;
    sizeMax?: number;
    uploadedAfter?: Date;
    uploadedBefore?: Date;
    uploadedBy?: string;
    hasReferences?: boolean;
  };
}

export interface OptimizedQueryResult<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  fromCache: boolean;
}

/**
 * Optimized database queries for media operations with caching
 */
export class MediaQueryOptimizer {
  /**
   * Get paginated media list with optimized queries and caching
   */
  async getMediaList(options: QueryOptions = {}): Promise<OptimizedQueryResult<MediaRecord>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'uploadedAt',
      sortOrder = 'desc',
      filters = {},
    } = options;

    // Try to get from cache first
    const cached = await mediaCache.getGalleryPage(page, pageSize, { sortBy, sortOrder, ...filters });
    if (cached) {
      return {
        items: cached.items,
        totalCount: cached.totalCount,
        hasMore: cached.hasMore,
        fromCache: true,
      };
    }

    try {
      // Build optimized query
      const where = this.buildWhereClause(filters);
      const orderBy = { [sortBy]: sortOrder };
      const skip = (page - 1) * pageSize;

      // Execute optimized queries in parallel
      const [items, totalCount] = await Promise.all([
        prisma.mediaFile.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
          include: {
            references: {
              select: {
                id: true,
                contentType: true,
                contentId: true,
                referenceContext: true,
              },
            },
          },
        }),
        prisma.mediaFile.count({ where }),
      ]);

      const mediaRecords: MediaRecord[] = items.map(this.transformToMediaRecord);
      const hasMore = skip + items.length < totalCount;

      // Cache the results
      const cacheData = {
        items: mediaRecords,
        totalCount,
        hasMore,
        page,
        pageSize,
      };
      
      await mediaCache.cacheGalleryPage(page, pageSize, { sortBy, sortOrder, ...filters }, cacheData);

      return {
        items: mediaRecords,
        totalCount,
        hasMore,
        fromCache: false,
      };
    } catch (error) {
      logger.error('Failed to get media list:', error);
      throw error;
    }
  }

  /**
   * Search media with full-text search and faceted results
   */
  async searchMedia(
    query: string,
    options: QueryOptions = {}
  ): Promise<OptimizedQueryResult<MediaRecord> & { facets: Record<string, Record<string, number>> }> {
    const { page = 1, pageSize = 20, filters = {} } = options;

    // Try cache first
    const cached = await mediaCache.getSearchResults(query, { page, pageSize, ...filters });
    if (cached) {
      return {
        items: cached.items,
        totalCount: cached.totalCount,
        hasMore: cached.totalCount > page * pageSize,
        fromCache: true,
        facets: cached.facets,
      };
    }

    try {
      const where = {
        ...this.buildWhereClause(filters),
        OR: query
          ? [
              { filename: { contains: query, mode: 'insensitive' as const } },
              { originalFilename: { contains: query, mode: 'insensitive' as const } },
            ]
          : undefined,
      };

      const skip = (page - 1) * pageSize;

      // Execute search and facet queries in parallel
      const [items, totalCount, facets] = await Promise.all([
        prisma.mediaFile.findMany({
          where,
          orderBy: { uploadedAt: 'desc' },
          skip,
          take: pageSize,
          include: {
            references: {
              select: {
                id: true,
                contentType: true,
                contentId: true,
                referenceContext: true,
              },
            },
          },
        }),
        prisma.mediaFile.count({ where }),
        this.getFacets(where),
      ]);

      const mediaRecords: MediaRecord[] = items.map(this.transformToMediaRecord);
      const hasMore = skip + items.length < totalCount;

      // Cache results
      const searchResult = {
        items: mediaRecords,
        totalCount,
        facets,
      };
      
      await mediaCache.cacheSearchResults(query, { page, pageSize, ...filters }, searchResult);

      return {
        items: mediaRecords,
        totalCount,
        hasMore,
        fromCache: false,
        facets,
      };
    } catch (error) {
      logger.error('Failed to search media:', error);
      throw error;
    }
  }

  /**
   * Get media usage with caching
   */
  async getMediaUsage(publicId: string): Promise<MediaUsage | null> {
    // Try cache first
    const cached = await mediaCache.getMediaUsage(publicId);
    if (cached) {
      return cached;
    }

    try {
      const mediaFile = await prisma.mediaFile.findUnique({
        where: { publicId },
        include: {
          references: {
            include: {
              // We would need to join with actual content tables here
              // For now, just get the reference data
            },
          },
        },
      });

      if (!mediaFile) {
        return null;
      }

      const usage: MediaUsage = {
        publicId,
        references: mediaFile.references.map(ref => ({
          contentType: ref.contentType,
          contentId: ref.contentId,
          referenceContext: ref.referenceContext,
          createdAt: ref.createdAt,
        })),
        totalReferences: mediaFile.references.length,
        isOrphaned: mediaFile.references.length === 0,
      };

      // Cache the usage data
      await mediaCache.cacheMediaUsage(publicId, usage);

      return usage;
    } catch (error) {
      logger.error('Failed to get media usage:', error);
      throw error;
    }
  }

  /**
   * Get orphaned media with caching
   */
  async getOrphanedMedia(): Promise<MediaRecord[]> {
    // Try cache first
    const cached = await mediaCache.getOrphanList();
    if (cached) {
      return cached;
    }

    try {
      const orphanedMedia = await prisma.mediaFile.findMany({
        where: {
          references: {
            none: {},
          },
        },
        orderBy: { uploadedAt: 'desc' },
        include: {
          references: true,
        },
      });

      const mediaRecords: MediaRecord[] = orphanedMedia.map(this.transformToMediaRecord);

      // Cache the orphan list
      await mediaCache.cacheOrphanList(mediaRecords);

      return mediaRecords;
    } catch (error) {
      logger.error('Failed to get orphaned media:', error);
      throw error;
    }
  }

  /**
   * Get media statistics with caching
   */
  async getMediaStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    orphanCount: number;
    recentUploads: number;
    formatBreakdown: Record<string, number>;
    folderBreakdown: Record<string, number>;
  }> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [
        totalFiles,
        totalSizeResult,
        orphanCount,
        recentUploads,
        formatBreakdown,
        folderBreakdown,
      ] = await Promise.all([
        prisma.mediaFile.count(),
        prisma.mediaFile.aggregate({
          _sum: { size: true },
        }),
        prisma.mediaFile.count({
          where: {
            references: { none: {} },
          },
        }),
        prisma.mediaFile.count({
          where: {
            uploadedAt: { gte: oneDayAgo },
          },
        }),
        this.getFormatBreakdown(),
        this.getFolderBreakdown(),
      ]);

      return {
        totalFiles,
        totalSize: totalSizeResult._sum.size || 0,
        orphanCount,
        recentUploads,
        formatBreakdown,
        folderBreakdown,
      };
    } catch (error) {
      logger.error('Failed to get media stats:', error);
      throw error;
    }
  }

  /**
   * Batch get media metadata with caching
   */
  async batchGetMedia(publicIds: string[]): Promise<Record<string, MediaRecord | null>> {
    // Try to get from cache first
    const cached = await mediaCache.batchGetMetadata(publicIds);
    const uncachedIds = publicIds.filter(id => !cached[id]);

    if (uncachedIds.length === 0) {
      return cached;
    }

    try {
      // Fetch uncached items
      const uncachedItems = await prisma.mediaFile.findMany({
        where: {
          publicId: { in: uncachedIds },
        },
        include: {
          references: {
            select: {
              id: true,
              contentType: true,
              contentId: true,
              referenceContext: true,
            },
          },
        },
      });

      const uncachedRecords: MediaRecord[] = uncachedItems.map(this.transformToMediaRecord);

      // Cache the newly fetched items
      await mediaCache.batchCacheMetadata(uncachedRecords);

      // Combine cached and uncached results
      const result = { ...cached };
      uncachedRecords.forEach(record => {
        result[record.publicId] = record;
      });

      // Mark missing items as null
      uncachedIds.forEach(id => {
        if (!result[id]) {
          result[id] = null;
        }
      });

      return result;
    } catch (error) {
      logger.error('Failed to batch get media:', error);
      throw error;
    }
  }

  /**
   * Build optimized WHERE clause for media queries
   */
  private buildWhereClause(filters: QueryOptions['filters'] = {}) {
    const where: any = {};

    if (filters.format && filters.format.length > 0) {
      where.format = { in: filters.format };
    }

    if (filters.folder && filters.folder.length > 0) {
      where.folder = { in: filters.folder };
    }

    if (filters.sizeMin !== undefined || filters.sizeMax !== undefined) {
      where.size = {};
      if (filters.sizeMin !== undefined) {
        where.size.gte = filters.sizeMin;
      }
      if (filters.sizeMax !== undefined) {
        where.size.lte = filters.sizeMax;
      }
    }

    if (filters.uploadedAfter || filters.uploadedBefore) {
      where.uploadedAt = {};
      if (filters.uploadedAfter) {
        where.uploadedAt.gte = filters.uploadedAfter;
      }
      if (filters.uploadedBefore) {
        where.uploadedAt.lte = filters.uploadedBefore;
      }
    }

    if (filters.uploadedBy) {
      where.uploadedBy = filters.uploadedBy;
    }

    if (filters.hasReferences !== undefined) {
      if (filters.hasReferences) {
        where.references = { some: {} };
      } else {
        where.references = { none: {} };
      }
    }

    return where;
  }

  /**
   * Get faceted search results
   */
  private async getFacets(where: any): Promise<Record<string, Record<string, number>>> {
    const [formats, folders, sizes] = await Promise.all([
      prisma.mediaFile.groupBy({
        by: ['format'],
        where,
        _count: { format: true },
      }),
      prisma.mediaFile.groupBy({
        by: ['folder'],
        where,
        _count: { folder: true },
      }),
      prisma.mediaFile.groupBy({
        by: ['size'],
        where,
        _count: { size: true },
      }),
    ]);

    return {
      formats: formats.reduce((acc, item) => {
        acc[item.format] = item._count.format;
        return acc;
      }, {} as Record<string, number>),
      folders: folders.reduce((acc, item) => {
        acc[item.folder] = item._count.folder;
        return acc;
      }, {} as Record<string, number>),
      sizes: this.groupSizeRanges(sizes),
    };
  }

  /**
   * Get format breakdown
   */
  private async getFormatBreakdown(): Promise<Record<string, number>> {
    const formats = await prisma.mediaFile.groupBy({
      by: ['format'],
      _count: { format: true },
    });

    return formats.reduce((acc, item) => {
      acc[item.format] = item._count.format;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get folder breakdown
   */
  private async getFolderBreakdown(): Promise<Record<string, number>> {
    const folders = await prisma.mediaFile.groupBy({
      by: ['folder'],
      _count: { folder: true },
    });

    return folders.reduce((acc, item) => {
      acc[item.folder] = item._count.folder;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Group sizes into ranges for faceted search
   */
  private groupSizeRanges(sizes: Array<{ size: number; _count: { size: number } }>): Record<string, number> {
    const ranges = {
      'Under 100KB': 0,
      '100KB - 500KB': 0,
      '500KB - 1MB': 0,
      '1MB - 5MB': 0,
      'Over 5MB': 0,
    };

    sizes.forEach(({ size, _count }) => {
      const sizeInKB = size / 1024;
      const sizeInMB = sizeInKB / 1024;

      if (sizeInKB < 100) {
        ranges['Under 100KB'] += _count.size;
      } else if (sizeInKB < 500) {
        ranges['100KB - 500KB'] += _count.size;
      } else if (sizeInMB < 1) {
        ranges['500KB - 1MB'] += _count.size;
      } else if (sizeInMB < 5) {
        ranges['1MB - 5MB'] += _count.size;
      } else {
        ranges['Over 5MB'] += _count.size;
      }
    });

    return ranges;
  }

  /**
   * Transform Prisma result to MediaRecord
   */
  private transformToMediaRecord(item: any): MediaRecord {
    return {
      id: item.id,
      publicId: item.publicId,
      url: item.url,
      filename: item.filename,
      originalFilename: item.originalFilename,
      size: item.size,
      width: item.width,
      height: item.height,
      format: item.format,
      folder: item.folder,
      uploadedBy: item.uploadedBy,
      uploadedAt: item.uploadedAt,
      metadata: item.metadata || {},
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      references: item.references || [],
    };
  }
}

// Global query optimizer instance
export const mediaQueryOptimizer = new MediaQueryOptimizer();