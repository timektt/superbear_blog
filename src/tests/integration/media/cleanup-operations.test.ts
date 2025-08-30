import { cleanupEngine } from '@/lib/media/cleanup-engine';
import { mediaTracker } from '@/lib/media/media-tracker';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

// Mock dependencies
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
  cleanupOperation: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

// Mock media tracker
jest.mock('@/lib/media/media-tracker', () => ({
  mediaTracker: {
    findOrphanedMedia: jest.fn(),
    verifyOrphanStatus: jest.fn(),
    getMediaUsage: jest.fn(),
  },
}));

describe('Cleanup Operations Integration Tests', () => {
  const mockCloudinaryDestroy = cloudinary.uploader.destroy as jest.Mock;
  const mockCloudinaryResource = cloudinary.api.resource as jest.Mock;
  const mockMediaTracker = {
    findOrphanedMedia: mediaTracker.findOrphanedMedia as jest.Mock,
    verifyOrphanStatus: mediaTracker.verifyOrphanStatus as jest.Mock,
    getMediaUsage: mediaTracker.getMediaUsage as jest.Mock,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockPrisma.cleanupOperation.create.mockResolvedValue({
      id: 'cleanup_123',
      operationType: 'manual',
      status: 'running',
      startedAt: new Date(),
    });
    
    mockPrisma.cleanupOperation.update.mockResolvedValue({});
  });

  const createMockOrphanedFiles = () => [
    {
      id: 'media_1',
      publicId: 'superbear_blog/orphan1',
      url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/orphan1.jpg',
      filename: 'orphan1.jpg',
      size: 1024,
      uploadedAt: new Date('2023-01-01'),
      references: [],
    },
    {
      id: 'media_2',
      publicId: 'superbear_blog/orphan2',
      url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/orphan2.jpg',
      filename: 'orphan2.jpg',
      size: 2048,
      uploadedAt: new Date('2023-01-02'),
      references: [],
    },
    {
      id: 'media_3',
      publicId: 'superbear_blog/recent_orphan',
      url: 'https://res.cloudinary.com/test/image/upload/superbear_blog/recent_orphan.jpg',
      filename: 'recent_orphan.jpg',
      size: 512,
      uploadedAt: new Date(), // Very recent
      references: [],
    },
  ];

  describe('Orphan Detection Integration', () => {
    it('should identify orphaned media files correctly', async () => {
      const mockOrphans = createMockOrphanedFiles();
      
      mockPrisma.mediaFile.findMany.mockResolvedValue(mockOrphans);

      const orphans = await cleanupEngine.findOrphanedMedia();

      expect(orphans).toHaveLength(3);
      expect(orphans[0]).toEqual(
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

    it('should filter orphans by date', async () => {
      const mockOrphans = createMockOrphanedFiles().slice(0, 2); // Exclude recent one
      const olderThan = new Date('2023-01-15');
      
      mockPrisma.mediaFile.findMany.mockResolvedValue(mockOrphans);

      const orphans = await cleanupEngine.findOrphanedMedia(olderThan);

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

    it('should get comprehensive orphan statistics', async () => {
      const mockOrphans = createMockOrphanedFiles();
      
      jest.spyOn(cleanupEngine, 'findOrphanedMedia').mockResolvedValue(mockOrphans as any);

      const stats = await cleanupEngine.getOrphanStatistics();

      expect(stats).toEqual({
        totalOrphans: 3,
        totalOrphanSize: 3584, // 1024 + 2048 + 512
        oldestOrphan: new Date('2023-01-01'),
        newestOrphan: expect.any(Date),
      });
    });
  });

  describe('Verification Integration', () => {
    it('should perform comprehensive orphan verification', async () => {
      const publicIds = ['superbear_blog/test1', 'superbear_blog/test2'];
      
      // Mock database responses
      mockPrisma.mediaFile.findUnique
        .mockResolvedValueOnce({
          id: 'media_1',
          publicId: 'superbear_blog/test1',
          uploadedAt: new Date('2023-01-01'),
          references: [],
        })
        .mockResolvedValueOnce({
          id: 'media_2',
          publicId: 'superbear_blog/test2',
          uploadedAt: new Date(),
          references: [],
        });

      // Mock Cloudinary responses
      mockCloudinaryResource
        .mockResolvedValueOnce({ public_id: 'superbear_blog/test1' })
        .mockResolvedValueOnce({ public_id: 'superbear_blog/test2' });

      // Mock content scan responses
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.newsletterIssue.findMany.mockResolvedValue([]);

      const verifications = await cleanupEngine.verifyOrphanStatus(publicIds);

      expect(verifications).toHaveLength(2);
      
      // First file should be safe to delete (old)
      expect(verifications[0]).toEqual({
        publicId: 'superbear_blog/test1',
        isOrphaned: true,
        referenceCount: 0,
        verificationDate: expect.any(Date),
        safeToDelete: true,
        warnings: [],
      });

      // Second file should not be safe (recent)
      expect(verifications[1]).toEqual({
        publicId: 'superbear_blog/test2',
        isOrphaned: true,
        referenceCount: 0,
        verificationDate: expect.any(Date),
        safeToDelete: false,
        warnings: ['File uploaded within the last hour - may still be in use'],
      });
    });

    it('should detect untracked content references', async () => {
      const publicIds = ['superbear_blog/referenced'];
      
      mockPrisma.mediaFile.findUnique.mockResolvedValue({
        id: 'media_1',
        publicId: 'superbear_blog/referenced',
        uploadedAt: new Date('2023-01-01'),
        references: [],
      });

      mockCloudinaryResource.mockResolvedValue({ public_id: 'superbear_blog/referenced' });

      // Mock content that references the image
      mockPrisma.article.findMany.mockResolvedValue([
        { id: 'article_1', title: 'Article with Image' },
      ]);
      mockPrisma.newsletterIssue.findMany.mockResolvedValue([]);

      const verifications = await cleanupEngine.verifyOrphanStatus(publicIds);

      expect(verifications[0].warnings).toContain(
        'Found 1 articles that may reference this image'
      );
    });

    it('should handle Cloudinary verification errors', async () => {
      const publicIds = ['superbear_blog/missing'];
      
      mockPrisma.mediaFile.findUnique.mockResolvedValue({
        id: 'media_1',
        publicId: 'superbear_blog/missing',
        uploadedAt: new Date('2023-01-01'),
        references: [],
      });

      // Mock Cloudinary 404 error
      mockCloudinaryResource.mockRejectedValue({ http_code: 404 });

      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.newsletterIssue.findMany.mockResolvedValue([]);

      const verifications = await cleanupEngine.verifyOrphanStatus(publicIds);

      expect(verifications[0].warnings).toContain('File already deleted from Cloudinary');
    });
  });

  describe('Cleanup Execution Integration', () => {
    it('should perform complete cleanup workflow', async () => {
      const publicIds = ['superbear_blog/safe_orphan'];
      
      // Mock verification
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/safe_orphan',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
      ]);

      // Mock file size for space calculation
      mockPrisma.mediaFile.findUnique.mockResolvedValue({ size: 1024 });

      // Mock successful Cloudinary deletion
      mockCloudinaryDestroy.mockResolvedValue({});

      // Mock successful database deletion
      mockPrisma.mediaFile.delete.mockResolvedValue({});

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result).toEqual({
        processed: 1,
        deleted: 1,
        failed: 0,
        errors: [],
        freedSpace: 1024,
        dryRun: false,
      });

      // Verify cleanup operation was tracked
      expect(mockPrisma.cleanupOperation.create).toHaveBeenCalledWith({
        data: {
          operationType: 'manual',
          status: 'running',
          startedAt: expect.any(Date),
        },
      });

      expect(mockPrisma.cleanupOperation.update).toHaveBeenCalledWith({
        where: { id: 'cleanup_123' },
        data: {
          status: 'completed',
          completedAt: expect.any(Date),
          filesProcessed: 1,
          filesDeleted: 1,
          spaceFreed: 1024,
        },
      });

      // Verify actual deletion calls
      expect(mockCloudinaryDestroy).toHaveBeenCalledWith('superbear_blog/safe_orphan');
      expect(mockPrisma.mediaFile.delete).toHaveBeenCalledWith({
        where: { publicId: 'superbear_blog/safe_orphan' },
      });
    });

    it('should perform dry run without actual deletion', async () => {
      const publicIds = ['superbear_blog/dry_run_test'];
      
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/dry_run_test',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
      ]);

      mockPrisma.mediaFile.findUnique.mockResolvedValue({ size: 2048 });

      const result = await cleanupEngine.cleanupOrphans(publicIds, true);

      expect(result).toEqual({
        processed: 1,
        deleted: 1,
        failed: 0,
        errors: [],
        freedSpace: 2048,
        dryRun: true,
      });

      // Verify no actual deletion occurred
      expect(mockCloudinaryDestroy).not.toHaveBeenCalled();
      expect(mockPrisma.mediaFile.delete).not.toHaveBeenCalled();
    });

    it('should handle mixed success and failure scenarios', async () => {
      const publicIds = [
        'superbear_blog/success',
        'superbear_blog/unsafe',
        'superbear_blog/cloudinary_error',
      ];
      
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/success',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
        {
          publicId: 'superbear_blog/unsafe',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: false,
          warnings: ['Recently uploaded'],
        },
        {
          publicId: 'superbear_blog/cloudinary_error',
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

      // Mock Cloudinary responses
      mockCloudinaryDestroy
        .mockResolvedValueOnce({}) // Success
        .mockRejectedValueOnce(new Error('Cloudinary error')); // Failure

      mockPrisma.mediaFile.delete.mockResolvedValueOnce({});

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result).toEqual({
        processed: 3,
        deleted: 1,
        failed: 2,
        errors: [
          {
            publicId: 'superbear_blog/unsafe',
            error: 'Not safe to delete: Recently uploaded',
            code: 'UNSAFE_DELETE',
            recoverable: false,
          },
          {
            publicId: 'superbear_blog/cloudinary_error',
            error: 'Cloudinary error',
            code: 'DELETE_FAILED',
            recoverable: true,
          },
        ],
        freedSpace: 1024,
        dryRun: false,
      });
    });

    it('should handle files already deleted from Cloudinary', async () => {
      const publicIds = ['superbear_blog/already_deleted'];
      
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/already_deleted',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
      ]);

      mockPrisma.mediaFile.findUnique.mockResolvedValue({ size: 1024 });

      // Mock Cloudinary 404 (already deleted)
      mockCloudinaryDestroy.mockRejectedValue({ http_code: 404 });

      // Mock successful database deletion
      mockPrisma.mediaFile.delete.mockResolvedValue({});

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result.deleted).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockPrisma.mediaFile.delete).toHaveBeenCalled();
    });
  });

  describe('Cleanup History Integration', () => {
    it('should track cleanup operation history', async () => {
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

      expect(history[1]).toEqual({
        id: 'cleanup_2',
        operationType: 'scheduled',
        status: 'failed',
        filesProcessed: 5,
        filesDeleted: 0,
        spaceFreed: 0,
        startedAt: expect.any(Date),
        completedAt: expect.any(Date),
        errorMessage: 'Database connection failed',
        createdAt: expect.any(Date),
      });
    });
  });

  describe('Cleanup Preview Integration', () => {
    it('should provide comprehensive cleanup preview', async () => {
      const mockOrphans = createMockOrphanedFiles();
      const mockVerifications = [
        {
          publicId: 'superbear_blog/orphan1',
          safeToDelete: true,
        },
        {
          publicId: 'superbear_blog/orphan2',
          safeToDelete: true,
        },
        {
          publicId: 'superbear_blog/recent_orphan',
          safeToDelete: false,
        },
      ];

      jest.spyOn(cleanupEngine, 'findOrphanedMedia').mockResolvedValue(mockOrphans as any);
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue(mockVerifications as any);

      const preview = await cleanupEngine.previewCleanup();

      expect(preview).toEqual({
        orphans: mockOrphans,
        verifications: mockVerifications,
        estimatedSpaceFreed: 3072, // 1024 + 2048 (safe to delete files only)
        safeToDeleteCount: 2,
      });
    });

    it('should handle preview with date filter', async () => {
      const olderThan = new Date('2023-01-15');
      const mockOrphans = createMockOrphanedFiles().slice(0, 2); // Exclude recent one

      jest.spyOn(cleanupEngine, 'findOrphanedMedia').mockResolvedValue(mockOrphans as any);
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        { publicId: 'superbear_blog/orphan1', safeToDelete: true },
        { publicId: 'superbear_blog/orphan2', safeToDelete: true },
      ] as any);

      const preview = await cleanupEngine.previewCleanup(olderThan);

      expect(preview.orphans).toHaveLength(2);
      expect(preview.safeToDeleteCount).toBe(2);
      expect(preview.estimatedSpaceFreed).toBe(3072); // 1024 + 2048
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database errors during cleanup', async () => {
      const publicIds = ['superbear_blog/db_error'];
      
      jest.spyOn(cleanupEngine, 'verifyOrphanStatus').mockResolvedValue([
        {
          publicId: 'superbear_blog/db_error',
          isOrphaned: true,
          referenceCount: 0,
          verificationDate: new Date(),
          safeToDelete: true,
          warnings: [],
        },
      ]);

      mockPrisma.mediaFile.findUnique.mockResolvedValue({ size: 1024 });
      mockCloudinaryDestroy.mockResolvedValue({});

      // Mock database error
      mockPrisma.mediaFile.delete.mockRejectedValue(new Error('Database connection lost'));

      const result = await cleanupEngine.cleanupOrphans(publicIds, false);

      expect(result.failed).toBe(1);
      expect(result.errors[0]).toEqual({
        publicId: 'superbear_blog/db_error',
        error: 'Database connection lost',
        code: 'DELETE_FAILED',
        recoverable: true,
      });

      // Verify operation was marked as failed
      expect(mockPrisma.cleanupOperation.update).toHaveBeenCalledWith({
        where: { id: 'cleanup_123' },
        data: {
          status: 'completed',
          completedAt: expect.any(Date),
          filesProcessed: 1,
          filesDeleted: 0,
          spaceFreed: 0,
        },
      });
    });

    it('should handle verification errors gracefully', async () => {
      const publicIds = ['superbear_blog/verification_error'];
      
      mockPrisma.mediaFile.findUnique.mockRejectedValue(new Error('Database error'));

      const verifications = await cleanupEngine.verifyOrphanStatus(publicIds);

      expect(verifications[0]).toEqual({
        publicId: 'superbear_blog/verification_error',
        isOrphaned: false,
        referenceCount: -1,
        verificationDate: expect.any(Date),
        safeToDelete: false,
        warnings: ['Verification failed: Database error'],
      });
    });

    it('should handle cleanup operation creation failure', async () => {
      const publicIds = ['superbear_blog/test'];
      
      // Mock operation creation failure
      mockPrisma.cleanupOperation.create.mockRejectedValue(new Error('Failed to create operation'));

      await expect(cleanupEngine.cleanupOrphans(publicIds, false)).rejects.toThrow('Failed to create operation');
    });
  });
});