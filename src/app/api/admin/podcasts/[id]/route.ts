import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updatePodcastSchema } from '@/lib/validations/article';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const podcast = await prisma.podcastEpisode.findUnique({
      where: { id: params.id },
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
      return NextResponse.json(
        { error: 'Podcast not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = updatePodcastSchema.safeParse(body);
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

    // Check if podcast exists
    const existingPodcast = await prisma.podcastEpisode.findUnique({
      where: { id: params.id },
    });

    if (!existingPodcast) {
      return NextResponse.json(
        { error: 'Podcast not found' },
        { status: 404 }
      );
    }

    // Check if slug already exists (if updating slug)
    if (data.slug && data.slug !== existingPodcast.slug) {
      const slugExists = await prisma.podcastEpisode.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A podcast with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.audioUrl !== undefined) updateData.audioUrl = data.audioUrl;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.episodeNumber !== undefined) updateData.episodeNumber = data.episodeNumber;
    if (data.seasonNumber !== undefined) updateData.seasonNumber = data.seasonNumber;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }
    if (data.authorId !== undefined) updateData.authorId = data.authorId;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    // Handle tag updates
    if (data.tagIds !== undefined) {
      updateData.tags = {
        set: data.tagIds.map((id) => ({ id })),
      };
    }

    // Update podcast episode
    const podcast = await prisma.podcastEpisode.update({
      where: { id: params.id },
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error updating podcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if podcast exists
    const existingPodcast = await prisma.podcastEpisode.findUnique({
      where: { id: params.id },
    });

    if (!existingPodcast) {
      return NextResponse.json(
        { error: 'Podcast not found' },
        { status: 404 }
      );
    }

    // Delete podcast episode
    await prisma.podcastEpisode.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Podcast deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting podcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}