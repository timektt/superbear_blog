import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-utils';
import { getNewsletterStats } from '@/lib/newsletter';
import { logger } from '@/lib/logger';

// Get newsletter subscribers with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session; // Return error response
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'subscribedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.email = {
        contains: search,
      };
    }

    // Get subscribers with pagination
    const [subscribers, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          email: true,
          status: true,
          subscribedAt: true,
          verifiedAt: true,
          unsubscribedAt: true,
          source: true,
          preferences: true,
        },
      }),
      prisma.newsletter.count({ where }),
    ]);

    // Get statistics
    const stats = await getNewsletterStats();

    return NextResponse.json({
      success: true,
      data: {
        subscribers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        stats,
      },
    });

  } catch (error) {
    logger.error('Failed to fetch newsletter subscribers', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscribers' },
      { status: 500 }
    );
  }
}

// Bulk operations on subscribers
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session;
    }

    const body = await request.json();
    const { action, subscriberIds } = body;

    if (!action || !subscriberIds || !Array.isArray(subscriberIds)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let actionDescription = '';

    switch (action) {
      case 'activate':
        updateData = { status: 'ACTIVE', verifiedAt: new Date() };
        actionDescription = 'activated';
        break;
      case 'unsubscribe':
        updateData = { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() };
        actionDescription = 'unsubscribed';
        break;
      case 'delete':
        // Delete subscribers
        const deleteResult = await prisma.newsletter.deleteMany({
          where: {
            id: {
              in: subscriberIds,
            },
          },
        });

        logger.info('Bulk delete newsletter subscribers', {
          count: deleteResult.count,
          subscriberIds,
        });

        return NextResponse.json({
          success: true,
          message: `${deleteResult.count} subscribers deleted successfully`,
          data: { count: deleteResult.count },
        });
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update subscribers
    const updateResult = await prisma.newsletter.updateMany({
      where: {
        id: {
          in: subscriberIds,
        },
      },
      data: updateData,
    });

    logger.info(`Bulk ${actionDescription} newsletter subscribers`, {
      count: updateResult.count,
      subscriberIds,
    });

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} subscribers ${actionDescription} successfully`,
      data: { count: updateResult.count },
    });

  } catch (error) {
    logger.error('Failed to perform bulk operation on subscribers', error);
    return NextResponse.json(
      { success: false, message: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}