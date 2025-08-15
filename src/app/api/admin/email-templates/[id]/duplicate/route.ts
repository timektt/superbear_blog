import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TemplateStatus } from '@prisma/client';

// POST /api/admin/email-templates/[id]/duplicate - Duplicate email template
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Get original template
    const originalTemplate = await prisma.emailTemplate.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    if (!originalTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const latestVersion = originalTemplate.versions[0];

    // Create duplicate template
    const duplicatedTemplate = await prisma.emailTemplate.create({
      data: {
        name: name || `${originalTemplate.name} (Copy)`,
        subject: originalTemplate.subject,
        description: originalTemplate.description,
        category: originalTemplate.category,
        status: TemplateStatus.DRAFT,
        htmlContent: originalTemplate.htmlContent,
        textContent: originalTemplate.textContent,
        variables: originalTemplate.variables,
        designConfig: originalTemplate.designConfig,
        createdBy: session.user.id || session.user.email || 'system'
      },
      include: {
        versions: true,
        _count: {
          select: {
            campaigns: true,
            versions: true
          }
        }
      }
    });

    // Create initial version for duplicated template
    if (latestVersion) {
      await prisma.templateVersion.create({
        data: {
          templateId: duplicatedTemplate.id,
          version: 1,
          htmlContent: latestVersion.htmlContent,
          textContent: latestVersion.textContent,
          designConfig: latestVersion.designConfig
        }
      });
    }

    return NextResponse.json(duplicatedTemplate, { status: 201 });

  } catch (error) {
    console.error('Error duplicating email template:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate email template' },
      { status: 500 }
    );
  }
}