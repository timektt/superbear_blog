import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TemplateCategory, TemplateStatus } from '@prisma/client';
import { DEFAULT_DESIGN_CONFIG } from '@/lib/email-templates';

// Validation schema for creating email templates
const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  category: z.nativeEnum(TemplateCategory),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().optional(),
  designConfig: z.object({}).optional(),
});

// GET /api/admin/email-templates - List all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as TemplateCategory | null;
    const status = searchParams.get('status') as TemplateStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (category) where.category = category;
    if (status) where.status = status;

    // Get templates with pagination
    const [templates, total] = await Promise.all([
      prisma.emailTemplate.findMany({
        where,
        include: {
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              campaigns: true,
              versions: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emailTemplate.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates - Create new email template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // Create template with default design config if not provided
    const template = await prisma.emailTemplate.create({
      data: {
        ...validatedData,
        designConfig: validatedData.designConfig || DEFAULT_DESIGN_CONFIG,
        createdBy: session.user.id || session.user.email || 'system',
        status: TemplateStatus.DRAFT,
      },
      include: {
        versions: true,
        _count: {
          select: {
            campaigns: true,
            versions: true,
          },
        },
      },
    });

    // Create initial version
    await prisma.templateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        htmlContent: validatedData.htmlContent,
        textContent: validatedData.textContent,
        designConfig: template.designConfig,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}
