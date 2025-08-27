import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailQueue, processEmailQueue } from '@/lib/email-queue';
import { logger } from '@/lib/logger';

// GET /api/admin/campaigns/queue - Get queue statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = emailQueue.getStats();

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get queue stats', error as Error);
    return NextResponse.json(
      { error: 'Failed to get queue statistics' },
      { status: 500 }
    );
  }
}

// POST /api/admin/campaigns/queue/process - Manually process queue
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Manual queue processing triggered by admin', {
      userId: session.user.email,
    });

    await processEmailQueue();

    const stats = emailQueue.getStats();

    return NextResponse.json({
      success: true,
      message: 'Queue processing completed',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to process queue manually', error as Error);
    return NextResponse.json(
      { error: 'Failed to process queue' },
      { status: 500 }
    );
  }
}
