import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth-utils';
import { AdminRole } from '@prisma/client';

const prisma = getPrisma();

export async function GET(request: NextRequest) {
  try {
    // Check authentication and role (EDITOR can manage tags)
    const roleError = await requireRole(AdminRole.EDITOR);
    if (roleError) return roleError;

    if (!prisma) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
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

    return NextResponse.json({
      success: true,
      data: { tags }
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
