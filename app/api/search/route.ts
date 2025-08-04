import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        results: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 0,
        },
        query: '',
      });
    }

    const skip = (page - 1) * limit;
    const searchTerm = query.trim();

    // Build where clause for advanced search
    const where: Prisma.ArticleWhereInput = {
      status: Status.PUBLISHED,
      OR: [
        { title: { contains: searchTerm } },
        { summary: { contains: searchTerm } },
        // Note: Full-text search on content would require database-specific implementation
        // For now, we'll search in title and summary
      ],
    };

    // Apply additional filters
    if (category) {
      where.category = { slug: category };
    }

    if (tags.length > 0) {
      if (tags.length === 1) {
        where.tags = {
          some: { slug: tags[0] },
        };
      } else {
        where.AND = tags.map((tagSlug) => ({
          tags: {
            some: { slug: tagSlug },
          },
        }));
      }
    }

    // Get search results with related data
    const [results, total] = await Promise.all([
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
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      query: searchTerm,
    });
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
