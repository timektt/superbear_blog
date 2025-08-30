import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth-utils';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { updateArticleSchema } from '@/lib/validations/article';
import { mediaTracker } from '@/lib/media/media-tracker';

// Cloudinary configuration
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session; // Return error response
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateArticleSchema.parse(body);

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return createErrorResponse('Article not found', 404);
    }

    // Handle slug uniqueness if slug is being updated
    const slug = validatedData.slug;
    if (slug && slug !== existingArticle.slug) {
      const slugExists = await prisma.article.findUnique({
        where: { slug },
      });

      if (slugExists) {
        return createErrorResponse('Slug already exists', 400);
      }
    }

    // Verify author and category exist if they're being updated
    if (validatedData.authorId) {
      const author = await prisma.author.findUnique({
        where: { id: validatedData.authorId },
      });
      if (!author) {
        return createErrorResponse('Author not found', 404);
      }
    }

    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });
      if (!category) {
        return createErrorResponse('Category not found', 404);
      }
    }

    // Validate tag IDs exist in database if tags are being updated
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      const existingTags = await prisma.tag.findMany({
        where: {
          id: {
            in: validatedData.tagIds,
          },
        },
        select: { id: true },
      });

      const existingTagIds = existingTags.map((tag) => tag.id);
      const missingTagIds = validatedData.tagIds.filter(
        (id) => !existingTagIds.includes(id)
      );

      if (missingTagIds.length > 0) {
        return createErrorResponse(
          `Tags not found: ${missingTagIds.join(', ')}`,
          400
        );
      }
    }

    // Prepare update data
    const { tagIds, ...updateFields } = validatedData;
    const updateData: Prisma.ArticleUpdateInput = {
      ...updateFields,
    };

    // Handle status change to published
    if (
      validatedData.status === 'PUBLISHED' &&
      existingArticle.status !== 'PUBLISHED'
    ) {
      updateData.publishedAt = new Date();
    }

    // Handle tags update
    if (tagIds !== undefined) {
      updateData.tags = {
        set: tagIds.map((id) => ({ id })),
      };
    }

    // Update article
    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Track media references after article update
    try {
      // Track content images if content was updated
      if (validatedData.content) {
        await mediaTracker.updateContentReferences(
          'article',
          article.id,
          validatedData.content,
          'content'
        );
      }

      // Track cover image if it was updated
      if (validatedData.image !== undefined) {
        if (validatedData.image) {
          // New or updated cover image
          const publicIds = mediaTracker.extractImageReferences(validatedData.image);
          if (publicIds.length > 0) {
            await mediaTracker.updateContentReferences(
              'article',
              article.id,
              `<img data-public-id="${publicIds[0]}" />`,
              'cover_image'
            );
          }
        } else {
          // Cover image was removed
          await mediaTracker.updateContentReferences(
            'article',
            article.id,
            '',
            'cover_image'
          );
        }
      }
    } catch (trackingError) {
      console.error('Failed to track media references for updated article:', trackingError);
      // Don't fail the article update for tracking errors
    }

    return createSuccessResponse(article);
  } catch (error) {
    console.error('Error updating article:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.issues.map((e) => e.message).join(', ')}`,
        400
      );
    }

    return createErrorResponse('Failed to update article', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session; // Return error response
    }

    const { id } = await params;

    // Check if article exists and get image info
    const existingArticle = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        image: true,
        title: true,
      },
    });

    if (!existingArticle) {
      return createErrorResponse('Article not found', 404);
    }

    // Clean up media references before deleting article
    try {
      // Remove all media references for this article
      await mediaTracker.updateContentReferences('article', id, '', 'content');
      await mediaTracker.updateContentReferences('article', id, '', 'cover_image');
    } catch (trackingError) {
      console.error('Failed to clean up media references:', trackingError);
      // Don't fail the deletion for tracking errors
    }

    // Delete article (this will also remove tag relationships due to Prisma's cascade)
    await prisma.article.delete({
      where: { id },
    });

    // Note: We no longer directly delete from Cloudinary here
    // The cleanup system will handle orphaned images through the media management system

    return createSuccessResponse({
      message: 'Article deleted successfully',
      deletedArticle: {
        id: existingArticle.id,
        title: existingArticle.title,
      },
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return createErrorResponse('Failed to delete article', 500);
  }
}
