import { NextRequest, NextResponse } from 'next/server';
import { cleanupScheduler, CleanupScheduleConfig } from '@/lib/media/cleanup-scheduler';
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
    const scheduleId = searchParams.get('id');

    if (scheduleId) {
      // Get specific schedule
      const schedule = await cleanupScheduler.getSchedule(scheduleId);
      if (!schedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }

      // Get next execution time
      const nextExecution = cleanupScheduler.getNextExecutionTime(schedule);

      return NextResponse.json({
        success: true,
        data: {
          schedule,
          nextExecution
        }
      });
    } else {
      // Get all schedules
      const schedules = await cleanupScheduler.getSchedules();
      const statistics = await cleanupScheduler.getScheduleStatistics();

      return NextResponse.json({
        success: true,
        data: {
          schedules,
          statistics
        }
      });
    }
  } catch (error) {
    console.error('Error fetching cleanup schedules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cleanup schedules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      frequency,
      time,
      olderThanDays,
      dryRun = false,
      enabled = true,
      maxFiles
    }: CleanupScheduleConfig = body;

    // Validate required fields
    if (!name || !frequency || !time || olderThanDays === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, frequency, time, olderThanDays' },
        { status: 400 }
      );
    }

    // Create schedule
    const scheduleId = await cleanupScheduler.createSchedule({
      name,
      frequency,
      time,
      olderThanDays,
      dryRun,
      enabled,
      maxFiles,
      createdBy: session.user.email || session.user.name || 'unknown'
    });

    return NextResponse.json({
      success: true,
      data: {
        scheduleId,
        message: 'Cleanup schedule created successfully'
      }
    });

  } catch (error) {
    console.error('Error creating cleanup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create cleanup schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { scheduleId, ...updates } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      );
    }

    // Update schedule
    await cleanupScheduler.updateSchedule(scheduleId, updates);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cleanup schedule updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating cleanup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update cleanup schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'scheduleId is required' },
        { status: 400 }
      );
    }

    // Delete schedule
    await cleanupScheduler.deleteSchedule(scheduleId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cleanup schedule deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting cleanup schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete cleanup schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}