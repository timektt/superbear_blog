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
        { error: 'Newsletter issue slug is required' },
        { status: 400 }
      );
    }

    const issue = await prisma.newsletterIssue.findFirst({
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
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Newsletter issue not found' },
        { status: 404 }
      );
    }

    const response = {
      id: issue.id,
      title: issue.title,
      slug: issue.slug,
      summary: issue.summary,
      content: issue.content,
      issueNumber: issue.issueNumber,
      status: issue.status,
      publishedAt: issue.publishedAt?.toISOString(),
      sentAt: issue.sentAt?.toISOString(),
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      author: issue.author,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching newsletter issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
