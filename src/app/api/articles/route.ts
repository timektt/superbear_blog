import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status, Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: Prisma.ArticleWhereInput = {
      status: Status.PUBLISHED,
    };

    if (category) {
      where.category = {
        slug: category,
      };
    }

    // Support multiple tag filtering (AND logic - article must have all selected tags)
    if (tags.length > 0) {
      if (tags.length === 1) {
        where.tags = {
          some: {
            slug: tags[0],
          },
        };
      } else {
        // For multiple tags, we need to ensure the article has ALL selected tags
        where.AND = tags.map((tagSlug) => ({
          tags: {
            some: {
              slug: tagSlug,
            },
          },
        }));
      }
    }

    // Enhanced search (case-sensitive for SQLite)
    if (search) {
      const searchTerm = search.trim();
      where.OR = [
        { title: { contains: searchTerm } },
        { summary: { contains: searchTerm } },
        // Note: Full-text search on JSON content would require database-specific implementation
        // For PostgreSQL, we could use to_tsvector and mode: 'insensitive'
      ];
    }

    // Get articles with related data
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
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
