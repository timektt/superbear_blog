import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TemplateCategory, TemplateStatus } from '@prisma/client';
import { createTemplateVersion } from '@/lib/email-templates';

// Validation schema for updating email templates
const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(TemplateCategory).optional(),
  status: z.nativeEnum(TemplateStatus).optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  designConfig: z.object({}).optional(),
});

// GET /api/admin/email-templates/[id] - Get single email template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
        campaigns: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            campaigns: true,
            versions: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-templates/[id] - Update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // Check if template exists
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // If HTML content is being updated, create a new version
    if (validatedData.htmlContent) {
      await createTemplateVersion(
        params.id,
        validatedData.htmlContent,
        validatedData.textContent,
        validatedData.designConfig
      );
    }

    // Update template
    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            campaigns: true,
            versions: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/email-templates/[id] - Delete email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if template exists
    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { campaigns: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if template is being used in campaigns
    if (template._count.campaigns > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is being used in campaigns' },
        { status: 400 }
      );
    }

    // Delete template (versions will be deleted due to cascade)
    await prisma.emailTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}
