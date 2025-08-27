import { NextRequest, NextResponse } from 'next/server';
import { retryFailedDeliveries } from '@/lib/campaign-controls';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/admin/campaigns/[id]/retry - Retry failed deliveries
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

    const { maxRetries } = await request.json();
    const campaignId = params.id;

    const result = await retryFailedDeliveries(campaignId, maxRetries || 3);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    logger.info('Failed deliveries retried via API', {
      campaignId,
      retriedBy: authResult.user?.email,
      retriedCount: result.retriedCount,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      retriedCount: result.retriedCount,
    });
  } catch (error) {
    logger.error('Failed to retry deliveries', error as Error);
    return NextResponse.json(
      { error: 'Failed to retry deliveries' },
      { status: 500 }
    );
  }
}
