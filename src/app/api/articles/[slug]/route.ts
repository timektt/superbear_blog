import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Status } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await prisma.article.findUnique({
      where: {
        slug,
        status: Status.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            bio: true,
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

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get related articles from the same category
    const relatedArticles = await prisma.article.findMany({
      where: {
        categoryId: article.categoryId,
        status: Status.PUBLISHED,
        id: {
          not: article.id,
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
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 3,
    });

    return NextResponse.json({
      article,
      relatedArticles,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
