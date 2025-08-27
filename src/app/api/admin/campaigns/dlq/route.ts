import { NextRequest, NextResponse } from 'next/server';
import { moveToDeadLetterQueue } from '@/lib/campaign-controls';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// GET /api/admin/campaigns/dlq - Get Dead Letter Queue items
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'VIEWER');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const campaignId = searchParams.get('campaignId');

    const skip = (page - 1) * limit;

    // Get failed deliveries that have exceeded max attempts
    const where = {
      status: 'FAILED',
      attempts: { gte: 3 },
      ...(campaignId && { campaignId }),
    };

    const [dlqItems, total] = await Promise.all([
      prisma.campaignDelivery.findMany({
        where,
        include: {
          campaign: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { lastAttemptAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.campaignDelivery.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: dlqItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to get DLQ items', error as Error);
    return NextResponse.json(
      { error: 'Failed to get DLQ items' },
      { status: 500 }
    );
  }
}

// POST /api/admin/campaigns/dlq - Move failed deliveries to DLQ
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'ADMIN');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { campaignId, maxAttempts } = await request.json();

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const result = await moveToDeadLetterQueue(campaignId, maxAttempts || 3);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    logger.info('Deliveries moved to DLQ via API', {
      campaignId,
      movedBy: authResult.user?.email,
      movedCount: result.movedCount,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      movedCount: result.movedCount,
    });
  } catch (error) {
    logger.error('Failed to move deliveries to DLQ', error as Error);
    return NextResponse.json(
      { error: 'Failed to move deliveries to DLQ' },
      { status: 500 }
    );
  }
}
