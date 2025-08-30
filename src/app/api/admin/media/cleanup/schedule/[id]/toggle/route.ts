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
    const body = await request.json();
    const { enabled } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean value' },
        { status: 400 }
      );
    }

    // Toggle schedule status
    await cleanupScheduler.toggleSchedule(scheduleId, enabled);

    return NextResponse.json({
      success: true,
      data: {
        message: `Schedule ${enabled ? 'enabled' : 'disabled'} successfully`,
        scheduleId,
        enabled
      }
    });

  } catch (error) {
    console.error('Error toggling cleanup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to toggle cleanup schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}