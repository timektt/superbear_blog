import { NextRequest, NextResponse } from 'next/server';
import { resumeCampaign } from '@/lib/campaign-controls';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/admin/campaigns/[id]/resume - Resume campaign
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

    const campaignId = params.id;

    const result = await resumeCampaign(campaignId, authResult.user?.email);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    logger.info('Campaign resumed via API', {
      campaignId,
      resumedBy: authResult.user?.email,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error('Failed to resume campaign', error as Error);
    return NextResponse.json(
      { error: 'Failed to resume campaign' },
      { status: 500 }
    );
  }
}
