import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteCampaign, getCampaignStats } from '@/lib/email-campaigns';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET /api/admin/campaigns/[id] - Get campaign details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: params.id },
      include: {
        template: {
          select: { name: true, category: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get campaign statistics
    const stats = await getCampaignStats(params.id);

    return NextResponse.json({
      campaign,
      stats,
    });

  } catch (error) {
    logger.error('Failed to fetch campaign', error as Error, { campaignId: params.id });
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/campaigns/[id] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteCampaign(params.id);

    return NextResponse.json({ 
      success: true,
      message: 'Campaign deleted successfully' 
    });

  } catch (error) {
    logger.error('Failed to delete campaign', error as Error, { campaignId: params.id });
    
    if (error instanceof Error && error.message === 'Campaign not found') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes('Cannot delete campaign')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}