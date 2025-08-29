'use client';

import { useCallback } from 'react';
import { mediaTracker } from '@/lib/media/media-tracker';

export interface MediaTrackingOptions {
  contentType: 'article' | 'newsletter' | 'podcast';
  contentId?: string;
  onError?: (error: Error) => void;
  onSuccess?: (result: { added: number; removed: number; total: number }) => void;
}

/**
 * Hook for tracking media references in content
 */
export function useMediaTracking() {
  /**
   * Update content references for a specific content item
   */
  const updateContentReferences = useCallback(
    async (
      content: string,
      options: MediaTrackingOptions
    ): Promise<{ added: number; removed: number; total: number } | null> => {
      if (!options.contentId) {
        console.warn('Cannot track media references without contentId');
        return null;
      }

      try {
        const result = await mediaTracker.updateContentReferences(
          options.contentType,
          options.contentId,
          content,
          'content'
        );

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        const trackingError = error instanceof Error ? error : new Error('Failed to track media references');
        
        if (options.onError) {
          options.onError(trackingError);
        } else {
          console.error('Media tracking error:', trackingError);
        }

        return null;
      }
    },
    []
  );

  /**
   * Update cover image reference for a specific content item
   */
  const updateCoverImageReference = useCallback(
    async (
      imageUrl: string | null,
      options: MediaTrackingOptions
    ): Promise<{ added: number; removed: number; total: number } | null> => {
      if (!options.contentId) {
        console.warn('Cannot track cover image reference without contentId');
        return null;
      }

      try {
        const content = imageUrl 
          ? `<img src="${imageUrl}" data-reference-type="cover" />`
          : '';

        const result = await mediaTracker.updateContentReferences(
          options.contentType,
          options.contentId,
          content,
          'cover_image'
        );

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        const trackingError = error instanceof Error ? error : new Error('Failed to track cover image reference');
        
        if (options.onError) {
          options.onError(trackingError);
        } else {
          console.error('Cover image tracking error:', trackingError);
        }

        return null;
      }
    },
    []
  );

  /**
   * Extract image references from content
   */
  const extractImageReferences = useCallback((content: string): string[] => {
    return mediaTracker.extractImageReferences(content);
  }, []);

  /**
   * Validate that all image references in content exist
   */
  const validateImageReferences = useCallback(
    async (content: string): Promise<{
      valid: boolean;
      missingImages: string[];
      totalImages: number;
    }> => {
      try {
        const publicIds = mediaTracker.extractImageReferences(content);
        const missingImages: string[] = [];

        // Check each image reference
        for (const publicId of publicIds) {
          try {
            const usage = await mediaTracker.getMediaUsage(publicId);
            // If no usage data is found, the image might not exist in our system
            if (usage.totalReferences === 0 && usage.isOrphaned) {
              // Double-check by trying to get media files
              const mediaFiles = await mediaTracker.getMediaFiles({
                limit: 1,
                offset: 0,
              });
              
              const exists = mediaFiles.media.some(media => media.publicId === publicId);
              if (!exists) {
                missingImages.push(publicId);
              }
            }
          } catch (error) {
            // If we can't get usage info, assume the image is missing
            missingImages.push(publicId);
          }
        }

        return {
          valid: missingImages.length === 0,
          missingImages,
          totalImages: publicIds.length,
        };
      } catch (error) {
        console.error('Failed to validate image references:', error);
        return {
          valid: false,
          missingImages: [],
          totalImages: 0,
        };
      }
    },
    []
  );

  /**
   * Clean up references for deleted content
   */
  const cleanupContentReferences = useCallback(
    async (options: MediaTrackingOptions): Promise<boolean> => {
      if (!options.contentId) {
        console.warn('Cannot cleanup references without contentId');
        return false;
      }

      try {
        // Remove all references for this content
        await Promise.all([
          mediaTracker.updateContentReferences(
            options.contentType,
            options.contentId,
            '',
            'content'
          ),
          mediaTracker.updateContentReferences(
            options.contentType,
            options.contentId,
            '',
            'cover_image'
          ),
        ]);

        return true;
      } catch (error) {
        const trackingError = error instanceof Error ? error : new Error('Failed to cleanup content references');
        
        if (options.onError) {
          options.onError(trackingError);
        } else {
          console.error('Cleanup error:', trackingError);
        }

        return false;
      }
    },
    []
  );

  return {
    updateContentReferences,
    updateCoverImageReference,
    extractImageReferences,
    validateImageReferences,
    cleanupContentReferences,
  };
}

/**
 * Hook for tracking media uploads
 */
export function useMediaUploadTracking() {
  /**
   * Track a completed upload
   */
  const trackUpload = useCallback(
    async (
      uploadResult: {
        url: string;
        publicId: string;
        width: number;
        height: number;
        format: string;
        size: number;
        filename: string;
      },
      context: {
        contentType?: 'article' | 'newsletter' | 'podcast';
        contentId?: string;
        referenceContext?: 'content' | 'cover_image' | 'thumbnail';
        uploadedBy?: string;
      } = {}
    ) => {
      try {
        const mediaRecord = await mediaTracker.trackUpload(uploadResult, context);
        return mediaRecord;
      } catch (error) {
        console.error('Failed to track upload:', error);
        throw error;
      }
    },
    []
  );

  return {
    trackUpload,
  };
}