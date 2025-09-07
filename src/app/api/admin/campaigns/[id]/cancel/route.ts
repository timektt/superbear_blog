import { NextRequest, NextResponse } from 'next/server';
import { cancelCampaign } from '@/lib/campaign-controls';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/admin/campaigns/[id]/cancel - Cancel campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'ADMIN');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await request.json();
    const campaignId = params.id;

    const result = await cancelCampaign(
      campaignId,
      reason || 'Manual cancellation',
      authResult.user?.email
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    logger.info('Campaign cancelled via API', {
      campaignId,
      cancelledBy: authResult.user?.email,
      reason,
      cancelledDeliveries: result.cancelledDeliveries,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      cancelledDeliveries: result.cancelledDeliveries,
    });
  } catch (error) {
    logger.error('Failed to cancel campaign', error as Error);
    return NextResponse.json(
      { error: 'Failed to cancel campaign' },
      { status: 500 }
    );
  }
}
