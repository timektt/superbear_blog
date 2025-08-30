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
  bytes?: number;
  created_at?: string;
  etag?: string;
  folder?: string;
  original_filename?: string;
  tags?: string[];
  context?: Record<string, string>;
}

export interface CloudinaryMetadata {
  public_id: string;
  format: string;
  version: number;
  resource_type: string;
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  folder: string;
  original_filename: string;
  tags: string[];
  context: Record<string, string>;
  image_metadata: Record<string, any>;
  colors: Array<{ hex: string; percentage: number }>;
  predominant: { hex: string; percentage: number };
}

export interface CloudinaryTransformationOptions {
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'limit' | 'fill' | 'pad' | 'crop';
  quality?: 'auto' | 'best' | 'good' | 'eco' | 'low' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  background?: string;
  dpr?: number;
}

export interface CloudinaryError {
  message: string;
  http_code?: number;
}

/**
 * Upload an image to Cloudinary with enhanced metadata tracking
 * @param file - The file buffer or base64 string
 * @param options - Upload options including folder, tags, context, and transformations
 * @returns Promise with upload result including metadata
 */
export async function uploadImage(
  file: string | Buffer,
  options: {
    folder?: string;
    filename?: string;
    tags?: string[];
    context?: Record<string, string>;
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low';
    maxWidth?: number;
    maxHeight?: number;
    extractMetadata?: boolean;
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    const {
      folder = 'superbear_blog',
      filename,
      tags = [],
      context = {},
      quality = 'auto',
      maxWidth = 1200,
      maxHeight = 1200,
      extractMetadata = true
    } = options;

    // Convert Buffer to base64 data URL if needed
    const fileData = Buffer.isBuffer(file)
      ? `data:image/jpeg;base64,${file.toString('base64')}`
      : file;

    // Generate public_id with timestamp and filename if provided
    const publicId = filename 
      ? `${folder}/${Date.now()}_${filename.replace(/\.[^/.]+$/, "")}`
      : undefined;

    const uploadOptions: any = {
      folder,
      resource_type: 'image',
      public_id: publicId,
      tags: [...tags, 'superbear_blog', 'auto_uploaded'],
      context: {
        ...context,
        uploaded_at: new Date().toISOString(),
        source: 'media_management_system'
      },
      transformation: [
        { quality, fetch_format: 'auto' },
        { width: maxWidth, height: maxHeight, crop: 'limit' },
      ],
      image_metadata: extractMetadata,
      colors: extractMetadata,
      phash: extractMetadata,
    };

    const result = await cloudinary.uploader.upload(fileData, uploadOptions);

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      created_at: result.created_at,
      etag: result.etag,
      folder: result.folder,
      original_filename: result.original_filename,
      tags: result.tags,
      context: result.context,
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
 * Get detailed metadata for an uploaded image
 * @param publicId - The public ID of the image
 * @returns Promise with detailed metadata
 */
export async function getImageMetadata(publicId: string): Promise<CloudinaryMetadata> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      image_metadata: true,
      colors: true,
      phash: true,
    });

    return {
      public_id: result.public_id,
      format: result.format,
      version: result.version,
      resource_type: result.resource_type,
      type: result.type,
      created_at: result.created_at,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      folder: result.folder || '',
      original_filename: result.original_filename || '',
      tags: result.tags || [],
      context: result.context || {},
      image_metadata: result.image_metadata || {},
      colors: result.colors || [],
      predominant: result.predominant || { hex: '#000000', percentage: 0 },
    };
  } catch (error) {
    console.error('Failed to get image metadata:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to get image metadata'
    );
  }
}

/**
 * Generate optimized image URL with advanced transformations
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: CloudinaryTransformationOptions = {}
): string {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'auto',
    background,
    dpr = 1
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
    gravity,
    background,
    dpr,
    secure: true,
  });
}

/**
 * Generate multiple image variants for responsive design
 * @param publicId - The public ID of the image
 * @param breakpoints - Array of widths for different breakpoints
 * @param options - Base transformation options
 * @returns Object with URLs for different breakpoints
 */
export function getResponsiveImageUrls(
  publicId: string,
  breakpoints: number[] = [320, 640, 768, 1024, 1280, 1536],
  options: Omit<CloudinaryTransformationOptions, 'width'> = {}
): Record<string, string> {
  const urls: Record<string, string> = {};
  
  breakpoints.forEach(width => {
    urls[`w${width}`] = getOptimizedImageUrl(publicId, {
      ...options,
      width,
    });
  });

  return urls;
}

/**
 * Generate image URL with automatic format and quality optimization
 * @param publicId - The public ID of the image
 * @param width - Desired width
 * @param height - Desired height
 * @returns Optimized image URL with automatic format selection
 */
export function getAutoOptimizedUrl(
  publicId: string,
  width?: number,
  height?: number
): string {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto:best',
    fetch_format: 'auto',
    flags: 'progressive',
    secure: true,
  });
}

/**
 * Update image tags and context metadata
 * @param publicId - The public ID of the image
 * @param tags - Array of tags to add
 * @param context - Context metadata to update
 * @returns Promise with update result
 */
export async function updateImageMetadata(
  publicId: string,
  tags?: string[],
  context?: Record<string, string>
): Promise<void> {
  try {
    const updateOptions: any = {};
    
    if (tags) {
      updateOptions.tags = tags;
    }
    
    if (context) {
      updateOptions.context = context;
    }

    await cloudinary.uploader.add_context(context || {}, [publicId]);
    
    if (tags) {
      await cloudinary.uploader.add_tag(tags.join(','), [publicId]);
    }
  } catch (error) {
    console.error('Failed to update image metadata:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to update image metadata'
    );
  }
}

/**
 * Search for images by tags, context, or metadata
 * @param query - Search query object
 * @returns Promise with search results
 */
export async function searchImages(query: {
  tags?: string[];
  context?: Record<string, string>;
  folder?: string;
  resourceType?: string;
  maxResults?: number;
}): Promise<CloudinaryUploadResult[]> {
  try {
    const {
      tags = [],
      context = {},
      folder,
      resourceType = 'image',
      maxResults = 50
    } = query;

    let expression = `resource_type:${resourceType}`;
    
    if (folder) {
      expression += ` AND folder:${folder}`;
    }
    
    if (tags.length > 0) {
      expression += ` AND tags:(${tags.join(' OR ')})`;
    }
    
    Object.entries(context).forEach(([key, value]) => {
      expression += ` AND context.${key}:${value}`;
    });

    const result = await cloudinary.search
      .expression(expression)
      .max_results(maxResults)
      .with_field('context')
      .with_field('tags')
      .execute();

    return result.resources.map((resource: any) => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      resource_type: resource.resource_type,
      bytes: resource.bytes,
      created_at: resource.created_at,
      folder: resource.folder,
      tags: resource.tags,
      context: resource.context,
    }));
  } catch (error) {
    console.error('Failed to search images:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to search images'
    );
  }
}

/**
 * Get folder structure and organization info
 * @param rootFolder - Root folder to analyze
 * @returns Promise with folder structure
 */
export async function getFolderStructure(rootFolder: string = 'superbear_blog'): Promise<{
  folders: string[];
  totalImages: number;
  folderStats: Record<string, { count: number; totalBytes: number }>;
}> {
  try {
    const result = await cloudinary.api.sub_folders(rootFolder);
    const folders = result.folders.map((f: any) => f.name);
    
    const folderStats: Record<string, { count: number; totalBytes: number }> = {};
    let totalImages = 0;

    // Get stats for each folder
    for (const folder of folders) {
      try {
        const folderResult = await cloudinary.api.resources({
          type: 'upload',
          prefix: `${rootFolder}/${folder}`,
          max_results: 500,
        });
        
        const count = folderResult.resources.length;
        const totalBytes = folderResult.resources.reduce(
          (sum: number, resource: any) => sum + (resource.bytes || 0), 
          0
        );
        
        folderStats[folder] = { count, totalBytes };
        totalImages += count;
      } catch (error) {
        console.warn(`Failed to get stats for folder ${folder}:`, error);
        folderStats[folder] = { count: 0, totalBytes: 0 };
      }
    }

    return {
      folders,
      totalImages,
      folderStats,
    };
  } catch (error) {
    console.error('Failed to get folder structure:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to get folder structure'
    );
  }
}

export default cloudinary;
