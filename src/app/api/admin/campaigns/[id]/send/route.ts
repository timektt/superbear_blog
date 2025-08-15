import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendCampaign } from '@/lib/email-campaigns';
import { logger } from '@/lib/logger';

// POST /api/admin/campaigns/[id]/send - Send campaign immediately
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Send campaign
    await sendCampaign(params.id);

    return NextResponse.json({ 
      success: true,
      message: 'Campaign sent successfully' 
    });

  } catch (error) {
    logger.error('Failed to send campaign', error as Error, { campaignId: params.id });
    
    if (error instanceof Error && error.message === 'Campaign not found') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (error instanceof Error && error.message === 'Campaign already sent') {
      return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    );
  }
}