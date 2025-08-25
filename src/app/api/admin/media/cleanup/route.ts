import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/auth-utils';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { 
  cleanupArticleImages, 
  batchCleanupArticleImages,
  deleteCloudinaryImageByUrl,
  validateCloudinaryConfig,
  getCloudinaryUsage
} from '@/lib/cloudinary-cleanup';
import { z } from 'zod';

const cleanupSchema = z.object({
  type: z.enum(['single', 'batch', 'orphaned']),
  articleId: z.string().optional(),
  articleIds: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
});

export const POST = withPermission('media:delete', async (user, request: NextRequest) => {
  try {
    // Validate Cloudinary configuration
    const configValidation = validateCloudinaryConfig();
    if (!configValidation.valid) {
      return NextResponse.json(
        { error: configValidation.error },
        { status: 500 }
      );
    }

    const prisma = getSafePrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { type, articleId, articleIds, imageUrl } = cleanupSchema.parse(body);

    switch (type) {
      case 'single': {
        if (!articleId) {
          return NextResponse.json(
            { error: 'Article ID is required for single cleanup' },
            { status: 400 }
          );
        }

        const article = await prisma.article.findUnique({
          where: { id: articleId },
          select: { id: true, image: true, content: true }
        });

        if (!article) {
          return NextResponse.json(
            { error: 'Article not found' },
            { status: 404 }
          );
        }

        const result = await cleanupArticleImages(article);
        
        return NextResponse.json({
          success: result.success,
          deletedImages: result.deletedImages,
          errors: result.errors,
          message: `Cleaned up ${result.deletedImages.length} images for article ${articleId}`
        });
      }

      case 'batch': {
        if (!articleIds || articleIds.length === 0) {
          return NextResponse.json(
            { error: 'Article IDs are required for batch cleanup' },
            { status: 400 }
          );
        }

        const articles = await prisma.article.findMany({
          where: { id: { in: articleIds } },
          select: { id: true, image: true, content: true }
        });

        if (articles.length === 0) {
          return NextResponse.json(
            { error: 'No articles found' },
            { status: 404 }
          );
        }

        const result = await batchCleanupArticleImages(articles);
        
        return NextResponse.json({
          success: result.success,
          totalArticles: result.totalArticles,
          totalImagesDeleted: result.totalImagesDeleted,
          results: result.results,
          message: `Batch cleanup completed: ${result.totalImagesDeleted} images deleted from ${result.totalArticles} articles`
        });
      }

      case 'orphaned': {
        // Find and clean up orphaned images (images not referenced by any article)
        const allArticles = await prisma.article.findMany({
          select: { id: true, image: true, content: true }
        });

        // This is a simplified implementation
        // In production, you'd want to scan Cloudinary for all images
        // and compare with database references
        
        return NextResponse.json({
          success: true,
          message: 'Orphaned image cleanup not yet implemented',
          note: 'This feature requires scanning all Cloudinary images and comparing with database references'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid cleanup type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Media cleanup error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Delete specific image by URL
export const DELETE = withPermission('media:delete', async (user, request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const result = await deleteCloudinaryImageByUrl(imageUrl);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to delete image' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// Get Cloudinary usage statistics
export const GET = withPermission('media:upload', async (user, request: NextRequest) => {
  try {
    const usage = await getCloudinaryUsage();
    
    if (usage.success) {
      return NextResponse.json({
        success: true,
        usage: usage.usage
      });
    } else {
      return NextResponse.json(
        { error: usage.error || 'Failed to fetch usage statistics' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Usage statistics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});