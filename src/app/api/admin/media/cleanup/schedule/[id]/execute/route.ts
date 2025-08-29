import { NextRequest, NextResponse } from 'next/server';
import { cleanupScheduler } from '@/lib/media/cleanup-scheduler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scheduleId = params.id;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Execute the scheduled cleanup
    const result = await cleanupScheduler.executeScheduledCleanup(scheduleId);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error executing scheduled cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute scheduled cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}