import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth-utils';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

const updateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.any().optional(), // Tiptap JSON content
  image: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
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

    // Check if article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return createErrorResponse('Article not found', 404);
    }

    // Delete article (this will also remove tag relationships due to Prisma's cascade)
    await prisma.article.delete({
      where: { id },
    });

    return createSuccessResponse({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error deleting article:', error);
    return createErrorResponse('Failed to delete article', 500);
  }
}
