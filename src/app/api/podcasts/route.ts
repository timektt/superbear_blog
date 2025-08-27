import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PodcastListResponse } from '@/types/content';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const search = searchParams.get('search');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
      publishedAt: {
        lte: new Date(),
      },
    };

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (author) {
      where.author = {
        name: {
          contains: author,
          mode: 'insensitive',
        },
      };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          summary: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get total count for pagination
    const total = await prisma.podcastEpisode.count({ where });

    // Get podcasts with relations
    const podcasts = await prisma.podcastEpisode.findMany({
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
    });

    const totalPages = Math.ceil(total / limit);

    const response: PodcastListResponse = {
      podcasts: podcasts.map((podcast) => ({
        id: podcast.id,
        title: podcast.title,
        slug: podcast.slug,
        description: podcast.description,
        summary: podcast.summary,
        audioUrl: podcast.audioUrl,
        coverImage: podcast.coverImage,
        duration: podcast.duration,
        episodeNumber: podcast.episodeNumber,
        seasonNumber: podcast.seasonNumber,
        status: podcast.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
        publishedAt: podcast.publishedAt?.toISOString(),
        createdAt: podcast.createdAt.toISOString(),
        updatedAt: podcast.updatedAt.toISOString(),
        author: podcast.author,
        category: podcast.category,
        tags: podcast.tags,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        category,
        author,
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
