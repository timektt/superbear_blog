import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CampaignDetails from '@/components/admin/CampaignDetails';

interface CampaignPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: CampaignPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: resolvedParams.id },
    select: { title: true },
  });

  if (!campaign) {
    return {
      title: 'Campaign Not Found',
    };
  }

  return {
    title: `${campaign.title} - Campaign Details`,
    description: `View details and analytics for ${campaign.title}`,
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const resolvedParams = await params;
  const campaign = await prisma.newsletterCampaign.findUnique({
    where: { id: resolvedParams.id },
    include: {
      template: {
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CampaignDetails campaign={campaign} />
    </div>
  );
}
