import { v2 as cloudinary } from 'cloudinary';
import { fileValidator, type FileValidationResult, type ValidationOptions } from './file-validator';

// Configure Cloudinary if not already configured
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Types and Interfaces
export interface UploadProgress {
  uploadId: string;
  filename: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'cancelled';
  bytesUploaded: number;
  totalBytes: number;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface UploadOptions {
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: UploadError) => void;
  maxRetries?: number;
  quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
  maxWidth?: number;
  maxHeight?: number;
  allowedFormats?: string[];
  maxFileSize?: number; // in bytes
  // Enhanced validation options
  validationOptions?: ValidationOptions;
  skipValidation?: boolean;
}

export interface UploadResult {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
    size: number;
    filename: string;
    uploadId: string;
  };
  error?: string;
  uploadId: string;
  validationResult?: FileValidationResult;
}

export interface UploadError {
  code: string;
  message: string;
  uploadId: string;
  filename: string;
  recoverable: boolean;
}

// File validation constants
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

// Error codes
export const UPLOAD_ERROR_CODES = {
  FILE_TOO_LARGE: 'UPLOAD_001',
  INVALID_FILE_TYPE: 'UPLOAD_002',
  INVALID_FILE_FORMAT: 'UPLOAD_003',
  UPLOAD_FAILED: 'UPLOAD_004',
  QUOTA_EXCEEDED: 'UPLOAD_005',
  NETWORK_ERROR: 'UPLOAD_006',
  VALIDATION_FAILED: 'UPLOAD_007',
  CANCELLED: 'UPLOAD_008',
  RETRY_EXHAUSTED: 'UPLOAD_009'
} as const;

/**
 * Unified Upload Service with progress tracking and error handling
 */
export class UploadService {
  private activeUploads = new Map<string, UploadProgress>();
  private cancelledUploads = new Set<string>();

  /**
   * Upload a single image file with progress tracking
   */
  async uploadImage(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const uploadId = this.generateUploadId();
    const {
      folder = 'superbear_blog',
      onProgress,
      onError,
      maxRetries = 3,
      quality = 'auto',
      maxWidth = 1200,
      maxHeight = 1200,
      allowedFormats = ALLOWED_EXTENSIONS,
      maxFileSize = MAX_FILE_SIZE,
      validationOptions = {},
      skipValidation = false
    } = options;

    // Initialize progress tracking
    const progress: UploadProgress = {
      uploadId,
      filename: file.name,
      progress: 0,
      status: 'pending',
      bytesUploaded: 0,
      totalBytes: file.size,
      startTime: new Date()
    };

    this.activeUploads.set(uploadId, progress);
    this.notifyProgress(progress, onProgress);

    let validationResult: FileValidationResult | undefined;
    let fileToUpload = file;

    try {
      // Enhanced file validation
      if (!skipValidation) {
        const validationOpts: ValidationOptions = {
          maxSize: maxFileSize,
          maxWidth,
          maxHeight,
          allowedTypes: ALLOWED_MIME_TYPES,
          stripExif: true,
          performMalwareScan: true,
          ...validationOptions
        };

        validationResult = await fileValidator.validateFile(file, validationOpts);
        
        if (!validationResult.isValid) {
          throw new Error(`File validation failed: ${validationResult.errors.join(', ')}`);
        }

        // Use processed file if EXIF was stripped
        if (validationResult.processedFile) {
          fileToUpload = validationResult.processedFile;
        }

        // Log warnings if any
        if (validationResult.warnings.length > 0) {
          console.warn('File validation warnings:', validationResult.warnings);
        }
      } else {
        // Fallback to basic validation
        await this.validateFile(file, { allowedFormats, maxFileSize });
      }
      
      progress.status = 'uploading';
      progress.progress = 15;
      this.updateProgress(uploadId, progress);
      this.notifyProgress(progress, onProgress);

      // Convert file to base64 for upload (use processed file if available)
      const fileData = await this.fileToBase64(fileToUpload);
      
      progress.progress = 35;
      this.updateProgress(uploadId, progress);
      this.notifyProgress(progress, onProgress);

      // Check if upload was cancelled
      if (this.cancelledUploads.has(uploadId)) {
        throw new Error('Upload cancelled');
      }

      // Upload with retry mechanism
      const result = await this.uploadWithRetry(
        fileData,
        {
          folder,
          quality,
          maxWidth,
          maxHeight,
          filename: fileToUpload.name
        },
        maxRetries,
        uploadId,
        onProgress
      );

      progress.status = 'completed';
      progress.progress = 100;
      progress.endTime = new Date();
      this.updateProgress(uploadId, progress);
      this.notifyProgress(progress, onProgress);

      // Clean up
      this.activeUploads.delete(uploadId);
      this.cancelledUploads.delete(uploadId);

      return {
        success: true,
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          size: fileToUpload.size,
          filename: fileToUpload.name,
          uploadId
        },
        uploadId,
        validationResult
      };

    } catch (error) {
      progress.status = 'failed';
      progress.error = error instanceof Error ? error.message : 'Unknown error';
      progress.endTime = new Date();
      this.updateProgress(uploadId, progress);

      const uploadError: UploadError = {
        code: this.getErrorCode(error),
        message: progress.error,
        uploadId,
        filename: file.name,
        recoverable: this.isRecoverableError(error)
      };

      if (onError) {
        onError(uploadError);
      }

      // Clean up
      this.activeUploads.delete(uploadId);
      this.cancelledUploads.delete(uploadId);

      return {
        success: false,
        error: progress.error,
        uploadId,
        validationResult
      };
    }
  }

  /**
   * Upload multiple files concurrently
   */
  async uploadMultiple(files: File[], options: UploadOptions = {}): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Get upload progress for a specific upload
   */
  getUploadProgress(uploadId: string): UploadProgress | null {
    return this.activeUploads.get(uploadId) || null;
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(uploadId: string): void {
    this.cancelledUploads.add(uploadId);
    const progress = this.activeUploads.get(uploadId);
    if (progress) {
      progress.status = 'cancelled';
      progress.error = 'Upload cancelled by user';
      progress.endTime = new Date();
      this.updateProgress(uploadId, progress);
    }
  }

  /**
   * Get all active uploads
   */
  getActiveUploads(): UploadProgress[] {
    return Array.from(this.activeUploads.values());
  }

  // Private methods

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateFile(
    file: File, 
    options: { allowedFormats: string[]; maxFileSize: number }
  ): Promise<void> {
    // Check file size
    if (file.size > options.maxFileSize) {
      throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size ${(options.maxFileSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !options.allowedFormats.includes(extension)) {
      throw new Error(`File extension .${extension} is not allowed. Allowed extensions: ${options.allowedFormats.join(', ')}`);
    }

    // Additional security check - verify file header
    await this.validateFileHeader(file);
  }

  private async validateFileHeader(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);
        const header = Array.from(arr.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
        
        // Check for common image file signatures
        const validHeaders = [
          'ffd8ffe0', // JPEG
          'ffd8ffe1', // JPEG
          'ffd8ffe2', // JPEG
          '89504e47', // PNG
          '47494638', // GIF
          '52494646', // WEBP (RIFF)
        ];

        const isValid = validHeaders.some(validHeader => header.startsWith(validHeader));
        if (!isValid) {
          reject(new Error('Invalid file format - file header does not match expected image format'));
        } else {
          resolve();
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file header'));
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private async uploadWithRetry(
    fileData: string,
    uploadOptions: {
      folder: string;
      quality: string;
      maxWidth: number;
      maxHeight: number;
      filename: string;
    },
    maxRetries: number,
    uploadId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if upload was cancelled
        if (this.cancelledUploads.has(uploadId)) {
          throw new Error('Upload cancelled');
        }

        const result = await cloudinary.uploader.upload(fileData, {
          folder: uploadOptions.folder,
          resource_type: 'image',
          public_id: `${uploadOptions.folder}/${Date.now()}_${uploadOptions.filename.replace(/\.[^/.]+$/, "")}`,
          transformation: [
            { quality: uploadOptions.quality, fetch_format: 'auto' },
            { width: uploadOptions.maxWidth, height: uploadOptions.maxHeight, crop: 'limit' },
          ],
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed');
        
        if (attempt < maxRetries && this.isRetryableError(error)) {
          // Update progress to show retry
          const progress = this.activeUploads.get(uploadId);
          if (progress) {
            progress.progress = 30 + (attempt * 20); // Increment progress with each retry
            this.updateProgress(uploadId, progress);
            this.notifyProgress(progress, onProgress);
          }

          // Wait before retry with exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('Upload failed after all retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateProgress(uploadId: string, progress: UploadProgress): void {
    this.activeUploads.set(uploadId, { ...progress });
  }

  private notifyProgress(progress: UploadProgress, callback?: (progress: UploadProgress) => void): void {
    if (callback) {
      callback({ ...progress });
    }
  }

  private getErrorCode(error: any): string {
    if (error?.message?.includes('File size')) return UPLOAD_ERROR_CODES.FILE_TOO_LARGE;
    if (error?.message?.includes('File type') || error?.message?.includes('file format')) return UPLOAD_ERROR_CODES.INVALID_FILE_TYPE;
    if (error?.message?.includes('cancelled')) return UPLOAD_ERROR_CODES.CANCELLED;
    if (error?.http_code === 420) return UPLOAD_ERROR_CODES.QUOTA_EXCEEDED;
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') return UPLOAD_ERROR_CODES.NETWORK_ERROR;
    return UPLOAD_ERROR_CODES.UPLOAD_FAILED;
  }

  private isRecoverableError(error: any): boolean {
    const code = this.getErrorCode(error);
    return ![
      UPLOAD_ERROR_CODES.FILE_TOO_LARGE,
      UPLOAD_ERROR_CODES.INVALID_FILE_TYPE,
      UPLOAD_ERROR_CODES.INVALID_FILE_FORMAT,
      UPLOAD_ERROR_CODES.CANCELLED
    ].includes(code);
  }

  private isRetryableError(error: any): boolean {
    const code = this.getErrorCode(error);
    return [
      UPLOAD_ERROR_CODES.NETWORK_ERROR,
      UPLOAD_ERROR_CODES.UPLOAD_FAILED
    ].includes(code) && !error?.message?.includes('cancelled');
  }
}

// Export singleton instance
export const uploadService = new UploadService();