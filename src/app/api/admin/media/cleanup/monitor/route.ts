import { NextRequest, NextResponse } from 'next/server';
import { cleanupMonitor } from '@/lib/media/cleanup-monitor';
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
    const type = searchParams.get('type') || 'metrics';

    switch (type) {
      case 'metrics':
        const metrics = await cleanupMonitor.getMetrics();
        return NextResponse.json({
          success: true,
          data: metrics
        });

      case 'health':
        const health = await cleanupMonitor.getHealthStatus();
        return NextResponse.json({
          success: true,
          data: health
        });

      case 'recommendations':
        const recommendations = await cleanupMonitor.getRecommendations();
        return NextResponse.json({
          success: true,
          data: {
            recommendations
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: metrics, health, or recommendations' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error fetching cleanup monitoring data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}