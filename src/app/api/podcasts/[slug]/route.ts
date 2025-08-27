import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    slug: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Podcast slug is required' },
        { status: 400 }
      );
    }

    const podcast = await prisma.podcastEpisode.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        publishedAt: {
          lte: new Date(),
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

    if (!podcast) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    const response = {
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
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
