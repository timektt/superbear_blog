import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scheduleCampaign } from '@/lib/email-campaigns';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for scheduling
const scheduleSchema = z.object({
  scheduledAt: z.string().datetime('Invalid datetime format'),
});

// POST /api/admin/campaigns/[id]/schedule - Schedule campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = scheduleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const scheduledAt = new Date(validationResult.data.scheduledAt);

    // Check if scheduled time is in the future
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    await scheduleCampaign(params.id, scheduledAt);

    return NextResponse.json({
      success: true,
      message: 'Campaign scheduled successfully',
      scheduledAt: scheduledAt.toISOString(),
    });
  } catch (error) {
    logger.error('Failed to schedule campaign', error as Error, {
      campaignId: params.id,
    });

    if (error instanceof Error && error.message === 'Campaign not found') {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to schedule campaign' },
      { status: 500 }
    );
  }
}
