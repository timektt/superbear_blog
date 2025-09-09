import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            articles: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: [
        {
          articles: {
            _count: 'desc',
          },
        },
        {
          name: 'asc',
        },
      ],
    });

    // Only return tags that have published articles
    const tagsWithArticles = tags.filter((tag: any) => tag._count.articles > 0);

    return NextResponse.json(tagsWithArticles);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
