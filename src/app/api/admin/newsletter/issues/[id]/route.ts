import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateNewsletterIssueSchema } from '@/lib/validations/article';

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

    const issue = await prisma.newsletterIssue.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error fetching newsletter issue:', error);
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
    const validationResult = updateNewsletterIssueSchema.safeParse(body);
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

    // Check if newsletter issue exists
    const existingIssue = await prisma.newsletterIssue.findUnique({
      where: { id: params.id },
    });

    if (!existingIssue) {
      return NextResponse.json(
        { error: 'Newsletter issue not found' },
        { status: 404 }
      );
    }

    // Check if slug already exists (if updating slug)
    if (data.slug && data.slug !== existingIssue.slug) {
      const slugExists = await prisma.newsletterIssue.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A newsletter issue with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Prevent editing critical fields if already sent
    if (existingIssue.sentAt && (data.title || data.content)) {
      return NextResponse.json(
        {
          error:
            'Cannot edit title or content of a newsletter that has already been sent',
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt
        ? new Date(data.publishedAt)
        : null;
    }
    if (data.authorId !== undefined) updateData.authorId = data.authorId;

    // Update newsletter issue
    const issue = await prisma.newsletterIssue.update({
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
      },
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Error updating newsletter issue:', error);
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

    // Check if newsletter issue exists
    const existingIssue = await prisma.newsletterIssue.findUnique({
      where: { id: params.id },
    });

    if (!existingIssue) {
      return NextResponse.json(
        { error: 'Newsletter issue not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if already sent
    if (existingIssue.sentAt) {
      return NextResponse.json(
        {
          error: 'Cannot delete a newsletter issue that has already been sent',
        },
        { status: 400 }
      );
    }

    // Delete newsletter issue
    await prisma.newsletterIssue.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: 'Newsletter issue deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting newsletter issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
