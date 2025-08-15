import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json({
        active: 10000, // Fallback number
        total: 10000,
        verified: 10000,
        recent: 100,
      });
    }

    const [activeCount, totalCount, verifiedCount, recentCount] = await Promise.all([
      prisma.newsletter.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.newsletter.count(),
      prisma.newsletter.count({
        where: { 
          status: 'ACTIVE',
          verifiedAt: { not: null },
        },
      }),
      prisma.newsletter.count({
        where: {
          subscribedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return NextResponse.json({
      active: activeCount,
      total: totalCount,
      verified: verifiedCount,
      recent: recentCount,
    });

  } catch (error) {
    logger.error('Failed to get newsletter stats', error as Error);
    
    // Return fallback numbers on error
    return NextResponse.json({
      active: 10000,
      total: 10000,
      verified: 10000,
      recent: 100,
    });
  }
}