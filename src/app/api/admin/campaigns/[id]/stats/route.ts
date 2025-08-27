import { NextRequest, NextResponse } from 'next/server';
import { getCampaignStatistics } from '@/lib/campaign-controls';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// GET /api/admin/campaigns/[id]/stats - Get campaign statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'VIEWER');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const campaignId = params.id;
    const stats = await getCampaignStatistics(campaignId);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Failed to get campaign statistics', error as Error);
    return NextResponse.json(
      { error: 'Failed to get campaign statistics' },
      { status: 500 }
    );
  }
}
