import { NextRequest, NextResponse } from 'next/server';
import { emergencyStopAllCampaigns } from '@/lib/campaign-controls';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/admin/campaigns/emergency-stop - Emergency stop all campaigns
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication (requires SUPER_ADMIN)
    const authResult = await checkAdminAuth(request, 'SUPER_ADMIN');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { reason } = await request.json();

    const result = await emergencyStopAllCampaigns(
      reason || 'Emergency stop',
      authResult.user?.email
    );

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    logger.warn('Emergency stop triggered', {
      stoppedBy: authResult.user?.email,
      reason,
      affectedCampaigns: result.affectedCampaigns.length,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      affectedCampaigns: result.affectedCampaigns,
    });

  } catch (error) {
    logger.error('Emergency stop failed', error as Error);
    return NextResponse.json(
      { error: 'Emergency stop failed' },
      { status: 500 }
    );
  }
}