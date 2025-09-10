import { PrismaClient } from '@prisma/client';

// Note: In a real implementation, this would use the existing prisma client
// For now, we'll create the interface and implementation structure
// The actual database operations will be implemented once the schema is updated

// Types and Interfaces
export interface MediaRecord {
  id: string;
  publicId: string;
  url: string;
  filename: string;
  originalFilename?: string;
  size: number;
  width?: number;
  height?: number;
  format: string;
  folder: string;
  uploadedBy?: string;
  uploadedAt: Date;
  metadata?: MediaMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaMetadata {
  etag?: string;
  colors?: Array<{ hex: string; percentage: number }>;
  predominantColor?: { hex: string; percentage: number };
  imageMetadata?: Record<string, any>;
  tags?: string[];
  context?: Record<string, string>;
}

export interface MediaReference {
  id: string;
  mediaId: string;
  contentType: 'article' | 'newsletter' | 'podcast';
  contentId: string;
  referenceContext: 'content' | 'cover_image' | 'thumbnail';
  createdAt: Date;
}

export interface MediaUsage {
  publicId: string;
  references: ContentReference[];
  totalReferences: number;
  isOrphaned: boolean;
  lastUsed?: Date;
}

export interface ContentReference {
  contentType: 'article' | 'newsletter' | 'podcast';
  contentId: string;
  contentTitle?: string;
  referenceContext: 'content' | 'cover_image' | 'thumbnail';
  createdAt: Date;
}

export interface TrackingContext {
  contentType?: 'article' | 'newsletter' | 'podcast';
  contentId?: string;
  referenceContext?: 'content' | 'cover_image' | 'thumbnail';
  uploadedBy?: string;
}

export interface OrphanDetectionResult {
  orphanedMedia: MediaRecord[];
  totalOrphans: number;
  totalSize: number;
  oldestOrphan?: Date;
}

/**
 * Media Tracker Service for managing uploaded files and their usage
 */
export class MediaTracker {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    // In real implementation, this would use the existing prisma client
    this.prisma = prismaClient || new PrismaClient();
  }

  /**
   * Track a newly uploaded media file
   * @param uploadResult - Result from upload service
   * @param context - Additional tracking context
   * @returns Promise with created media record
   */
  async trackUpload(
    uploadResult: {
      url: string;
      publicId: string;
      width: number;
      height: number;
      format: string;
      size: number;
      filename: string;
    },
    context: TrackingContext = {}
  ): Promise<MediaRecord> {
    try {
      // Extract folder from publicId
      const folder = uploadResult.publicId.split('/')[0] || 'superbear_blog';
      
      // Create media record
      const mediaRecord: MediaRecord = {
        id: this.generateId(),
        publicId: uploadResult.publicId,
        url: uploadResult.url,
        filename: uploadResult.filename,
        originalFilename: uploadResult.filename,
        size: uploadResult.size,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        folder,
        uploadedBy: context.uploadedBy,
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // TODO: Replace with actual Prisma operation once schema is updated
      // const createdRecord = await this.prisma.mediaFile.create({
      //   data: {
      //     publicId: mediaRecord.publicId,
      //     url: mediaRecord.url,
      //     filename: mediaRecord.filename,
      //     originalFilename: mediaRecord.originalFilename,
      //     size: mediaRecord.size,
      //     width: mediaRecord.width,
      //     height: mediaRecord.height,
      //     format: mediaRecord.format,
      //     folder: mediaRecord.folder,
      //     uploadedBy: mediaRecord.uploadedBy,
      //     uploadedAt: mediaRecord.uploadedAt,
      //   }
      // });

      // If there's a content reference, create it
      if (context.contentType && context.contentId) {
        await this.createReference(mediaRecord.id, {
          contentType: context.contentType,
          contentId: context.contentId,
          referenceContext: context.referenceContext || 'content',
        });
      }

      return mediaRecord;
    } catch (error) {
      console.error('Failed to track upload:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to track upload'
      );
    }
  }

  /**
   * Extract image references from content (HTML, Markdown, etc.)
   * @param content - Content string to parse
   * @returns Array of publicIds found in content
   */
  extractImageReferences(content: string): string[] {
    const publicIds: string[] = [];
    
    try {
      // Extract from Cloudinary URLs
      const cloudinaryRegex = /https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/(?:v\d+\/)?([^\/\s"']+(?:\/[^\/\s"']+)*)/g;
      let match;
      
      while ((match = cloudinaryRegex.exec(content)) !== null) {
        const publicId = match[1];
        if (publicId && !publicIds.includes(publicId)) {
          publicIds.push(publicId);
        }
      }

      // Extract from img tags with data-public-id attributes
      const imgTagRegex = /<img[^>]+data-public-id=["']([^"']+)["'][^>]*>/g;
      while ((match = imgTagRegex.exec(content)) !== null) {
        const publicId = match[1];
        if (publicId && !publicIds.includes(publicId)) {
          publicIds.push(publicId);
        }
      }

      // Extract from TipTap image nodes (JSON format)
      const tiptapImageRegex = /"type":\s*"image"[^}]*"attrs":\s*{[^}]*"publicId":\s*"([^"]+)"/g;
      while ((match = tiptapImageRegex.exec(content)) !== null) {
        const publicId = match[1];
        if (publicId && !publicIds.includes(publicId)) {
          publicIds.push(publicId);
        }
      }

      // Extract from markdown image syntax with Cloudinary URLs
      const markdownRegex = /!\[[^\]]*\]\(https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\/(?:v\d+\/)?([^\/\s)]+(?:\/[^\/\s)]+)*)\)/g;
      while ((match = markdownRegex.exec(content)) !== null) {
        const publicId = match[1];
        if (publicId && !publicIds.includes(publicId)) {
          publicIds.push(publicId);
        }
      }

      return publicIds;
    } catch (error) {
      console.error('Failed to extract image references:', error);
      return [];
    }
  }

  /**
   * Update content references for a specific content item
   * @param contentType - Type of content (article, newsletter, podcast)
   * @param contentId - ID of the content
   * @param content - Content string to parse for references
   * @param referenceContext - Context of the references
   * @returns Promise with update result
   */
  async updateContentReferences(
    contentType: 'article' | 'newsletter' | 'podcast',
    contentId: string,
    content: string,
    referenceContext: 'content' | 'cover_image' | 'thumbnail' = 'content'
  ): Promise<{ added: number; removed: number; total: number }> {
    try {
      // Extract current references from content
      const currentPublicIds = this.extractImageReferences(content);
      
      // Get existing references from database
      // TODO: Replace with actual Prisma query once schema is updated
      // const existingReferences = await this.prisma.mediaReference.findMany({
      //   where: {
      //     contentType,
      //     contentId,
      //     referenceContext,
      //   },
      //   include: {
      //     media: true,
      //   },
      // });

      const existingReferences: any[] = []; // Placeholder
      const existingPublicIds = existingReferences.map(ref => ref.media.publicId);

      // Find references to add and remove
      const toAdd = currentPublicIds.filter(id => !existingPublicIds.includes(id));
      const toRemove = existingPublicIds.filter(id => !currentPublicIds.includes(id));

      // Remove old references
      if (toRemove.length > 0) {
        // TODO: Replace with actual Prisma operation
        // await this.prisma.mediaReference.deleteMany({
        //   where: {
        //     contentType,
        //     contentId,
        //     referenceContext,
        //     media: {
        //       publicId: {
        //         in: toRemove,
        //       },
        //     },
        //   },
        // });
      }

      // Add new references
      let addedCount = 0;
      for (const publicId of toAdd) {
        // Find media record by publicId
        // TODO: Replace with actual Prisma query
        // const mediaRecord = await this.prisma.mediaFile.findUnique({
        //   where: { publicId },
        // });

        // TODO: Implement media record lookup
        // const mediaRecord = await this.prisma.media.findUnique({
        //   where: { publicId },
        // });
        
        // if (mediaRecord) {
        //   await this.createReference(mediaRecord.id, {
        //     contentType,
        //     contentId,
        //     referenceContext,
        //   });
        //   addedCount++;
        // }
      }

      return {
        added: addedCount,
        removed: toRemove.length,
        total: currentPublicIds.length,
      };
    } catch (error) {
      console.error('Failed to update content references:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update content references'
      );
    }
  }

  /**
   * Get usage information for a specific media file
   * @param publicId - Public ID of the media file
   * @returns Promise with usage information
   */
  async getMediaUsage(publicId: string): Promise<MediaUsage> {
    try {
      // TODO: Replace with actual Prisma query once schema is updated
      // const references = await this.prisma.mediaReference.findMany({
      //   where: {
      //     media: {
      //       publicId,
      //     },
      //   },
      //   include: {
      //     media: true,
      //   },
      // });

      const references: any[] = []; // Placeholder

      const contentReferences: ContentReference[] = references.map(ref => ({
        contentType: ref.contentType,
        contentId: ref.contentId,
        referenceContext: ref.referenceContext,
        createdAt: ref.createdAt,
        // TODO: Add content title lookup
        contentTitle: `${ref.contentType} ${ref.contentId}`,
      }));

      const lastUsed = references.length > 0 
        ? new Date(Math.max(...references.map(ref => ref.createdAt.getTime())))
        : undefined;

      return {
        publicId,
        references: contentReferences,
        totalReferences: references.length,
        isOrphaned: references.length === 0,
        lastUsed,
      };
    } catch (error) {
      console.error('Failed to get media usage:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get media usage'
      );
    }
  }

  /**
   * Find orphaned media files (not referenced by any content)
   * @param olderThan - Optional date to find orphans older than this date
   * @returns Promise with orphan detection result
   */
  async findOrphanedMedia(olderThan?: Date): Promise<OrphanDetectionResult> {
    try {
      // TODO: Replace with actual Prisma query once schema is updated
      // const orphanedMedia = await this.prisma.mediaFile.findMany({
      //   where: {
      //     references: {
      //       none: {},
      //     },
      //     ...(olderThan && {
      //       uploadedAt: {
      //         lt: olderThan,
      //       },
      //     }),
      //   },
      //   orderBy: {
      //     uploadedAt: 'asc',
      //   },
      // });

      const orphanedMedia: MediaRecord[] = []; // Placeholder

      const totalSize = orphanedMedia.reduce((sum, media) => sum + media.size, 0);
      const oldestOrphan = orphanedMedia.length > 0 ? orphanedMedia[0].uploadedAt : undefined;

      return {
        orphanedMedia,
        totalOrphans: orphanedMedia.length,
        totalSize,
        oldestOrphan,
      };
    } catch (error) {
      console.error('Failed to find orphaned media:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to find orphaned media'
      );
    }
  }

  /**
   * Get all media files with optional filtering
   * @param options - Filtering and pagination options
   * @returns Promise with media files and pagination info
   */
  async getMediaFiles(options: {
    folder?: string;
    format?: string;
    uploadedBy?: string;
    orphansOnly?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'uploadedAt' | 'size' | 'filename';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    media: MediaRecord[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const {
        folder,
        format,
        uploadedBy,
        orphansOnly = false,
        limit = 50,
        offset = 0,
        sortBy = 'uploadedAt',
        sortOrder = 'desc',
      } = options;

      // TODO: Replace with actual Prisma query once schema is updated
      // const whereClause: any = {};
      
      // if (folder) whereClause.folder = folder;
      // if (format) whereClause.format = format;
      // if (uploadedBy) whereClause.uploadedBy = uploadedBy;
      // if (orphansOnly) {
      //   whereClause.references = { none: {} };
      // }

      // const [media, total] = await Promise.all([
      //   this.prisma.mediaFile.findMany({
      //     where: whereClause,
      //     include: {
      //       references: true,
      //     },
      //     orderBy: {
      //       [sortBy]: sortOrder,
      //     },
      //     take: limit,
      //     skip: offset,
      //   }),
      //   this.prisma.mediaFile.count({
      //     where: whereClause,
      //   }),
      // ]);

      const media: MediaRecord[] = []; // Placeholder
      const total = 0; // Placeholder

      return {
        media,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('Failed to get media files:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get media files'
      );
    }
  }

  /**
   * Delete media record and its references
   * @param publicId - Public ID of the media to delete
   * @returns Promise with deletion result
   */
  async deleteMediaRecord(publicId: string): Promise<{ success: boolean; referencesRemoved: number }> {
    try {
      // TODO: Replace with actual Prisma transaction once schema is updated
      // const result = await this.prisma.$transaction(async (tx) => {
      //   // Count references before deletion
      //   const referenceCount = await tx.mediaReference.count({
      //     where: {
      //       media: {
      //         publicId,
      //       },
      //     },
      //   });

      //   // Delete all references
      //   await tx.mediaReference.deleteMany({
      //     where: {
      //       media: {
      //         publicId,
      //       },
      //     },
      //   });

      //   // Delete media record
      //   await tx.mediaFile.delete({
      //     where: {
      //       publicId,
      //     },
      //   });

      //   return { success: true, referencesRemoved: referenceCount };
      // });

      // return result;

      return { success: true, referencesRemoved: 0 }; // Placeholder
    } catch (error) {
      console.error('Failed to delete media record:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete media record'
      );
    }
  }

  // Private helper methods

  private async createReference(
    mediaId: string,
    reference: {
      contentType: 'article' | 'newsletter' | 'podcast';
      contentId: string;
      referenceContext: 'content' | 'cover_image' | 'thumbnail';
    }
  ): Promise<void> {
    try {
      // TODO: Replace with actual Prisma operation once schema is updated
      // await this.prisma.mediaReference.create({
      //   data: {
      //     mediaId,
      //     contentType: reference.contentType,
      //     contentId: reference.contentId,
      //     referenceContext: reference.referenceContext,
      //   },
      // });
    } catch (error) {
      // Handle duplicate reference creation gracefully
      if (error instanceof Error && error.message.includes('unique constraint')) {
        // Reference already exists, which is fine
        return;
      }
      throw error;
    }
  }

  private generateId(): string {
    return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verify orphan status by double-checking references
   * @param publicIds - Array of public IDs to verify
   * @returns Promise with verification results
   */
  async verifyOrphanStatus(publicIds: string[]): Promise<Array<{
    publicId: string;
    isOrphan: boolean;
    referenceCount: number;
  }>> {
    try {
      const results = [];
      
      for (const publicId of publicIds) {
        const usage = await this.getMediaUsage(publicId);
        results.push({
          publicId,
          isOrphan: usage.isOrphaned,
          referenceCount: usage.totalReferences,
        });
      }

      return results;
    } catch (error) {
      console.error('Failed to verify orphan status:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to verify orphan status'
      );
    }
  }

  /**
   * Get media statistics
   * @returns Promise with media statistics
   */
  async getMediaStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    orphanedFiles: number;
    orphanedSize: number;
    byFormat: Record<string, { count: number; size: number }>;
    byFolder: Record<string, { count: number; size: number }>;
  }> {
    try {
      // TODO: Replace with actual Prisma aggregation queries once schema is updated
      // const [totalStats, orphanStats, formatStats, folderStats] = await Promise.all([
      //   this.prisma.mediaFile.aggregate({
      //     _count: { id: true },
      //     _sum: { size: true },
      //   }),
      //   this.prisma.mediaFile.aggregate({
      //     where: {
      //       references: { none: {} },
      //     },
      //     _count: { id: true },
      //     _sum: { size: true },
      //   }),
      //   this.prisma.mediaFile.groupBy({
      //     by: ['format'],
      //     _count: { id: true },
      //     _sum: { size: true },
      //   }),
      //   this.prisma.mediaFile.groupBy({
      //     by: ['folder'],
      //     _count: { id: true },
      //     _sum: { size: true },
      //   }),
      // ]);

      // Placeholder implementation
      return {
        totalFiles: 0,
        totalSize: 0,
        orphanedFiles: 0,
        orphanedSize: 0,
        byFormat: {},
        byFolder: {},
      };
    } catch (error) {
      console.error('Failed to get media statistics:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get media statistics'
      );
    }
  }
}

// Export singleton instance
export const mediaTracker = new MediaTracker();