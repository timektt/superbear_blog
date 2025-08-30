import { NextRequest, NextResponse } from 'next/server';
import { cleanupEngine } from '@/lib/media/cleanup-engine';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const olderThanParam = searchParams.get('olderThan');
    const preview = searchParams.get('preview') === 'true';

    let olderThan: Date | undefined;
    if (olderThanParam) {
      olderThan = new Date(olderThanParam);
      if (isNaN(olderThan.getTime())) {
        return NextResponse.json(
          { error: 'Invalid olderThan date format' },
          { status: 400 }
        );
      }
    }

    if (preview) {
      // Return preview with verification details
      const previewResult = await cleanupEngine.previewCleanup(olderThan);
      return NextResponse.json({
        success: true,
        data: previewResult
      });
    } else {
      // Return just the orphaned files
      const orphans = await cleanupEngine.findOrphanedMedia(olderThan);
      const statistics = await cleanupEngine.getOrphanStatistics();
      
      return NextResponse.json({
        success: true,
        data: {
          orphans,
          statistics
        }
      });
    }
  } catch (error) {
    console.error('Error fetching orphaned media:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orphaned media',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}