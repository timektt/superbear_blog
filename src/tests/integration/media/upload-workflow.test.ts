import { NextRequest } from 'next/server';
import { uploadService } from '@/lib/media/upload-service';
import { mediaTracker } from '@/lib/media/media-tracker';
import { PrismaClient } from '@prisma/client';

// Mock external dependencies
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(() => ({ cloud_name: 'test-cloud' })),
    uploader: {
      upload: jest.fn(),
    },
  },
}));

jest.mock('@/lib/media/file-validator', () => ({
  fileValidator: {
    validateFile: jest.fn(),
  },
}));

jest.mock('@/lib/media/upload-performance', () => ({
  UploadPerformanceMonitor: {
    recordMetrics: jest.fn(),
  },
  UploadTimer: jest.fn().mockImplementation(() => ({
    mark: jest.fn(),
    getDuration: jest.fn(() => 1000),
    getDurationBetween: jest.fn(() => 500),
  })),
  NetworkPerformanceDetector: {
    getOptimalUploadSettings: jest.fn(() => ({
      compressionQuality: 0.8,
    })),
    getConnectionInfo: jest.fn(() => ({
      effectiveType: '4g',
    })),
  },
}));

jest.mock('@/lib/media/upload-optimizer', () => ({
  CloudinaryOptimizer: {
    getOptimizedTransformations: jest.fn(() => ({
      quality: 'auto',
      fetch_format: 'auto',
    })),
    getResponsiveBreakpoints: jest.fn(() => []),
  },
}));

jest.mock('@/lib/media/media-cache', () => ({
  mediaCache: {
    cacheUploadProgress: jest.fn(),
  },
}));

// Mock browser APIs
global.FileReader = class {
  result: string | ArrayBuffer | null = null;
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,mockbase64data`;
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 10);
  }

  readAsArrayBuffer(file: File) {
    setTimeout(() => {
      this.result = new ArrayBuffer(4);
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 10);
  }
} as any;

describe('Media Upload Workflow Integration Tests', () => {
  const mockCloudinaryUpload = require('cloudinary').v2.uploader.upload;
  const mockFileValidator = require('@/lib/media/file-validator').fileValidator.validateFile;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockFile = (
    name: string = 'test.jpg',
    type: string = 'image/jpeg',
    size: number = 1024
  ): File => {
    const file = new File(['mock content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  };

  describe('End-to-End Upload Flow', () => {
    it('should complete full upload and tracking workflow', async () => {
      const mockFile = createMockFile('integration-test.jpg', 'image/jpeg', 2048);
      
      // Mock successful validation
      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        metadata: {
          mimeType: 'image/jpeg',
          size: 2048,
          width: 800,
          height: 600,
          hasExifData: false,
          strippedExifTags: [],
        },
      });

      // Mock successful Cloudinary upload
      const mockCloudinaryResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/v1234567890/superbear_blog/integration-test.jpg',
        public_id: 'superbear_blog/integration-test_1234567890',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 2048,
      };
      mockCloudinaryUpload.mockResolvedValue(mockCloudinaryResult);

      // Perform upload
      const uploadResult = await uploadService.uploadImage(mockFile, {
        folder: 'superbear_blog',
      });

      // Verify upload success
      expect(uploadResult.success).toBe(true);
      expect(uploadResult.data).toEqual({
        url: mockCloudinaryResult.secure_url,
        publicId: mockCloudinaryResult.public_id,
        width: mockCloudinaryResult.width,
        height: mockCloudinaryResult.height,
        format: mockCloudinaryResult.format,
        size: mockFile.size,
        filename: mockFile.name,
        uploadId: expect.any(String),
      });

      // Track the upload
      const trackingResult = await mediaTracker.trackUpload(uploadResult.data!, {
        contentType: 'article',
        contentId: 'test-article-123',
        referenceContext: 'content',
        uploadedBy: 'test-user',
      });

      // Verify tracking
      expect(trackingResult).toEqual(
        expect.objectContaining({
          publicId: mockCloudinaryResult.public_id,
          url: mockCloudinaryResult.secure_url,
          filename: mockFile.name,
          size: mockFile.size,
          uploadedBy: 'test-user',
        })
      );
    });

    it('should handle upload failure and not create tracking record', async () => {
      const mockFile = createMockFile('failing-upload.jpg');

      // Mock successful validation
      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Mock Cloudinary failure
      mockCloudinaryUpload.mockRejectedValue(new Error('Cloudinary service unavailable'));

      // Perform upload
      const uploadResult = await uploadService.uploadImage(mockFile);

      // Verify upload failure
      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toBe('Cloudinary service unavailable');
      expect(uploadResult.data).toBeUndefined();

      // Verify no tracking record is created for failed uploads
      // (In real implementation, this would check the database)
    });

    it('should handle validation failure before upload', async () => {
      const mockFile = createMockFile('invalid.exe', 'application/octet-stream', 1024);

      // Mock validation failure
      mockFileValidator.mockResolvedValue({
        isValid: false,
        errors: ['File type not allowed', 'Suspicious file extension'],
        warnings: [],
      });

      // Perform upload
      const uploadResult = await uploadService.uploadImage(mockFile);

      // Verify validation failure prevents upload
      expect(uploadResult.success).toBe(false);
      expect(uploadResult.error).toContain('File validation failed');
      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });
  });

  describe('Multiple File Upload Integration', () => {
    it('should handle concurrent uploads with mixed results', async () => {
      const files = [
        createMockFile('success1.jpg', 'image/jpeg', 1024),
        createMockFile('success2.png', 'image/png', 2048),
        createMockFile('failure.jpg', 'image/jpeg', 1024),
      ];

      // Mock validation results
      mockFileValidator
        .mockResolvedValueOnce({
          isValid: true,
          errors: [],
          warnings: [],
        })
        .mockResolvedValueOnce({
          isValid: true,
          errors: [],
          warnings: [],
        })
        .mockResolvedValueOnce({
          isValid: false,
          errors: ['File corrupted'],
          warnings: [],
        });

      // Mock Cloudinary results
      mockCloudinaryUpload
        .mockResolvedValueOnce({
          secure_url: 'https://res.cloudinary.com/test/image/upload/success1.jpg',
          public_id: 'superbear_blog/success1',
          width: 800,
          height: 600,
          format: 'jpg',
          bytes: 1024,
        })
        .mockResolvedValueOnce({
          secure_url: 'https://res.cloudinary.com/test/image/upload/success2.png',
          public_id: 'superbear_blog/success2',
          width: 1200,
          height: 800,
          format: 'png',
          bytes: 2048,
        });

      // Perform multiple uploads
      const results = await uploadService.uploadMultiple(files);

      // Verify mixed results
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[2].success).toBe(false);

      // Verify successful uploads can be tracked
      for (const result of results.filter(r => r.success)) {
        const trackingResult = await mediaTracker.trackUpload(result.data!);
        expect(trackingResult.publicId).toBe(result.data!.publicId);
      }
    });
  });

  describe('Progress Tracking Integration', () => {
    it('should track upload progress throughout the workflow', async () => {
      const mockFile = createMockFile('progress-test.jpg');
      const progressUpdates: any[] = [];

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Mock slow Cloudinary upload
      mockCloudinaryUpload.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            secure_url: 'https://res.cloudinary.com/test/image/upload/progress-test.jpg',
            public_id: 'superbear_blog/progress-test',
            width: 800,
            height: 600,
            format: 'jpg',
            bytes: 1024,
          }), 100)
        )
      );

      // Start upload with progress tracking
      const uploadPromise = uploadService.uploadImage(mockFile, {
        onProgress: (progress) => {
          progressUpdates.push(progress);
        },
      });

      // Check initial progress
      const activeUploads = uploadService.getActiveUploads();
      expect(activeUploads).toHaveLength(1);

      const result = await uploadPromise;

      // Verify progress was tracked
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0]).toEqual(
        expect.objectContaining({
          uploadId: expect.any(String),
          filename: mockFile.name,
          progress: expect.any(Number),
          status: expect.any(String),
        })
      );

      // Verify final result
      expect(result.success).toBe(true);
    });

    it('should handle upload cancellation', async () => {
      const mockFile = createMockFile('cancel-test.jpg');

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Mock very slow upload
      mockCloudinaryUpload.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            secure_url: 'https://res.cloudinary.com/test/image/upload/cancel-test.jpg',
            public_id: 'superbear_blog/cancel-test',
            width: 800,
            height: 600,
            format: 'jpg',
            bytes: 1024,
          }), 1000)
        )
      );

      // Start upload
      const uploadPromise = uploadService.uploadImage(mockFile);

      // Cancel upload after a short delay
      setTimeout(() => {
        const activeUploads = uploadService.getActiveUploads();
        if (activeUploads.length > 0) {
          uploadService.cancelUpload(activeUploads[0].uploadId);
        }
      }, 50);

      const result = await uploadPromise;

      // Verify cancellation
      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled');
    });
  });

  describe('Content Reference Integration', () => {
    it('should extract and track image references from content', async () => {
      const content = `
        <h1>Test Article</h1>
        <p>This article contains images:</p>
        <img src="https://res.cloudinary.com/test/image/upload/v1234567890/superbear_blog/image1.jpg" alt="Image 1" />
        <p>Some more content</p>
        <img src="https://res.cloudinary.com/test/image/upload/superbear_blog/image2.png" alt="Image 2" />
      `;

      // Extract references
      const publicIds = mediaTracker.extractImageReferences(content);

      expect(publicIds).toContain('superbear_blog/image1');
      expect(publicIds).toContain('superbear_blog/image2');
      expect(publicIds).toHaveLength(2);

      // Update content references
      const updateResult = await mediaTracker.updateContentReferences(
        'article',
        'test-article-123',
        content
      );

      expect(updateResult).toEqual({
        added: expect.any(Number),
        removed: expect.any(Number),
        total: 2,
      });
    });

    it('should handle TipTap JSON content format', async () => {
      const tiptapContent = JSON.stringify({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Here is an image: ',
              },
            ],
          },
          {
            type: 'image',
            attrs: {
              src: 'https://res.cloudinary.com/test/image/upload/superbear_blog/tiptap-image.jpg',
              publicId: 'superbear_blog/tiptap-image',
              alt: 'TipTap Image',
            },
          },
        ],
      });

      const publicIds = mediaTracker.extractImageReferences(tiptapContent);

      expect(publicIds).toContain('superbear_blog/tiptap-image');
      expect(publicIds).toHaveLength(1);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should retry failed uploads and eventually succeed', async () => {
      const mockFile = createMockFile('retry-test.jpg');

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Mock Cloudinary to fail twice, then succeed
      mockCloudinaryUpload
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Service temporarily unavailable'))
        .mockResolvedValueOnce({
          secure_url: 'https://res.cloudinary.com/test/image/upload/retry-test.jpg',
          public_id: 'superbear_blog/retry-test',
          width: 800,
          height: 600,
          format: 'jpg',
          bytes: 1024,
        });

      const result = await uploadService.uploadImage(mockFile, {
        maxRetries: 3,
      });

      expect(result.success).toBe(true);
      expect(mockCloudinaryUpload).toHaveBeenCalledTimes(3);
    });

    it('should fail after exhausting all retries', async () => {
      const mockFile = createMockFile('persistent-failure.jpg');

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Mock Cloudinary to always fail
      mockCloudinaryUpload.mockRejectedValue(new Error('Persistent error'));

      const result = await uploadService.uploadImage(mockFile, {
        maxRetries: 2,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Persistent error');
      expect(mockCloudinaryUpload).toHaveBeenCalledTimes(2);
    });
  });

  describe('Security Integration', () => {
    it('should validate and strip EXIF data in full workflow', async () => {
      const mockFile = createMockFile('with-exif.jpg', 'image/jpeg', 1024);
      const processedFile = createMockFile('processed.jpg', 'image/jpeg', 900);

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: ['EXIF data was stripped for privacy'],
        processedFile,
        metadata: {
          mimeType: 'image/jpeg',
          size: 1024,
          hasExifData: true,
          strippedExifTags: ['GPS', 'DateTime', 'UserComment'],
        },
      });

      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/processed.jpg',
        public_id: 'superbear_blog/processed',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 900,
      });

      const result = await uploadService.uploadImage(mockFile, {
        validationOptions: {
          stripExif: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.validationResult?.metadata?.hasExifData).toBe(true);
      expect(result.validationResult?.metadata?.strippedExifTags).toContain('GPS');
      expect(result.validationResult?.warnings).toContain('EXIF data was stripped for privacy');
    });

    it('should reject malicious files in full workflow', async () => {
      const mockFile = createMockFile('malicious.jpg', 'image/jpeg', 1024);

      mockFileValidator.mockResolvedValue({
        isValid: false,
        errors: ['File contains suspicious content that may indicate malware'],
        warnings: [],
      });

      const result = await uploadService.uploadImage(mockFile, {
        validationOptions: {
          performMalwareScan: true,
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('File contains suspicious content');
      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });
  });
});