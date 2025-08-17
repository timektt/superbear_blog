import { NextRequest, NextResponse } from 'next/server';
import { processRightToBeForgotten } from '@/lib/data-lifecycle';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/admin/gdpr/forget - Process right to be forgotten (GDPR Article 17)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication (requires ADMIN level)
    const authResult = await checkAdminAuth(request, 'ADMIN');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { email, confirmDeletion } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!confirmDeletion) {
      return NextResponse.json(
        { error: 'Deletion confirmation is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const result = await processRightToBeForgotten(email);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Failed to process right to be forgotten',
          errors: result.errors 
        },
        { status: 500 }
      );
    }

    logger.warn('Right to be forgotten processed', {
      email,
      processedBy: authResult.user?.email,
      deletedRecords: result.deletedRecords,
    });

    return NextResponse.json({
      success: true,
      message: 'User data has been permanently deleted',
      deletedRecords: result.deletedRecords,
    });

  } catch (error) {
    logger.error('Failed to process right to be forgotten', error as Error);
    return NextResponse.json(
      { error: 'Failed to process right to be forgotten' },
      { status: 500 }
    );
  }
}