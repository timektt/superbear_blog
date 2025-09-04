import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EmailTemplateEditor from '@/components/admin/EmailTemplateEditor';
import { prisma } from '@/lib/prisma';

interface EmailTemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: EmailTemplatePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const template = await prisma.emailTemplate.findUnique({
    where: { id: resolvedParams.id },
    select: { name: true },
  });

  if (!template) {
    return {
      title: 'Template Not Found - Admin Dashboard',
    };
  }

  return {
    title: `Edit ${template.name} - Admin Dashboard`,
    description: `Edit email template: ${template.name}`,
  };
}

export default async function EmailTemplateEditPage({
  params,
}: EmailTemplatePageProps) {
  const resolvedParams = await params;
  // Verify template exists
  const template = await prisma.emailTemplate.findUnique({
    where: { id: resolvedParams.id },
    select: { id: true },
  });

  if (!template) {
    notFound();
  }

  return <EmailTemplateEditor templateId={resolvedParams.id} />;
}
