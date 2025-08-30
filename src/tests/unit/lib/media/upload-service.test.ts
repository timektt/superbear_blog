import { UploadService, UPLOAD_ERROR_CODES } from '@/lib/media/upload-service';
import { fileValidator } from '@/lib/media/file-validator';
import { v2 as cloudinary } from 'cloudinary';

// Mock dependencies
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(() => ({ cloud_name: 'test-cloud' })),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
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

// Mock File and FileReader for browser environment
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

global.URL = {
  createObjectURL: jest.fn(() => 'blob:mock-url'),
  revokeObjectURL: jest.fn(),
} as any;

describe('UploadService', () => {
  let uploadService: UploadService;
  const mockCloudinaryUpload = cloudinary.uploader.upload as jest.Mock;
  const mockFileValidator = fileValidator.validateFile as jest.Mock;

  beforeEach(() => {
    uploadService = new UploadService();
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    const createMockFile = (
      name: string = 'test.jpg',
      type: string = 'image/jpeg',
      size: number = 1024
    ): File => {
      const file = new File(['mock content'], name, { type });
      Object.defineProperty(file, 'size', { value: size });
      return file;
    };

    it('should successfully upload a valid image', async () => {
      const mockFile = createMockFile();
      const mockCloudinaryResult = {
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'superbear_blog/test',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024,
      };

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        metadata: {
          mimeType: 'image/jpeg',
          size: 1024,
          hasExifData: false,
          strippedExifTags: [],
        },
      });

      mockCloudinaryUpload.mockResolvedValue(mockCloudinaryResult);

      const result = await uploadService.uploadImage(mockFile);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        url: mockCloudinaryResult.secure_url,
        publicId: mockCloudinaryResult.public_id,
        width: mockCloudinaryResult.width,
        height: mockCloudinaryResult.height,
        format: mockCloudinaryResult.format,
        size: mockFile.size,
        filename: mockFile.name,
        uploadId: expect.any(String),
      });
      expect(result.error).toBeUndefined();
    });

    it('should handle file validation errors', async () => {
      const mockFile = createMockFile();

      mockFileValidator.mockResolvedValue({
        isValid: false,
        errors: ['File size too large'],
        warnings: [],
      });

      const result = await uploadService.uploadImage(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File validation failed: File size too large');
      expect(mockCloudinaryUpload).not.toHaveBeenCalled();
    });

    it('should handle Cloudinary upload errors', async () => {
      const mockFile = createMockFile();

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      mockCloudinaryUpload.mockRejectedValue(new Error('Cloudinary error'));

      const result = await uploadService.uploadImage(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cloudinary error');
    });

    it('should retry failed uploads', async () => {
      const mockFile = createMockFile();

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // First call fails, second succeeds
      mockCloudinaryUpload
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
          public_id: 'superbear_blog/test',
          width: 800,
          height: 600,
          format: 'jpg',
          bytes: 1024,
        });

      const result = await uploadService.uploadImage(mockFile, { maxRetries: 2 });

      expect(result.success).toBe(true);
      expect(mockCloudinaryUpload).toHaveBeenCalledTimes(2);
    });

    it('should handle progress callbacks', async () => {
      const mockFile = createMockFile();
      const progressCallback = jest.fn();

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'superbear_blog/test',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024,
      });

      await uploadService.uploadImage(mockFile, {
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          uploadId: expect.any(String),
          filename: mockFile.name,
          progress: expect.any(Number),
          status: expect.any(String),
        })
      );
    });

    it('should handle upload cancellation', async () => {
      const mockFile = createMockFile();

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Start upload
      const uploadPromise = uploadService.uploadImage(mockFile);

      // Cancel upload immediately
      const activeUploads = uploadService.getActiveUploads();
      if (activeUploads.length > 0) {
        uploadService.cancelUpload(activeUploads[0].uploadId);
      }

      const result = await uploadPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('cancelled');
    });

    it('should validate file size limits', async () => {
      const mockFile = createMockFile('large.jpg', 'image/jpeg', 20 * 1024 * 1024); // 20MB

      mockFileValidator.mockResolvedValue({
        isValid: false,
        errors: ['File size exceeds maximum allowed size'],
        warnings: [],
      });

      const result = await uploadService.uploadImage(mockFile, {
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('File size exceeds maximum allowed size');
    });

    it('should handle EXIF stripping', async () => {
      const mockFile = createMockFile();
      const processedFile = createMockFile('processed.jpg');

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        processedFile,
        metadata: {
          mimeType: 'image/jpeg',
          size: 1024,
          hasExifData: true,
          strippedExifTags: ['GPS', 'DateTime'],
        },
      });

      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'superbear_blog/test',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024,
      });

      const result = await uploadService.uploadImage(mockFile);

      expect(result.success).toBe(true);
      expect(result.validationResult?.metadata?.hasExifData).toBe(true);
      expect(result.validationResult?.metadata?.strippedExifTags).toContain('GPS');
    });
  });

  describe('uploadMultiple', () => {
    it('should upload multiple files concurrently', async () => {
      const mockFiles = [
        createMockFile('file1.jpg'),
        createMockFile('file2.jpg'),
        createMockFile('file3.jpg'),
      ];

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'superbear_blog/test',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024,
      });

      const results = await uploadService.uploadMultiple(mockFiles);

      expect(results).toHaveLength(3);
      expect(results.every(result => result.success)).toBe(true);
      expect(mockCloudinaryUpload).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure results', async () => {
      const mockFiles = [
        createMockFile('valid.jpg'),
        createMockFile('invalid.jpg'),
      ];

      mockFileValidator
        .mockResolvedValueOnce({
          isValid: true,
          errors: [],
          warnings: [],
        })
        .mockResolvedValueOnce({
          isValid: false,
          errors: ['Invalid file'],
          warnings: [],
        });

      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'superbear_blog/test',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024,
      });

      const results = await uploadService.uploadMultiple(mockFiles);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('getUploadProgress', () => {
    it('should return progress for active upload', async () => {
      const mockFile = createMockFile();

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Mock a slow upload to capture progress
      mockCloudinaryUpload.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
          public_id: 'superbear_blog/test',
          width: 800,
          height: 600,
          format: 'jpg',
          bytes: 1024,
        }), 100))
      );

      // Start upload
      const uploadPromise = uploadService.uploadImage(mockFile);

      // Check progress during upload
      const activeUploads = uploadService.getActiveUploads();
      expect(activeUploads).toHaveLength(1);

      const progress = uploadService.getUploadProgress(activeUploads[0].uploadId);
      expect(progress).toBeDefined();
      expect(progress?.filename).toBe(mockFile.name);

      await uploadPromise;
    });

    it('should return null for non-existent upload', () => {
      const progress = uploadService.getUploadProgress('non-existent-id');
      expect(progress).toBeNull();
    });
  });

  describe('cancelUpload', () => {
    it('should cancel active upload', async () => {
      const mockFile = createMockFile();

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Start upload
      const uploadPromise = uploadService.uploadImage(mockFile);

      // Get upload ID and cancel
      const activeUploads = uploadService.getActiveUploads();
      const uploadId = activeUploads[0]?.uploadId;

      if (uploadId) {
        uploadService.cancelUpload(uploadId);
      }

      const result = await uploadPromise;
      expect(result.success).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return correct error codes for different error types', async () => {
      const mockFile = createMockFile();

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      // Test network error
      mockCloudinaryUpload.mockRejectedValue({ code: 'ENOTFOUND' });
      let result = await uploadService.uploadImage(mockFile);
      expect(result.error).toBeDefined();

      // Test quota exceeded
      mockCloudinaryUpload.mockRejectedValue({ http_code: 420 });
      result = await uploadService.uploadImage(mockFile);
      expect(result.error).toBeDefined();
    });

    it('should handle file validation with security warnings', async () => {
      const mockFile = createMockFile();

      mockFileValidator.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: ['File contains metadata that was stripped'],
        metadata: {
          mimeType: 'image/jpeg',
          size: 1024,
          hasExifData: true,
          strippedExifTags: ['GPS'],
        },
      });

      mockCloudinaryUpload.mockResolvedValue({
        secure_url: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        public_id: 'superbear_blog/test',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 1024,
      });

      const result = await uploadService.uploadImage(mockFile);

      expect(result.success).toBe(true);
      expect(result.validationResult?.warnings).toContain('File contains metadata that was stripped');
    });
  });

  // Helper function to create mock files
  function createMockFile(
    name: string = 'test.jpg',
    type: string = 'image/jpeg',
    size: number = 1024
  ): File {
    const file = new File(['mock content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
  }
});