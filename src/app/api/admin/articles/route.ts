import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth-utils';
import type { Status } from '@/types/database';
import { z } from 'zod';
import {
  createArticleSchema,
  generateSlugFromTitle,
} from '@/lib/validations/article';
import { mediaTracker } from '@/lib/media/media-tracker';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session; // Return error response
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as Status | null;
    const category = searchParams.get('category');
    const author = searchParams.get('author');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: {
      status?: Status;
      categoryId?: string;
      authorId?: string;
    } = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.categoryId = category;
    }

    if (author) {
      where.authorId = author;
    }

    // Get articles with related data (admin can see all statuses)
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
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
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return createSuccessResponse({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin articles:', error);
    return createErrorResponse('Failed to fetch articles', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session; // Return error response
    }

    const body = await request.json();
    const validatedData = createArticleSchema.parse(body);

    // Generate slug if not provided
    let slug = validatedData.slug;
    if (!slug) {
      slug = generateSlugFromTitle(validatedData.title);
    }

    // Check if slug is unique
    const existingArticle = await prisma.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      // Append timestamp to make it unique
      slug = `${slug}-${Date.now()}`;
    }

    // Verify author and category exist
    const [author, category] = await Promise.all([
      prisma.author.findUnique({ where: { id: validatedData.authorId } }),
      prisma.category.findUnique({ where: { id: validatedData.categoryId } }),
    ]);

    if (!author) {
      return createErrorResponse('Author not found', 404);
    }

    if (!category) {
      return createErrorResponse('Category not found', 404);
    }

    // Validate tag IDs exist in database
    if (validatedData.tagIds.length > 0) {
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

    // Create article with tags
    const article = await prisma.article.create({
      data: {
        title: validatedData.title,
        slug,
        summary: validatedData.summary,
        content: validatedData.content,
        image: validatedData.image,
        status: validatedData.status,
        authorId: validatedData.authorId,
        categoryId: validatedData.categoryId,
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
        tags: {
          connect: validatedData.tagIds.map((id) => ({ id })),
        },
      },
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

    // Track media references after article creation
    try {
      // Track content images
      await mediaTracker.updateContentReferences(
        'article',
        article.id,
        validatedData.content,
        'content'
      );

      // Track cover image if present
      if (validatedData.image) {
        const publicIds = mediaTracker.extractImageReferences(validatedData.image);
        if (publicIds.length > 0) {
          await mediaTracker.updateContentReferences(
            'article',
            article.id,
            `<img data-public-id="${publicIds[0]}" />`,
            'cover_image'
          );
        }
      }
    } catch (trackingError) {
      console.error('Failed to track media references for new article:', trackingError);
      // Don't fail the article creation for tracking errors
    }

    return createSuccessResponse(article, 201);
  } catch (error) {
    console.error('Error creating article:', error);

    if (error instanceof z.ZodError) {
      return createErrorResponse(
        `Validation error: ${error.issues.map((e) => e.message).join(', ')}`,
        400
      );
    }

    return createErrorResponse('Failed to create article', 500);
  }
}
