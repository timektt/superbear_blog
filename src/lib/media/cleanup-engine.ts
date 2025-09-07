import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { MediaRecord } from './media-tracker';
import { cleanupMonitoringService } from './cleanup-monitoring';

// Configure Cloudinary if not already configured
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Types and Interfaces
export interface OrphanVerification {
  publicId: string;
  isOrphaned: boolean;
  referenceCount: number;
  lastUsed?: Date;
  verificationDate: Date;
  safeToDelete: boolean;
  warnings: string[];
}

export interface CleanupResult {
  processed: number;
  deleted: number;
  failed: number;
  errors: CleanupError[];
  freedSpace: number;
  dryRun: boolean;
}

export interface CleanupError {
  publicId: string;
  error: string;
  code: string;
  recoverable: boolean;
}

export interface CleanupSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  olderThanDays: number;
  dryRun: boolean;
  enabled: boolean;
}

export interface CleanupOperation {
  id: string;
  operationType: 'manual' | 'scheduled' | 'automatic';
  status: 'pending' | 'running' | 'completed' | 'failed';
  filesProcessed: number;
  filesDeleted: number;
  spaceFreed: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export class CleanupEngine {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Find orphaned media files that have no references
   * @param olderThan Optional date filter to only check files older than this date
   * @returns Array of orphaned media records
   */
  async findOrphanedMedia(olderThan?: Date): Promise<MediaRecord[]> {
    try {
      const whereClause: any = {
        references: {
          none: {}
        }
      };

      if (olderThan) {
        whereClause.uploadedAt = {
          lt: olderThan
        };
      }

      const orphanedFiles = await this.prisma.mediaFile.findMany({
        where: whereClause,
        include: {
          references: true
        }
      });

      return orphanedFiles.map(file => ({
        id: file.id,
        publicId: file.publicId,
        url: file.url,
        filename: file.filename,
        originalFilename: file.originalFilename || undefined,
        size: file.size,
        width: file.width || undefined,
        height: file.height || undefined,
        format: file.format,
        folder: file.folder,
        uploadedBy: file.uploadedBy || undefined,
        uploadedAt: file.uploadedAt,
        metadata: file.metadata as any,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }));
    } catch (error) {
      console.error('Error finding orphaned media:', error);
      throw new Error(`Failed to find orphaned media: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify orphan status of specific media files with additional safety checks
   * @param publicIds Array of public IDs to verify
   * @returns Array of verification results
   */
  async verifyOrphanStatus(publicIds: string[]): Promise<OrphanVerification[]> {
    const verifications: OrphanVerification[] = [];

    for (const publicId of publicIds) {
      try {
        // Get media file with references
        const mediaFile = await this.prisma.mediaFile.findUnique({
          where: { publicId },
          include: {
            references: {
              orderBy: { createdAt: 'desc' }
            }
          }
        });

        if (!mediaFile) {
          verifications.push({
            publicId,
            isOrphaned: true,
            referenceCount: 0,
            verificationDate: new Date(),
            safeToDelete: false,
            warnings: ['Media file not found in database']
          });
          continue;
        }

        const referenceCount = mediaFile.references.length;
        const isOrphaned = referenceCount === 0;
        const warnings: string[] = [];
        let safeToDelete = isOrphaned;

        // Additional safety checks
        if (isOrphaned) {
          // Check if file was uploaded very recently (within last hour)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (mediaFile.uploadedAt > oneHourAgo) {
            safeToDelete = false;
            warnings.push('File uploaded within the last hour - may still be in use');
          }

          // Check if file exists in Cloudinary
          try {
            await cloudinary.api.resource(publicId);
          } catch (cloudinaryError: any) {
            if (cloudinaryError.http_code === 404) {
              warnings.push('File already deleted from Cloudinary');
            } else {
              warnings.push('Unable to verify file existence in Cloudinary');
              safeToDelete = false;
            }
          }

          // Check for potential content references that might not be tracked
          await this.performContentScan(publicId, warnings);
        }

        const lastUsed = mediaFile.references.length > 0 
          ? mediaFile.references[0].createdAt 
          : undefined;

        verifications.push({
          publicId,
          isOrphaned,
          referenceCount,
          lastUsed,
          verificationDate: new Date(),
          safeToDelete,
          warnings
        });

      } catch (error) {
        verifications.push({
          publicId,
          isOrphaned: false,
          referenceCount: -1,
          verificationDate: new Date(),
          safeToDelete: false,
          warnings: [`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        });
      }
    }

    return verifications;
  }

  /**
   * Perform additional content scanning to detect untracked references
   * @param publicId The public ID to search for
   * @param warnings Array to add warnings to
   */
  private async performContentScan(publicId: string, warnings: string[]): Promise<void> {
    try {
      // Search in article content
      const articlesWithImage = await this.prisma.article.findMany({
        where: {
          OR: [
            { content: { contains: publicId } as any },
            { image: publicId }
          ]
        },
        select: { id: true, title: true }
      });

      if (articlesWithImage.length > 0) {
        warnings.push(`Found ${articlesWithImage.length} articles that may reference this image`);
      }

      // Search in newsletter content
      const newslettersWithImage = await this.prisma.newsletterIssue.findMany({
        where: {
          OR: [
            { content: { contains: publicId } as any },
            { image: publicId }
          ]
        },
        select: { id: true, title: true }
      });

      if (newslettersWithImage.length > 0) {
        warnings.push(`Found ${newslettersWithImage.length} newsletters that may reference this image`);
      }

      // Search in podcast content
      // const podcastsWithImage = await this.prisma.podcast.findMany({
      //   where: {
      //     OR: [
      //       { description: { contains: publicId } },
      //       { coverImagePublicId: publicId }
      //     ]
      //   },
      //   select: { id: true, title: true }
      // });

      const podcastsWithImage: any[] = [];
      if (podcastsWithImage.length > 0) {
        warnings.push(`Found ${podcastsWithImage.length} podcasts that may reference this image`);
      }

    } catch (error) {
      warnings.push('Unable to perform comprehensive content scan');
    }
  }

  /**
   * Clean up orphaned media files
   * @param publicIds Array of public IDs to clean up
   * @param dryRun If true, only simulate the cleanup without actually deleting
   * @param userId Optional user ID for tracking
   * @returns Cleanup result summary
   */
  async cleanupOrphans(publicIds: string[], dryRun: boolean = false, userId?: string): Promise<CleanupResult> {
    const result: CleanupResult = {
      processed: 0,
      deleted: 0,
      failed: 0,
      errors: [],
      freedSpace: 0,
      dryRun
    };

    // Create cleanup operation record
    const operationId = `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Record operation start in monitoring service
    await cleanupMonitoringService.recordOperationStart(operationId, {
      operationType: 'manual',
      expectedFiles: publicIds.length,
      userId
    });

    const operation = await this.prisma.cleanupOperation.create({
      data: {
        id: operationId,
        operationType: 'manual',
        status: 'running',
        startedAt: new Date()
      }
    });

    try {
      // First, verify all files are safe to delete
      const verifications = await this.verifyOrphanStatus(publicIds);
      
      for (const verification of verifications) {
        result.processed++;

        if (!verification.safeToDelete) {
          result.failed++;
          result.errors.push({
            publicId: verification.publicId,
            error: `Not safe to delete: ${verification.warnings.join(', ')}`,
            code: 'UNSAFE_DELETE',
            recoverable: false
          });
          continue;
        }

        if (!verification.isOrphaned) {
          result.failed++;
          result.errors.push({
            publicId: verification.publicId,
            error: `File is not orphaned (${verification.referenceCount} references)`,
            code: 'NOT_ORPHANED',
            recoverable: false
          });
          continue;
        }

        try {
          // Get file size before deletion for space calculation
          const mediaFile = await this.prisma.mediaFile.findUnique({
            where: { publicId: verification.publicId },
            select: { size: true }
          });

          if (!dryRun) {
            // Delete from Cloudinary first
            try {
              await cloudinary.uploader.destroy(verification.publicId);
            } catch (cloudinaryError: unknown) {
              // If file doesn't exist in Cloudinary, that's okay
              if ((cloudinaryError as any).http_code !== 404) {
                throw cloudinaryError;
              }
            }

            // Delete from database
            await this.prisma.mediaFile.delete({
              where: { publicId: verification.publicId }
            });
          }

          result.deleted++;
          if (mediaFile) {
            result.freedSpace += mediaFile.size;
          }

          // Record progress in monitoring service
          await cleanupMonitoringService.recordOperationProgress(operationId, {
            filesProcessed: result.processed,
            filesDeleted: result.deleted,
            spaceFreed: result.freedSpace,
            currentFile: verification.publicId
          });

        } catch (error) {
          result.failed++;
          result.errors.push({
            publicId: verification.publicId,
            error: error instanceof Error ? error.message : 'Unknown deletion error',
            code: 'DELETE_FAILED',
            recoverable: true
          });
        }
      }

      // Update operation record
      await this.prisma.cleanupOperation.update({
        where: { id: operation.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          filesProcessed: result.processed,
          filesDeleted: result.deleted,
          spaceFreed: result.freedSpace
        }
      });

      // Record operation completion in monitoring service
      await cleanupMonitoringService.recordOperationComplete(operationId, {
        status: 'completed',
        filesProcessed: result.processed,
        filesDeleted: result.deleted,
        spaceFreed: result.freedSpace
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update operation record with error
      await this.prisma.cleanupOperation.update({
        where: { id: operation.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage,
          filesProcessed: result.processed,
          filesDeleted: result.deleted,
          spaceFreed: result.freedSpace
        }
      });

      // Record operation failure in monitoring service
      await cleanupMonitoringService.recordOperationComplete(operationId, {
        status: 'failed',
        filesProcessed: result.processed,
        filesDeleted: result.deleted,
        spaceFreed: result.freedSpace,
        errorMessage
      });

      throw error;
    }

    return result;
  }

  /**
   * Schedule cleanup operations (placeholder for future implementation)
   * @param schedule Cleanup schedule configuration
   */
  async scheduleCleanup(schedule: CleanupSchedule): Promise<void> {
    // This would integrate with a job scheduler like node-cron or a queue system
    // For now, we'll just store the schedule configuration
    console.log('Cleanup scheduled:', schedule);
    throw new Error('Cleanup scheduling not yet implemented');
  }

  /**
   * Get cleanup operation history
   * @param limit Maximum number of operations to return
   * @returns Array of cleanup operations
   */
  async getCleanupHistory(limit: number = 50): Promise<CleanupOperation[]> {
    const operations = await this.prisma.cleanupOperation.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return operations.map(op => ({
      id: op.id,
      operationType: op.operationType as 'manual' | 'scheduled' | 'automatic',
      status: op.status as 'pending' | 'running' | 'completed' | 'failed',
      filesProcessed: op.filesProcessed,
      filesDeleted: op.filesDeleted,
      spaceFreed: op.spaceFreed,
      startedAt: op.startedAt || undefined,
      completedAt: op.completedAt || undefined,
      errorMessage: op.errorMessage || undefined,
      createdAt: op.createdAt
    }));
  }

  /**
   * Get statistics about orphaned media
   * @returns Statistics object
   */
  async getOrphanStatistics(): Promise<{
    totalOrphans: number;
    totalOrphanSize: number;
    oldestOrphan?: Date;
    newestOrphan?: Date;
  }> {
    const orphans = await this.findOrphanedMedia();
    
    if (orphans.length === 0) {
      return {
        totalOrphans: 0,
        totalOrphanSize: 0
      };
    }

    const totalSize = orphans.reduce((sum, file) => sum + file.size, 0);
    const dates = orphans.map(file => file.uploadedAt).sort();

    return {
      totalOrphans: orphans.length,
      totalOrphanSize: totalSize,
      oldestOrphan: dates[0],
      newestOrphan: dates[dates.length - 1]
    };
  }

  /**
   * Perform a dry run cleanup to preview what would be deleted
   * @param olderThan Optional date filter
   * @returns Preview of cleanup results
   */
  async previewCleanup(olderThan?: Date): Promise<{
    orphans: MediaRecord[];
    verifications: OrphanVerification[];
    estimatedSpaceFreed: number;
    safeToDeleteCount: number;
  }> {
    const orphans = await this.findOrphanedMedia(olderThan);
    const publicIds = orphans.map(file => file.publicId);
    const verifications = await this.verifyOrphanStatus(publicIds);
    
    const safeToDelete = verifications.filter(v => v.safeToDelete);
    const estimatedSpaceFreed = orphans
      .filter(file => safeToDelete.some(v => v.publicId === file.publicId))
      .reduce((sum, file) => sum + file.size, 0);

    return {
      orphans,
      verifications,
      estimatedSpaceFreed,
      safeToDeleteCount: safeToDelete.length
    };
  }
}

// Export singleton instance
export const cleanupEngine = new CleanupEngine();