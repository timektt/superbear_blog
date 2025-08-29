import { NextRequest, NextResponse } from 'next/server';
import { cleanupScheduler } from '@/lib/media/cleanup-scheduler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get scheduled cleanup runs
    const runs = await cleanupScheduler.getScheduledRuns(scheduleId || undefined, limit);

    return NextResponse.json({
      success: true,
      data: {
        runs,
        total: runs.length,
        scheduleId: scheduleId || null
      }
    });

  } catch (error) {
    console.error('Error fetching scheduled cleanup runs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scheduled cleanup runs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}