import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPodcastSchema } from '@/lib/validations/article';
import { generateSlugFromTitle } from '@/lib/validations/article';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const author = searchParams.get('author');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      where.status = status;
    }

    if (category) {
      where.categoryId = category;
    }

    if (author) {
      where.authorId = author;
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
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const response = {
      podcasts: podcasts.map((podcast: any) => ({
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
        status: podcast.status,
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
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching admin podcasts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createPodcastSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Generate slug if not provided
    if (!data.slug) {
      data.slug = generateSlugFromTitle(data.title);
    }

    // Check if slug already exists
    const existingPodcast = await prisma.podcastEpisode.findUnique({
      where: { slug: data.slug },
    });

    if (existingPodcast) {
      return NextResponse.json(
        { error: 'A podcast with this slug already exists' },
        { status: 409 }
      );
    }

    // Create podcast episode
    const podcast = await prisma.podcastEpisode.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        summary: data.summary,
        audioUrl: data.audioUrl,
        coverImage: data.coverImage,
        duration: data.duration,
        episodeNumber: data.episodeNumber,
        seasonNumber: data.seasonNumber,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        authorId: data.authorId,
        categoryId: data.categoryId,
        tags: {
          connect: data.tagIds.map((id) => ({ id })),
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

    return NextResponse.json(
      {
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
        status: podcast.status,
        publishedAt: podcast.publishedAt?.toISOString(),
        createdAt: podcast.createdAt.toISOString(),
        updatedAt: podcast.updatedAt.toISOString(),
        author: podcast.author,
        category: podcast.category,
        tags: podcast.tags,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating podcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
