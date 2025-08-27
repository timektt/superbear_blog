import { NextRequest, NextResponse } from 'next/server';
import { getCompressionStats } from '@/lib/compression';
import { checkAdminAuth } from '@/lib/security-enhanced';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/system/compression - Get compression configuration and stats
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication for system endpoints
    const authResult = await checkAdminAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = getCompressionStats();

    // Test compression with sample data
    const sampleData = JSON.stringify({
      message: 'This is a sample response to test compression',
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        title: `Sample Article ${i}`,
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(
            10
          ),
        tags: ['tech', 'development', 'javascript'],
        metadata: {
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100),
          created: new Date().toISOString(),
        },
      })),
    });

    const originalSize = Buffer.byteLength(sampleData, 'utf8');

    return NextResponse.json(
      {
        compression: {
          enabled: true,
          ...stats,
          test: {
            sampleDataSize: originalSize,
            compressionThreshold: stats.defaultThreshold,
            wouldCompress: originalSize > stats.defaultThreshold!,
          },
        },
        nextjs: {
          compressionEnabled: true, // Next.js compress: true
          gzipSupported: true,
          brotliSupported: true,
        },
        headers: {
          acceptEncoding: request.headers.get('accept-encoding'),
          userAgent: request.headers.get('user-agent'),
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'X-Compression-Test': 'enabled',
        },
      }
    );
  } catch (error) {
    console.error('Compression stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get compression stats' },
      { status: 500 }
    );
  }
}
