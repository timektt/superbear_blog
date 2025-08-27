/**
 * Cloudinary cleanup utilities for automatic image removal
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Handle different Cloudinary URL formats
    const patterns = [
      // Standard format: https://res.cloudinary.com/cloud/image/upload/v123456/folder/image.jpg
      /\/v\d+\/(.+?)(?:\.[^.]+)?$/,
      // Without version: https://res.cloudinary.com/cloud/image/upload/folder/image.jpg
      /\/upload\/(.+?)(?:\.[^.]+)?$/,
      // With transformations: https://res.cloudinary.com/cloud/image/upload/c_fill,w_300/v123456/folder/image.jpg
      /\/upload\/[^/]*\/v\d+\/(.+?)(?:\.[^.]+)?$/,
      /\/upload\/[^/]*\/(.+?)(?:\.[^.]+)?$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}

/**
 * Delete a single image from Cloudinary
 */
export async function deleteCloudinaryImage(
  publicId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!publicId) {
      return { success: false, error: 'Public ID is required' };
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      console.log(`Successfully deleted image: ${publicId}`);
      return { success: true };
    } else {
      console.warn(
        `Failed to delete image: ${publicId}, result: ${result.result}`
      );
      return { success: false, error: `Deletion failed: ${result.result}` };
    }
  } catch (error) {
    console.error(`Error deleting image ${publicId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete image by URL
 */
export async function deleteCloudinaryImageByUrl(
  url: string
): Promise<{ success: boolean; error?: string }> {
  const publicId = extractPublicIdFromUrl(url);

  if (!publicId) {
    return { success: false, error: 'Could not extract public ID from URL' };
  }

  return deleteCloudinaryImage(publicId);
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleCloudinaryImages(
  publicIds: string[]
): Promise<{
  success: boolean;
  results: Array<{ publicId: string; success: boolean; error?: string }>;
  totalDeleted: number;
}> {
  const results = [];
  let totalDeleted = 0;

  for (const publicId of publicIds) {
    const result = await deleteCloudinaryImage(publicId);
    results.push({ publicId, ...result });

    if (result.success) {
      totalDeleted++;
    }
  }

  return {
    success: totalDeleted === publicIds.length,
    results,
    totalDeleted,
  };
}

/**
 * Delete multiple images by URLs
 */
export async function deleteMultipleCloudinaryImagesByUrls(
  urls: string[]
): Promise<{
  success: boolean;
  results: Array<{
    url: string;
    publicId?: string;
    success: boolean;
    error?: string;
  }>;
  totalDeleted: number;
}> {
  const results = [];
  let totalDeleted = 0;

  for (const url of urls) {
    const publicId = extractPublicIdFromUrl(url);

    if (!publicId) {
      results.push({
        url,
        success: false,
        error: 'Could not extract public ID from URL',
      });
      continue;
    }

    const result = await deleteCloudinaryImage(publicId);
    results.push({ url, publicId, ...result });

    if (result.success) {
      totalDeleted++;
    }
  }

  return {
    success: totalDeleted === urls.length,
    results,
    totalDeleted,
  };
}

/**
 * Extract all Cloudinary URLs from article content
 */
export function extractCloudinaryUrlsFromContent(content: any): string[] {
  const urls: string[] = [];

  try {
    // Handle Tiptap JSON content
    if (typeof content === 'object' && content !== null) {
      const extractFromNode = (node: any) => {
        if (node.type === 'image' && node.attrs?.src) {
          const src = node.attrs.src;
          if (src.includes('cloudinary.com')) {
            urls.push(src);
          }
        }

        if (node.content && Array.isArray(node.content)) {
          node.content.forEach(extractFromNode);
        }
      };

      if (content.content && Array.isArray(content.content)) {
        content.content.forEach(extractFromNode);
      }
    }

    // Handle HTML content
    if (typeof content === 'string') {
      const imgRegex = /<img[^>]+src="([^"]*cloudinary\.com[^"]*)"/g;
      let match;

      while ((match = imgRegex.exec(content)) !== null) {
        urls.push(match[1]);
      }
    }
  } catch (error) {
    console.error('Error extracting Cloudinary URLs from content:', error);
  }

  return urls;
}

/**
 * Clean up images associated with an article
 */
export async function cleanupArticleImages(article: {
  image?: string | null;
  content: any;
}): Promise<{
  success: boolean;
  deletedImages: string[];
  errors: Array<{ url: string; error: string }>;
}> {
  const imagesToDelete: string[] = [];
  const deletedImages: string[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  // Add featured image if it exists
  if (article.image && article.image.includes('cloudinary.com')) {
    imagesToDelete.push(article.image);
  }

  // Extract images from content
  const contentImages = extractCloudinaryUrlsFromContent(article.content);
  imagesToDelete.push(...contentImages);

  // Remove duplicates
  const uniqueImages = [...new Set(imagesToDelete)];

  if (uniqueImages.length === 0) {
    return { success: true, deletedImages: [], errors: [] };
  }

  // Delete images
  for (const imageUrl of uniqueImages) {
    const result = await deleteCloudinaryImageByUrl(imageUrl);

    if (result.success) {
      deletedImages.push(imageUrl);
    } else {
      errors.push({ url: imageUrl, error: result.error || 'Unknown error' });
    }
  }

  return {
    success: errors.length === 0,
    deletedImages,
    errors,
  };
}

/**
 * Batch cleanup for multiple articles
 */
export async function batchCleanupArticleImages(
  articles: Array<{ id: string; image?: string | null; content: any }>
): Promise<{
  success: boolean;
  totalArticles: number;
  totalImagesDeleted: number;
  results: Array<{
    articleId: string;
    deletedImages: string[];
    errors: Array<{ url: string; error: string }>;
  }>;
}> {
  const results = [];
  let totalImagesDeleted = 0;

  for (const article of articles) {
    const cleanup = await cleanupArticleImages(article);

    results.push({
      articleId: article.id,
      deletedImages: cleanup.deletedImages,
      errors: cleanup.errors,
    });

    totalImagesDeleted += cleanup.deletedImages.length;
  }

  const totalErrors = results.reduce(
    (sum, result) => sum + result.errors.length,
    0
  );

  return {
    success: totalErrors === 0,
    totalArticles: articles.length,
    totalImagesDeleted,
    results,
  };
}

/**
 * Validate Cloudinary configuration
 */
export function validateCloudinaryConfig(): { valid: boolean; error?: string } {
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      return {
        valid: false,
        error: `Missing required environment variable: ${envVar}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get Cloudinary usage statistics
 */
export async function getCloudinaryUsage(): Promise<{
  success: boolean;
  usage?: {
    resources: number;
    bandwidth: number;
    storage: number;
  };
  error?: string;
}> {
  try {
    const result = await cloudinary.api.usage();

    return {
      success: true,
      usage: {
        resources: result.resources || 0,
        bandwidth: result.bandwidth?.usage || 0,
        storage: result.storage?.usage || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching Cloudinary usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
