import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createNewsletterIssueSchema } from '@/lib/validations/article';
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

    if (author) {
      where.authorId = author;
    }

    // Get total count for pagination
    const total = await prisma.newsletterIssue.count({ where });

    // Get newsletter issues with relations
    const issues = await prisma.newsletterIssue.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
      issues: issues.map((issue) => ({
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
    console.error('Error fetching admin newsletter issues:', error);
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
    const validationResult = createNewsletterIssueSchema.safeParse(body);
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
    const existingIssue = await prisma.newsletterIssue.findUnique({
      where: { slug: data.slug },
    });

    if (existingIssue) {
      return NextResponse.json(
        { error: 'A newsletter issue with this slug already exists' },
        { status: 409 }
      );
    }

    // Auto-generate issue number
    const lastIssue = await prisma.newsletterIssue.findFirst({
      orderBy: { issueNumber: 'desc' },
      select: { issueNumber: true },
    });

    const nextIssueNumber = (lastIssue?.issueNumber || 0) + 1;

    // Create newsletter issue
    const issue = await prisma.newsletterIssue.create({
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        issueNumber: nextIssueNumber,
        status: data.status,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        authorId: data.authorId,
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

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating newsletter issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
