import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth-utils';
import { Status } from '@prisma/client';
import { z } from 'zod';

const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.any(), // Tiptap JSON content
  image: z.string().optional(),
  status: z.nativeEnum(Status).default(Status.DRAFT),
  authorId: z.string().min(1, 'Author is required'),
  categoryId: z.string().min(1, 'Category is required'),
  tagIds: z.array(z.string()).optional().default([]),
});

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
      slug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
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
        publishedAt:
          validatedData.status === Status.PUBLISHED ? new Date() : null,
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
