import { CleanupEngine } from '@/lib/media/cleanup-engine';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(() => ({ cloud_name: 'test-cloud' })),
    uploader: {
      destroy: jest.fn(),
    },
    api: {
      resource: jest.fn(),
    },
  },
}));

// Mock Prisma Client
const mockPrisma = {
  mediaFile: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
  mediaReference: {
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  article: {
    findMany: jest.fn(),
  },
  newsletterIssue: {
    findMany: jest.fn(),
  },
  podcast: {
    findMany: jest.fn(),
  },
  cleanupOperation: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

describe('CleanupEngine', () => {
  let cleanupEngine: CleanupEngine;
  const mockCloudinaryDestroy = cloudinary.uploader.destroy as jest.Mock;
  const mockCloudinaryResource = cloudinary.api.resource as jest.Mock;

  beforeEach(() => {
    cleanupEngine = new CleanupEngine(mockPrisma);
    jest.clearAllMocks();
  });

  describe('findOrphanedMedia', () => {
    const mockOrphanedFiles = [
      {
        id: 'media_1',
        publicId: 'superbear_blog/orphan1',
        url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/orphan1.jpg',
        filename: 'orphan1.jpg',
        originalFilename: 'orphan1.jpg',
        size: 1024,
        width: 800,
        height: 600,
        format: 'jpg',
        folder: 'superbear_blog',
        uploadedBy: 'user_1',
        uploadedAt: new Date('2023-01-01'),
        metadata: {},
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        references: [],
      },
      {
        id: 'media_2',
        publicId: 'superbear_blog/orphan2',
        url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/orphan2.jpg',
        filename: 'orphan2.jpg',
        originalFilename: 'orphan2.jpg',
        size: 2048,
        width: 1200,
        height: 800,
        format: 'jpg',
        folder: 'superbear_blog',
        uploadedBy: 'user_2',
        uploadedAt: new Date('2023-02-01'),
        metadata: {},
        createdAt: new Date('2023-02-01'),
        updatedAt: new Date('2023-02-01'),
        references: [],
      },
    ];

    it('should find orphaned media files', async () => {
      mockPrisma.mediaFile.findMany.mockResolvedValue(mockOrphanedFiles);

      const result = await cleanupEngine.findOrphanedMedia();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          publicId: 'superbear_blog/orphan1',
          filename: 'orphan1.jpg',
        })
      );
      expect(mockPrisma.mediaFile.findMany).toHaveBeenCalledWith({
        where: {
          references: { none: {} },
        },
        include: {
          references: true,
        },
      });
    });

    it('should filter orphaned media by date', async () => {
      const olderThan = new Date('2023-01-15');
      mockPrisma.mediaFile.findMany.mockResolvedValue([mockOrphanedFiles[0]]);

      const result = await cleanupEngine.findOrphanedMedia(olderThan);

      expect(mockPrisma.mediaFile.findMany).toHaveBeenCalledWith({
        where: {
          references: { none: {} },
          uploadedAt: { lt: olderThan },
        },
        include: {
          references: true,
        },
      });
    });

    it('should handle database errors', async () => {
      mockPrisma.mediaFile.findMany.mockRejectedValue(new Error('Database error'));

      await expect(cleanupEngine.findOrphanedMedia()).rejects.toThrow(
        'Failed to find orphaned media: Database error'
      );
    });
  });

  describe('verifyOrphanStatus', () => {
    const mockMediaFile = {
      id: 'media_1',
      publicId: 'superbear_blog/test',
      uploadedAt: new Date('2023-01-01'),
      references: [],
    };

    it('should verify orphan status for existing files', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(mockMediaFile);
      mockCloudinaryResource.mockResolvedValue({ public_id: 'superbear_blog/test' });
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.newsletterIssue.findMany.mockResolvedValue([]);

      const results = await cleanupEngine.verifyOrphanStatus(['superbear_blog/test']);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        publicId: 'superbear_blog/test',
        isOrphaned: true,
        referenceCount: 0,
        verificationDate: expect.any(Date),
        safeToDelete: true,
        warnings: [],
      });
    });

    it('should mark recently uploaded files as unsafe to delete', async () => {
      const recentFile = {
        ...mockMediaFile,
        uploadedAt: new Date(), // Very recent
      };

      mockPrisma.mediaFile.findUnique.mockResolvedValue(recentFile);
      mockCloudinaryResource.mockResolvedValue({ public_id: 'superbear_blog/test' });
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.newsletterIssue.findMany.mockResolvedValue([]);

      const results = await cleanupEngine.verifyOrphanStatus(['superbear_blog/test']);

      expect(results[0].safeToDelete).toBe(false);
      expect(results[0].warnings).toContain(
        'File uploaded within the last hour - may still be in use'
      );
    });

    it('should detect files that do not exist in database', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(null);

      const results = await cleanupEngine.verifyOrphanStatus(['non_existent']);

      expect(results[0]).toEqual({
        publicId: 'non_existent',
        isOrphaned: true,
        referenceCount: 0,
        verificationDate: expect.any(Date),
        safeToDelete: false,
        warnings: ['Media file not found in database'],
      });
    });

    it('should detect files already deleted from Cloudinary', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(mockMediaFile);
      mockCloudinaryResource.mockRejectedValue({ http_code: 404 });
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.newsletterIssue.findMany.mockResolvedValue([]);

      const results = await cleanupEngine.verifyOrphanStatus(['superbear_blog/test']);

      expect(results[0].warnings).toContain('File already deleted from Cloudinary');
    });

    it('should detect untracked content references', async () => {
      mockPrisma.mediaFile.findUnique.mockResolvedValue(mockMediaFile);
      mockCloudinaryResource.mockResolvedValue({ public_id: 'superbear_blog/test' });
      mockPrisma.article.findMany.mockResolvedValue([
        { id: 'article_1', title: 'Test Article' },
      ]);
      mockPrisma.newsletterIssue.findMany.mockResolvedValue([]);

      const results = await cleanupEngine.verifyOrphanStatus(['superbear_blog/test']);

      expect(results[0].warnings).toContain(
        'Found 1 articles that may reference this image'
      );
    });

    it('should handle verification errors gracefully', async () => {
      mockPrisma.mediaFile.findUnique.mockRejectedValue(new Error('Database error'));

      const results = await cleanupEngine.verifyOrphanStatus(['superbear_blog/test']);

      expect(results[0]).toEqual({
        publicId: 'superbear_blog/test',
        isOrphaned: false,
        referenceCount: -1,
        verificationDate: expect.any(Date),
        safeToDelete: false,
        warnings: ['Verification failed: Database error'],
      });
    });
  });

  describe('cleanupOrphans', () => {
    const mockCleanupOperation = {
      id: 'cleanup_1',
      operationType: 'manual',
      status: 'running',
      startedAt: new Date(),
    };

    beforeEach(() => {
      mockPrisma.cleanupOperation.create.mockResolvedValue(mockCleanupOperation);
      mockPrisma.cleanupOperation.update.mockResolvedValue({});
    });

    it('should perform dry run cleanup', async () => {
      const publicIds = ['superbear_blog/test1', 'superbear_blog/test2'];

      // Mock verification results
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/test1',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
        {
          publicId: 'superbear_blog/test2',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
      ]);

      mockPrisma.mediaFile.findUnique
        .mockResolvedValueOnce({ size: 1024 })
        .mockResolvedValueOnce({ size: 2048 });

      const result = await cleanupEngine.cleanupOrphans(publicIds, true);

      expect(result).toEqual({
        processed: 2,
        deleted: 2,
        failed: 0,
        errors: [],
        freedSpace: 3072,
        dryRun: true,
      });

      // Should not actually delete in dry run
      expect(mockCloudinaryDestroy).not.toHaveBeenCalled();
      expect(mockPrisma.mediaFile.delete).not.toHaveBeenCalled();
    });

    it('should perform actual cleanup', async () => {
      const publicIds = ['superbear_blog/test1'];

      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/test1',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
      ]);

      mockPrisma.mediaFile.findUnique.mockResolvedValue({ size: 1024 });
      mockCloudinaryDestroy.mockResolvedValue({});
      mockPrisma.mediaFile.delete.mockResolvedValue({});

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result.deleted).toBe(1);
      expect(result.freedSpace).toBe(1024);
      expect(mockCloudinaryDestroy).toHaveBeenCalledWith('superbear_blog/test1');
      expect(mockPrisma.mediaFile.delete).toHaveBeenCalledWith({
        where: { publicId: 'superbear_blog/test1' },
      });
    });

    it('should skip unsafe files', async () => {
      const publicIds = ['superbear_blog/unsafe'];

      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/unsafe',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: false,
          warnings: ['File uploaded recently'],
        },
      ]);

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result.failed).toBe(1);
      expect(result.deleted).toBe(0);
      expect(result.errors[0]).toEqual({
        publicId: 'superbear_blog/unsafe',
        error: 'Not safe to delete: File uploaded recently',
        code: 'UNSAFE_DELETE',
        recoverable: false,
      });
    });

    it('should skip non-orphaned files', async () => {
      const publicIds = ['superbear_blog/referenced'];

      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/referenced',
          isOrphaned: false,
          referenceCount: 3,
          verificationDate: new Date(),
          safeToDelete: false,
          warnings: [],
        },
      ]);

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result.failed).toBe(1);
      expect(result.errors[0]).toEqual({
        publicId: 'superbear_blog/referenced',
        error: 'File is not orphaned (3 references)',
        code: 'NOT_ORPHANED',
        recoverable: false,
      });
    });

    it('should handle Cloudinary deletion errors', async () => {
      const publicIds = ['superbear_blog/test1'];

      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/test1',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
      ]);

      mockPrisma.mediaFile.findUnique.mockResolvedValue({ size: 1024 });
      mockCloudinaryDestroy.mockRejectedValue(new Error('Cloudinary error'));

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result.failed).toBe(1);
      expect(result.errors[0]).toEqual({
        publicId: 'superbear_blog/test1',
        error: 'Cloudinary error',
        code: 'DELETE_FAILED',
        recoverable: true,
      });
    });

    it('should handle files already deleted from Cloudinary', async () => {
      const publicIds = ['superbear_blog/test1'];

      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/test1',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
      ]);

      mockPrisma.mediaFile.findUnique.mockResolvedValue({ size: 1024 });
      mockCloudinaryDestroy.mockRejectedValue({ http_code: 404 });
      mockPrisma.mediaFile.delete.mockResolvedValue({});

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result.deleted).toBe(1);
      expect(mockPrisma.mediaFile.delete).toHaveBeenCalled();
    });
  });

  describe('getCleanupHistory', () => {
    const mockOperations = [
      {
        id: 'cleanup_1',
        operationType: 'manual',
        status: 'completed',
        filesProcessed: 10,
        filesDeleted: 8,
        spaceFreed: 8192,
        startedAt: new Date('2023-01-01T10:00:00Z'),
        completedAt: new Date('2023-01-01T10:05:00Z'),
        errorMessage: null,
        createdAt: new Date('2023-01-01T10:00:00Z'),
      },
      {
        id: 'cleanup_2',
        operationType: 'scheduled',
        status: 'failed',
        filesProcessed: 5,
        filesDeleted: 0,
        spaceFreed: 0,
        startedAt: new Date('2023-01-02T02:00:00Z'),
        completedAt: new Date('2023-01-02T02:01:00Z'),
        errorMessage: 'Database connection failed',
        createdAt: new Date('2023-01-02T02:00:00Z'),
      },
    ];

    it('should return cleanup operation history', async () => {
      mockPrisma.cleanupOperation.findMany.mockResolvedValue(mockOperations);

      const history = await cleanupEngine.getCleanupHistory();

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        id: 'cleanup_1',
        operationType: 'manual',
        status: 'completed',
        filesProcessed: 10,
        filesDeleted: 8,
        spaceFreed: 8192,
        startedAt: expect.any(Date),
        completedAt: expect.any(Date),
        errorMessage: undefined,
        createdAt: expect.any(Date),
      });
    });

    it('should limit results', async () => {
      mockPrisma.cleanupOperation.findMany.mockResolvedValue(mockOperations);

      await cleanupEngine.getCleanupHistory(25);

      expect(mockPrisma.cleanupOperation.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 25,
      });
    });
  });

  describe('getOrphanStatistics', () => {
    it('should return orphan statistics', async () => {
      const mockOrphans = [
        {
          size: 1024,
          uploadedAt: new Date('2023-01-01'),
        },
        {
          size: 2048,
          uploadedAt: new Date('2023-01-02'),
        },
      ];

      jest.spyOn(cleanupEngine, 'findOrphanedMedia').mockResolvedValue(mockOrphans as any);

      const stats = await cleanupEngine.getOrphanStatistics();

      expect(stats).toEqual({
        totalOrphans: 2,
        totalOrphanSize: 3072,
        oldestOrphan: new Date('2023-01-01'),
        newestOrphan: new Date('2023-01-02'),
      });
    });

    it('should handle no orphans', async () => {
      jest.spyOn(cleanupEngine, 'findOrphanedMedia').mockResolvedValue([]);

      const stats = await cleanupEngine.getOrphanStatistics();

      expect(stats).toEqual({
        totalOrphans: 0,
        totalOrphanSize: 0,
      });
    });
  });

  describe('previewCleanup', () => {
    it('should provide cleanup preview', async () => {
      const mockOrphans = [
        {
          publicId: 'superbear_blog/orphan1',
          size: 1024,
        },
        {
          publicId: 'superbear_blog/orphan2',
          size: 2048,
        },
      ];

      const mockVerifications = [
        {
          publicId: 'superbear_blog/orphan1',
          safeToDelete: true,
        },
        {
          publicId: 'superbear_blog/orphan2',
          safeToDelete: false,
        },
      ];

      jest.spyOn(cleanupEngine, 'findOrphanedMedia').mockResolvedValue(mockOrphans as any);
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue(mockVerifications as any);

      const preview = await cleanupEngine.previewCleanup();

      expect(preview).toEqual({
        orphans: mockOrphans,
        verifications: mockVerifications,
        estimatedSpaceFreed: 1024, // Only safe to delete files
        safeToDeleteCount: 1,
      });
    });
  });

  describe('scheduleCleanup', () => {
    it('should throw not implemented error', async () => {
      const schedule = {
        frequency: 'daily' as const,
        time: '02:00',
        olderThanDays: 30,
        dryRun: false,
        enabled: true,
      };

      await expect(cleanupEngine.scheduleCleanup(schedule)).rejects.toThrow(
        'Cleanup scheduling not yet implemented'
      );
    });
  });
});