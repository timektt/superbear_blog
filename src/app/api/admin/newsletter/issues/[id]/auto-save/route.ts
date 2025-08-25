import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AutoSaveSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.any().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = AutoSaveSchema.parse(body);

    // Check if newsletter issue exists
    const existingIssue = await prisma.newsletterIssue.findUnique({
      where: { id: params.id },
    });

    if (!existingIssue) {
      return NextResponse.json({ error: 'Newsletter issue not found' }, { status: 404 });
    }

    // Only auto-save if the issue is in draft status
    if (existingIssue.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Can only auto-save draft issues' }, { status: 400 });
    }

    // Update only the provided fields
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug;
    if (validatedData.summary !== undefined) updateData.summary = validatedData.summary;
    if (validatedData.content !== undefined) updateData.content = validatedData.content;

    const updatedIssue = await prisma.newsletterIssue.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      updatedAt: updatedIssue.updatedAt 
    });
  } catch (error) {
    console.error('Error auto-saving newsletter issue:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}