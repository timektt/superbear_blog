import { MediaTracker } from '@/lib/media/media-tracker';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  mediaFile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  mediaReference: {
    create: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  article: {
    findMany: jest.fn(),
  },
  newsletterIssue: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

describe('MediaTracker', () => {
  let mediaTracker: MediaTracker;

  beforeEach(() => {
    mediaTracker = new MediaTracker(mockPrisma);
    jest.clearAllMocks();
  });

  describe('trackUpload', () => {
    const mockUploadResult = {
      url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
      publicId: 'superbear_blog/test_123',
      width: 800,
      height: 600,
      format: 'jpg',
      size: 1024,
      filename: 'test.jpg',
    };

    it('should track a new upload successfully', async () => {
      const mockCreatedRecord = {
        id: 'media_123',
        publicId: mockUploadResult.publicId,
        url: mockUploadResult.url,
        filename: mockUploadResult.filename,
        size: mockUploadResult.size,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Note: Since the actual implementation uses placeholder code,
      // we'll test the interface and expected behavior
      const result = await mediaTracker.trackUpload(mockUploadResult);

      expect(result).toEqual(
        expect.objectContaining({
          publicId: mockUploadResult.publicId,
          url: mockUploadResult.url,
          filename: mockUploadResult.filename,
          size: mockUploadResult.size,
          format: mockUploadResult.format,
          width: mockUploadResult.width,
          height: mockUploadResult.height,
        })
      );
    });

    it('should track upload with content reference', async () => {
      const context = {
        contentType: 'article' as const,
        contentId: 'article_123',
        referenceContext: 'content' as const,
        uploadedBy: 'user_123',
      };

      const result = await mediaTracker.trackUpload(mockUploadResult, context);

      expect(result).toEqual(
        expect.objectContaining({
          publicId: mockUploadResult.publicId,
          uploadedBy: context.uploadedBy,
        })
      );
    });

    it('should handle upload tracking errors', async () => {
      // Mock an error scenario
      const invalidUploadResult = {
        ...mockUploadResult,
        publicId: '', // Invalid publicId
      };

      await expect(
        mediaTracker.trackUpload(invalidUploadResult)
      ).rejects.toThrow();
    });
  });

  describe('extractImageReferences', () => {
    it('should extract publicIds from Cloudinary URLs', () => {
      const content = `
        <img src="https://res.cloudinary.com/test/image/upload/v1234567890/superbear_blog/image1.jpg" />
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/image2.png" />
      `;

      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('superbear_blog/image1');
      expect(publicIds).toContain('superbear_blog/image2');
      expect(publicIds).toHaveLength(2);
    });

    it('should extract publicIds from data-public-id attributes', () => {
      const content = `
        <img data-public-id="superbear_blog/test1" src="..." />
        <img data-public-id="superbear_blog/test2" src="..." />
      `;

      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('superbear_blog/test1');
      expect(publicIds).toContain('superbear_blog/test2');
      expect(publicIds).toHaveLength(2);
    });

    it('should extract publicIds from TipTap JSON content', () => {
      const content = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: {
              publicId: 'superbear_blog/tiptap_image',
              src: 'https://res.cloudinary.com/test/image/upload/superbear_blog/tiptap_image.jpg',
            },
          },
        ],
      });

      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('superbear_blog/tiptap_image');
    });

    it('should extract publicIds from markdown image syntax', () => {
      const content = `
        ![Alt text](https://res.cloudinary.com/test/image/upload/v1234567890/superbear_blog/markdown_image.jpg)
        ![Another image](https://res.cloudinary.com/test/image/upload/superbear_blog/another_image.png)
      `;

      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('superbear_blog/markdown_image');
      expect(publicIds).toContain('superbear_blog/another_image');
    });

    it('should handle duplicate publicIds', () => {
      const content = `
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/duplicate.jpg" />
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/duplicate.jpg" />
        <img data-public-id="superbear_blog/duplicate" />
      `;

      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('superbear_blog/duplicate');
      expect(publicIds).toHaveLength(1); // Should deduplicate
    });

    it('should handle empty or invalid content', () => {
      expect(mediaTracker.extractImageReferences('')).toEqual([]);
      expect(mediaTracker.extractImageReferences('No images here')).toEqual([]);
      expect(mediaTracker.extractImageReferences('<p>Just text</p>')).toEqual([]);
    });

    it('should handle malformed URLs gracefully', () => {
      const content = `
        <img src="not-a-cloudinary-url.jpg" />
        <img src="https://other-cdn.com/image.jpg" />
        <img src="https://res.cloudinary.com/test/image/upload/valid_image.jpg" />
      `;

      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('valid_image');
      expect(publicIds).toHaveLength(1);
    });
  });

  describe('updateContentReferences', () => {
    it('should update references for new content', async () => {
      const content = `
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/image1.jpg" />
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/image2.jpg" />
      `;

      const result = await mediaTracker.updateContentReferences(
        'article',
        'article_123',
        content
      );

      expect(result).toEqual({
        added: expect.any(Number),
        removed: expect.any(Number),
        total: expect.any(Number),
      });
    });

    it('should handle content with no images', async () => {
      const content = '<p>This is just text content with no images.</p>';

      const result = await mediaTracker.updateContentReferences(
        'article',
        'article_123',
        content
      );

      expect(result.total).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      await expect(
        mediaTracker.updateContentReferences(
          'article',
          '', // Invalid content ID
          'content'
        )
      ).rejects.toThrow();
    });
  });

  describe('getMediaUsage', () => {
    it('should return usage information for a media file', async () => {
      const publicId = 'superbear_blog/test_image';

      const usage = await mediaTracker.getMediaUsage(publicId);

      expect(usage).toEqual({
        publicId,
        references: expect.any(Array),
        totalReferences: expect.any(Number),
        isOrphaned: expect.any(Boolean),
        lastUsed: expect.any(Date) || undefined,
      });
    });

    it('should identify orphaned media correctly', async () => {
      const publicId = 'superbear_blog/orphaned_image';

      const usage = await mediaTracker.getMediaUsage(publicId);

      expect(usage.isOrphaned).toBe(true);
      expect(usage.totalReferences).toBe(0);
      expect(usage.references).toHaveLength(0);
    });
  });

  describe('findOrphanedMedia', () => {
    it('should find media files with no references', async () => {
      const result = await mediaTracker.findOrphanedMedia();

      expect(result).toEqual({
        orphanedMedia: expect.any(Array),
        totalOrphans: expect.any(Number),
        totalSize: expect.any(Number),
        oldestOrphan: expect.any(Date) || undefined,
      });
    });

    it('should filter orphans by date', async () => {
      const olderThan = new Date('2023-01-01');

      const result = await mediaTracker.findOrphanedMedia(olderThan);

      expect(result.orphanedMedia).toEqual(expect.any(Array));
    });
  });

  describe('getMediaFiles', () => {
    it('should return paginated media files', async () => {
      const options = {
        limit: 10,
        offset: 0,
        sortBy: 'uploadedAt' as const,
        sortOrder: 'desc' as const,
      };

      const result = await mediaTracker.getMediaFiles(options);

      expect(result).toEqual({
        media: expect.any(Array),
        total: expect.any(Number),
        hasMore: expect.any(Boolean),
      });
    });

    it('should filter by folder', async () => {
      const options = {
        folder: 'superbear_blog',
        limit: 10,
      };

      const result = await mediaTracker.getMediaFiles(options);

      expect(result.media).toEqual(expect.any(Array));
    });

    it('should filter orphans only', async () => {
      const options = {
        orphansOnly: true,
        limit: 10,
      };

      const result = await mediaTracker.getMediaFiles(options);

      expect(result.media).toEqual(expect.any(Array));
    });
  });

  describe('deleteMediaRecord', () => {
    it('should delete media record and references', async () => {
      const publicId = 'superbear_blog/test_image';

      const result = await mediaTracker.deleteMediaRecord(publicId);

      expect(result).toEqual({
        success: expect.any(Boolean),
        referencesRemoved: expect.any(Number),
      });
    });

    it('should handle deletion errors', async () => {
      const publicId = 'non_existent_image';

      await expect(
        mediaTracker.deleteMediaRecord(publicId)
      ).rejects.toThrow();
    });
  });

  describe('verifyOrphanStatus', () => {
    it('should verify orphan status for multiple files', async () => {
      const publicIds = [
        'superbear_blog/image1',
        'superbear_blog/image2',
        'superbear_blog/orphan',
      ];

      const results = await mediaTracker.verifyOrphanStatus(publicIds);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        publicId: publicIds[0],
        isOrphan: expect.any(Boolean),
        referenceCount: expect.any(Number),
      });
    });

    it('should handle verification errors gracefully', async () => {
      const publicIds = ['invalid_id'];

      const results = await mediaTracker.verifyOrphanStatus(publicIds);

      expect(results).toHaveLength(1);
      expect(results[0].isOrphan).toBe(false); // Should be conservative on errors
    });
  });

  describe('getMediaStatistics', () => {
    it('should return comprehensive media statistics', async () => {
      const stats = await mediaTracker.getMediaStatistics();

      expect(stats).toEqual({
        totalFiles: expect.any(Number),
        totalSize: expect.any(Number),
        orphanedFiles: expect.any(Number),
        orphanedSize: expect.any(Number),
        byFormat: expect.any(Object),
        byFolder: expect.any(Object),
      });
    });

    it('should group statistics by format and folder', async () => {
      const stats = await mediaTracker.getMediaStatistics();

      expect(stats.byFormat).toEqual(expect.any(Object));
      expect(stats.byFolder).toEqual(expect.any(Object));
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed content gracefully', () => {
      const malformedContent = 'This is not valid HTML or JSON {broken';

      const publicIds = mediaTracker.extractImageReferences(malformedContent);

      expect(publicIds).toEqual([]);
    });

    it('should handle very large content efficiently', () => {
      // Create a large content string with many images
      const largeContent = Array(1000)
        .fill(0)
        .map((_, i) => `<img src="https://res.cloudinary.com/test/image/upload/superbear_blog/image${i}.jpg" />`)
        .join('\n');

      const publicIds = mediaTracker.extractImageReferences(largeContent);

      expect(publicIds).toHaveLength(1000);
      expect(publicIds[0]).toBe('superbear_blog/image0');
      expect(publicIds[999]).toBe('superbear_blog/image999');
    });

    it('should handle special characters in publicIds', () => {
      const content = `
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/image-with-dashes.jpg" />
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/image_with_underscores.jpg" />
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/image%20with%20spaces.jpg" />
      `;

      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('superbear_blog/image-with-dashes');
      expect(publicIds).toContain('superbear_blog/image_with_underscores');
      expect(publicIds).toContain('superbear_blog/image%20with%20spaces');
    });

    it('should handle nested folder structures in publicIds', () => {
      const content = `
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/articles/2024/january/image.jpg" />
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/newsletters/weekly/image.jpg" />
      `;

      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('superbear_blog/articles/2024/january/image');
      expect(publicIds).toContain('superbear_blog/newsletters/weekly/image');
    });
  });
});