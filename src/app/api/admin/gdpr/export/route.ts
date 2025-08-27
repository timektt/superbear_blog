import { NextRequest, NextResponse } from 'next/server';
import { exportUserData } from '@/lib/data-lifecycle';
import { checkAdminAuth } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/admin/gdpr/export - Export user data (GDPR Article 15)
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(request, 'ADMIN');
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const result = await exportUserData(email);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to export user data' },
        { status: 500 }
      );
    }

    logger.info('User data exported via API', {
      email,
      exportedBy: authResult.user?.email,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    logger.error('Failed to export user data', error as Error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
