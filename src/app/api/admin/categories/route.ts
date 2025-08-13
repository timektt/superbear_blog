import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-utils';
import { AdminRole } from '@prisma/client';

const prisma = getPrisma();

export async function GET(request: NextRequest) {
  try {
    // Check authentication and role (EDITOR can manage categories)
    const roleError = await requireRole(AdminRole.EDITOR);
    if (roleError) return roleError;

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
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

    return NextResponse.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
