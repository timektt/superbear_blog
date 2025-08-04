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

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return createSuccessResponse({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return createErrorResponse('Failed to fetch categories', 500);
  }
}
