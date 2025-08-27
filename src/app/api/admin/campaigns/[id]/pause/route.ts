import { NextRequest, NextResponse } from 'next/server';
import { pauseCampaign } from '@/lib/campaign-controls';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/admin/campaigns/[id]/pause - Pause campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'EDITOR');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { reason } = await request.json();
    const campaignId = params.id;

    const result = await pauseCampaign(
      campaignId,
      reason || 'Manual pause',
      authResult.user?.email
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    logger.info('Campaign paused via API', {
      campaignId,
      pausedBy: authResult.user?.email,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Failed to pause campaign', error as Error);
    return NextResponse.json(
      { error: 'Failed to pause campaign' },
      { status: 500 }
    );
  }
}
