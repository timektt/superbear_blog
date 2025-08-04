import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export interface CloudinaryError {
  message: string;
  http_code?: number;
}

/**
 * Upload an image to Cloudinary
 * @param file - The file buffer or base64 string
 * @param folder - Optional folder to organize uploads
 * @returns Promise with upload result
 */
export async function uploadImage(
  file: string | Buffer,
  folder: string = 'superbear_blog'
): Promise<CloudinaryUploadResult> {
  try {
    // Convert Buffer to base64 data URL if needed
    const fileData = Buffer.isBuffer(file)
      ? `data:image/jpeg;base64,${file.toString('base64')}`
      : file;

    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 1200, height: 630, crop: 'limit' },
      ],
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to upload image'
    );
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise with deletion result
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to delete image'
    );
  }
}

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
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality,
    fetch_format: 'auto',
  });
}

export default cloudinary;
