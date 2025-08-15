import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runCampaignScheduler, getSchedulerStatus } from '@/lib/campaign-scheduler';
import { logger } from '@/lib/logger';

// GET /api/admin/campaigns/scheduler - Get scheduler status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = getSchedulerStatus();
    return NextResponse.json(status);

  } catch (error) {
    logger.error('Failed to get scheduler status', error as Error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

// POST /api/admin/campaigns/scheduler - Run scheduler manually
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Manual scheduler run triggered by admin', { userId: session.user.email });

    const status = await runCampaignScheduler();

    return NextResponse.json({
      success: true,
      message: 'Scheduler run completed',
      status,
    });

  } catch (error) {
    logger.error('Failed to run scheduler manually', error as Error);
    return NextResponse.json(
      { error: 'Failed to run scheduler' },
      { status: 500 }
    );
  }
}