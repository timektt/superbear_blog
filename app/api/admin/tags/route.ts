import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/auth-utils';

export async function GET() {
  try {
    // Check authentication
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session; // Return error response
    }

    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return createSuccessResponse({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return createErrorResponse('Failed to fetch tags', 500);
  }
}
