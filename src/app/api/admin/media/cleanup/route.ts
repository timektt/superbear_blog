import { NextRequest, NextResponse } from 'next/server';
import { cleanupEngine } from '@/lib/media/cleanup-engine';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { publicIds, dryRun = false } = body;

    // Validate input
    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return NextResponse.json(
        { error: 'publicIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (publicIds.some((id: unknown) => typeof id !== 'string' || !id.trim())) {
      return NextResponse.json(
        { error: 'All publicIds must be non-empty strings' },
        { status: 400 }
      );
    }

    // Perform cleanup
    const result = await cleanupEngine.cleanupOrphans(publicIds, dryRun);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error during cleanup operation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Cleanup operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Get cleanup history
    const history = await cleanupEngine.getCleanupHistory(limit);

    return NextResponse.json({
      success: true,
      data: {
        history,
        total: history.length
      }
    });

  } catch (error) {
    console.error('Error fetching cleanup history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cleanup history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}