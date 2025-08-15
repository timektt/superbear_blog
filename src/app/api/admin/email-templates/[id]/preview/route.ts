import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { compileTemplate, TemplateVariables } from '@/lib/email-templates';
import { prisma } from '@/lib/prisma';

// POST /api/admin/email-templates/[id]/preview - Generate template preview
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
    const { variables, mode = 'html' } = body;

    // Get some sample articles for preview
    const sampleArticles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        author: true,
        category: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 5,
    });

    // Create sample template variables
    const sampleVariables: TemplateVariables = {
      subscriber: {
        name: variables?.subscriber?.name || 'John Doe',
        email: variables?.subscriber?.email || 'john@example.com',
        subscriptionDate: new Date().toLocaleDateString(),
      },
      articles: {
        featured: sampleArticles[0] || {
          title: 'Sample Featured Article',
          summary: 'This is a sample article summary for preview purposes.',
          slug: 'sample-article',
        },
        latest: sampleArticles.slice(0, 4).map((article) => ({
          title: article.title,
          summary: article.summary,
          slug: article.slug,
        })) || [
          {
            title: 'Sample Article 1',
            summary: 'This is a sample article summary.',
            slug: 'sample-1',
          },
          {
            title: 'Sample Article 2',
            summary: 'Another sample article summary.',
            slug: 'sample-2',
          },
        ],
      },
      site: {
        name: process.env.SITE_NAME || 'SuperBear Blog',
        url: process.env.NEXTAUTH_URL || 'https://superbear.blog',
        logo: process.env.SITE_LOGO || '/logo.png',
      },
      campaign: {
        subject: variables?.campaign?.subject || 'Sample Campaign Subject',
        date: new Date().toLocaleDateString(),
        unsubscribeUrl: `${process.env.NEXTAUTH_URL}/newsletter/unsubscribe?token=sample-token`,
      },
    };

    // Compile template with sample data
    const compiled = await compileTemplate(
      params.id,
      sampleVariables,
      'preview@example.com'
    );

    // Return requested format
    if (mode === 'text') {
      return NextResponse.json({
        content: compiled.text,
        subject: compiled.subject,
        preheader: compiled.preheader,
        size: compiled.size,
        warnings: compiled.warnings,
        mode: 'text',
      });
    }

    return NextResponse.json({
      content: compiled.html,
      subject: compiled.subject,
      preheader: compiled.preheader,
      size: compiled.size,
      warnings: compiled.warnings,
      mode: 'html',
    });
  } catch (error) {
    console.error('Error generating template preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate template preview' },
      { status: 500 }
    );
  }
}
