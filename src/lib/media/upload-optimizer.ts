import { uploadService, type UploadOptions, type UploadResult } from './upload-service';
import { mediaCache } from './media-cache';
import { logger } from '../logger';

export interface CompressionOptions {
  quality: number; // 0.1 to 1.0
  maxWidth: number;
  maxHeight: number;
  format?: 'jpeg' | 'webp' | 'png';
  enableResize: boolean;
}

export interface ChunkedUploadOptions extends UploadOptions {
  chunkSize?: number; // in bytes
  enableCompression?: boolean;
  compressionOptions?: CompressionOptions;
  enableParallelProcessing?: boolean;
  maxConcurrentUploads?: number;
}

export interface OptimizedUploadResult extends UploadResult {
  compressionRatio?: number;
  originalSize: number;
  optimizedSize: number;
  processingTime: number;
}

/**
 * Client-side image compression utility
 */
export class ImageCompressor {
  /**
   * Compress an image file on the client side
   */
  static async compressImage(file: File, options: CompressionOptions): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (options.enableResize) {
            const ratio = Math.min(
              options.maxWidth / width,
              options.maxHeight / height,
              1 // Don't upscale
            );
            
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new file with compressed data
              const compressedFile = new File(
                [blob],
                file.name,
                {
                  type: blob.type,
                  lastModified: Date.now(),
                }
              );

              resolve(compressedFile);
            },
            options.format ? `image/${options.format}` : file.type,
            options.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get optimal compression settings based on file size and type
   */
  static getOptimalCompressionSettings(file: File): CompressionOptions {
    const sizeInMB = file.size / (1024 * 1024);
    
    // Aggressive compression for large files
    if (sizeInMB > 5) {
      return {
        quality: 0.7,
        maxWidth: 1200,
        maxHeight: 1200,
        format: 'jpeg',
        enableResize: true,
      };
    }
    
    // Moderate compression for medium files
    if (sizeInMB > 2) {
      return {
        quality: 0.8,
        maxWidth: 1600,
        maxHeight: 1600,
        format: file.type.includes('png') ? 'png' : 'jpeg',
        enableResize: true,
      };
    }
    
    // Light compression for small files
    return {
      quality: 0.9,
      maxWidth: 2000,
      maxHeight: 2000,
      enableResize: false,
    };
  }
}

/**
 * Chunked upload handler for large files
 */
export class ChunkedUploader {
  private static readonly DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB chunks

  /**
   * Upload large file in chunks
   */
  static async uploadInChunks(
    file: File,
    options: ChunkedUploadOptions = {}
  ): Promise<OptimizedUploadResult> {
    const startTime = Date.now();
    const originalSize = file.size;
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;

    // For files smaller than chunk size, use regular upload
    if (file.size <= chunkSize) {
      return this.uploadWithOptimizations(file, options, startTime, originalSize);
    }

    try {
      // For now, we'll use Cloudinary's built-in chunked upload
      // In a full implementation, you'd implement custom chunking
      logger.info('Using optimized upload for large file', {
        filename: file.name,
        size: file.size,
        chunkSize,
      });

      return this.uploadWithOptimizations(file, options, startTime, originalSize);
    } catch (error) {
      logger.error('Chunked upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload with all optimizations applied
   */
  private static async uploadWithOptimizations(
    file: File,
    options: ChunkedUploadOptions,
    startTime: number,
    originalSize: number
  ): Promise<OptimizedUploadResult> {
    let processedFile = file;
    let compressionRatio = 1;

    // Apply client-side compression if enabled
    if (options.enableCompression !== false) {
      try {
        const compressionOptions = options.compressionOptions || 
          ImageCompressor.getOptimalCompressionSettings(file);
        
        processedFile = await ImageCompressor.compressImage(file, compressionOptions);
        compressionRatio = originalSize / processedFile.size;
        
        logger.info('Image compressed', {
          originalSize,
          compressedSize: processedFile.size,
          compressionRatio,
        });
      } catch (error) {
        logger.warn('Image compression failed, using original file:', error);
      }
    }

    // Upload the processed file
    const result = await uploadService.uploadImage(processedFile, options);
    const processingTime = Date.now() - startTime;

    return {
      ...result,
      compressionRatio,
      originalSize,
      optimizedSize: processedFile.size,
      processingTime,
    };
  }
}

/**
 * Parallel upload processor for multiple files
 */
export class ParallelUploadProcessor {
  private static readonly DEFAULT_MAX_CONCURRENT = 3;

  /**
   * Process multiple uploads in parallel with concurrency control
   */
  static async processMultipleUploads(
    files: File[],
    options: ChunkedUploadOptions = {}
  ): Promise<OptimizedUploadResult[]> {
    const maxConcurrent = options.maxConcurrentUploads || this.DEFAULT_MAX_CONCURRENT;
    const results: OptimizedUploadResult[] = [];
    
    // Process files in batches
    for (let i = 0; i < files.length; i += maxConcurrent) {
      const batch = files.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (file) => {
        try {
          return await ChunkedUploader.uploadInChunks(file, options);
        } catch (error) {
          logger.error('Upload failed for file:', file.name, error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
            uploadId: `failed_${Date.now()}`,
            originalSize: file.size,
            optimizedSize: file.size,
            processingTime: 0,
          } as OptimizedUploadResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Update progress cache for each completed upload
      batchResults.forEach(result => {
        if (result.success && result.data) {
          mediaCache.cacheUploadProgress(result.uploadId, {
            uploadId: result.uploadId,
            progress: 100,
            status: 'completed',
            result: {
              publicId: result.data.publicId,
              url: result.data.url,
              size: result.data.size,
            },
          });
        }
      });
    }

    return results;
  }

  /**
   * Get upload statistics for monitoring
   */
  static getUploadStats(results: OptimizedUploadResult[]): {
    totalFiles: number;
    successfulUploads: number;
    failedUploads: number;
    totalOriginalSize: number;
    totalOptimizedSize: number;
    averageCompressionRatio: number;
    totalProcessingTime: number;
  } {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalOptimizedSize = results.reduce((sum, r) => sum + r.optimizedSize, 0);
    const totalProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0);
    
    const compressionRatios = successful
      .filter(r => r.compressionRatio)
      .map(r => r.compressionRatio!);
    
    const averageCompressionRatio = compressionRatios.length > 0
      ? compressionRatios.reduce((sum, ratio) => sum + ratio, 0) / compressionRatios.length
      : 1;

    return {
      totalFiles: results.length,
      successfulUploads: successful.length,
      failedUploads: failed.length,
      totalOriginalSize,
      totalOptimizedSize,
      averageCompressionRatio,
      totalProcessingTime,
    };
  }
}

/**
 * Cloudinary optimization settings
 */
export class CloudinaryOptimizer {
  /**
   * Get optimized Cloudinary transformation settings
   */
  static getOptimizedTransformations(options: {
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    width?: number;
    height?: number;
    crop?: 'limit' | 'scale' | 'fit' | 'fill';
  } = {}) {
    return {
      quality: options.quality || 'auto',
      fetch_format: options.format || 'auto',
      flags: ['progressive', 'immutable_cache'],
      width: options.width,
      height: options.height,
      crop: options.crop || 'limit',
      // Enable automatic optimization
      dpr: 'auto',
      responsive: true,
      // Optimize for web delivery
      if: 'w_gt_300',
      then: { quality: 'auto:good' },
      else: { quality: 'auto:best' },
    };
  }

  /**
   * Get responsive breakpoint settings
   */
  static getResponsiveBreakpoints() {
    return {
      create_derived: true,
      bytes_step: 20000,
      min_width: 200,
      max_width: 1200,
      max_images: 5,
    };
  }
}

/**
 * Main optimized upload service
 */
export class OptimizedUploadService {
  /**
   * Upload single file with all optimizations
   */
  static async uploadOptimized(
    file: File,
    options: ChunkedUploadOptions = {}
  ): Promise<OptimizedUploadResult> {
    // Enable compression by default
    const optimizedOptions = {
      enableCompression: true,
      ...options,
    };

    return ChunkedUploader.uploadInChunks(file, optimizedOptions);
  }

  /**
   * Upload multiple files with parallel processing
   */
  static async uploadMultipleOptimized(
    files: File[],
    options: ChunkedUploadOptions = {}
  ): Promise<OptimizedUploadResult[]> {
    // Enable parallel processing by default
    const optimizedOptions = {
      enableCompression: true,
      enableParallelProcessing: true,
      maxConcurrentUploads: 3,
      ...options,
    };

    return ParallelUploadProcessor.processMultipleUploads(files, optimizedOptions);
  }

  /**
   * Preload and cache frequently accessed images
   */
  static async preloadImages(publicIds: string[]): Promise<void> {
    try {
      // This would implement image preloading logic
      // For now, we'll just log the intent
      logger.info('Preloading images:', publicIds);
    } catch (error) {
      logger.error('Failed to preload images:', error);
    }
  }
}

// Export the main service
export const optimizedUploadService = OptimizedUploadService;