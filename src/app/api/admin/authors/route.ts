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

    const authors = await prisma.author.findMany({
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return createSuccessResponse({ authors });
  } catch (error) {
    console.error('Error fetching authors:', error);
    return createErrorResponse('Failed to fetch authors', 500);
  }
}
