import { NextRequest, NextResponse } from 'next/server';
import { runCampaignScheduler } from '@/lib/campaign-scheduler';
import { processEmailQueue } from '@/lib/email-queue';
import { cleanupSoftBounces } from '@/lib/suppression';
import { logger } from '@/lib/logger';

// POST /api/cron/campaigns - Cron job endpoint for processing scheduled campaigns and email queue
export async function POST(request: NextRequest) {
  try {
    // Verify cron job authorization (in production, use a secret token)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job attempt', { 
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Cron job triggered for campaign and queue processing');

    const results = {
      scheduler: null as any,
      queue: null as any,
      cleanup: null as unknown,
    };

    // 1. Process scheduled campaigns
    try {
      results.scheduler = await runCampaignScheduler();
      logger.info('Campaign scheduler completed');
    } catch (error) {
      logger.error('Campaign scheduler failed', error as Error);
      results.scheduler = { error: (error as Error).message };
    }

    // 2. Process email queue
    try {
      await processEmailQueue();
      results.queue = { success: true, message: 'Queue processing completed' };
      logger.info('Email queue processing completed');
    } catch (error) {
      logger.error('Email queue processing failed', error as Error);
      results.queue = { error: (error as Error).message };
    }

    // 3. Cleanup soft bounces (run once per day)
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() < 5) { // Run at 2 AM
      try {
        await cleanupSoftBounces();
        results.cleanup = { success: true, message: 'Soft bounce cleanup completed' };
        logger.info('Soft bounce cleanup completed');
      } catch (error) {
        logger.error('Soft bounce cleanup failed', error as Error);
        results.cleanup = { error: (error as Error).message };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Cron job failed', error as Error);
    return NextResponse.json(
      { 
        error: 'Cron job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/campaigns - Health check for cron job
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Campaign cron job endpoint is operational',
    });

  } catch (error) {
    logger.error('Cron health check failed', error as Error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}