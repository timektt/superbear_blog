import { NextRequest, NextResponse } from 'next/server';
import { cleanupEngine } from '@/lib/media/cleanup-engine';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const headersList = await headers();
    const cronSecret = headersList.get('x-cron-secret');
    
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for configuration
    const body = await request.json().catch(() => ({}));
    const { 
      olderThanDays = 30, 
      dryRun = false,
      maxFiles = 100 
    } = body;

    // Calculate cutoff date
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - olderThanDays);

    console.log(`Starting scheduled cleanup for files older than ${olderThan.toISOString()}`);

    // Find orphaned media
    const orphans = await cleanupEngine.findOrphanedMedia(olderThan);
    
    if (orphans.length === 0) {
      console.log('No orphaned files found for cleanup');
      return NextResponse.json({
        success: true,
        message: 'No orphaned files found',
        data: {
          processed: 0,
          deleted: 0,
          failed: 0,
          errors: [],
          freedSpace: 0,
          dryRun
        }
      });
    }

    // Limit the number of files to process in one run
    const filesToProcess = orphans.slice(0, maxFiles);
    const publicIds = filesToProcess.map(file => file.publicId);

    console.log(`Processing ${publicIds.length} orphaned files (dry run: ${dryRun})`);

    // Perform cleanup
    const result = await cleanupEngine.cleanupOrphans(publicIds, dryRun);

    console.log(`Cleanup completed: ${result.deleted} files deleted, ${result.freedSpace} bytes freed`);

    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      data: result
    });

  } catch (error) {
    console.error('Scheduled cleanup failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Scheduled cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verify cron secret for security
    const headersList = await headers();
    const cronSecret = headersList.get('x-cron-secret');
    
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cleanup statistics
    const statistics = await cleanupEngine.getOrphanStatistics();
    const recentHistory = await cleanupEngine.getCleanupHistory(10);

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        recentHistory,
        lastRun: recentHistory[0]?.completedAt || null
      }
    });

  } catch (error) {
    console.error('Error fetching cleanup status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cleanup status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}