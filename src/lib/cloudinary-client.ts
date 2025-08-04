/**
 * Client-side Cloudinary utilities
 * These functions don't require the Cloudinary SDK and can be used in browser environments
 */

/**
 * Generate optimized image URL with transformations
 * @param publicId - The public ID of the image
 * @param width - Desired width
 * @param height - Desired height
 * @param quality - Image quality (auto, best, good, eco, low)
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  width?: number,
  height?: number,
  quality: string = 'auto'
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';

  const transformations = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width && height) transformations.push('c_fill');
  transformations.push(`q_${quality}`);
  transformations.push('f_auto');

  const transformString = transformations.join(',');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - Full Cloudinary URL
 * @returns Public ID or null if not a valid Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  const cloudinaryPattern = /\/v\d+\/(.+)\.[a-zA-Z]+$/;
  const match = url.match(cloudinaryPattern);
  return match ? match[1] : null;
}
