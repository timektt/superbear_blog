import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getSuppressionStats, 
  exportSuppressionList, 
  addSuppression, 
  removeSuppression,
  bulkAddSuppressions 
} from '@/lib/suppression';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const addSuppressionSchema = z.object({
  email: z.string().email('Invalid email address'),
  reason: z.enum(['HARD_BOUNCE', 'SOFT_BOUNCE', 'COMPLAINT', 'UNSUBSCRIBE', 'MANUAL', 'INVALID_EMAIL', 'BLOCKED']),
  source: z.string().optional(),
  bounceType: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
});

const bulkSuppressionSchema = z.object({
  suppressions: z.array(addSuppressionSchema),
});

// GET /api/admin/suppressions - Get suppression statistics and list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const reason = searchParams.get('reason') as any;

    if (action === 'export') {
      // Export suppression list
      const suppressions = await exportSuppressionList(reason);
      
      return NextResponse.json({
        success: true,
        suppressions,
        count: suppressions.length,
        exportedAt: new Date().toISOString(),
      });
    }

    // Get statistics
    const stats = await getSuppressionStats();
    
    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    logger.error('Failed to get suppression data', error as Error);
    return NextResponse.json(
      { error: 'Failed to get suppression data' },
      { status: 500 }
    );
  }
}

// POST /api/admin/suppressions - Add suppression(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Check if it's bulk or single suppression
    if (body.suppressions && Array.isArray(body.suppressions)) {
      // Bulk suppression
      const validationResult = bulkSuppressionSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationResult.error.errors },
          { status: 400 }
        );
      }

      await bulkAddSuppressions(validationResult.data.suppressions);
      
      return NextResponse.json({
        success: true,
        message: `${validationResult.data.suppressions.length} suppressions added`,
        count: validationResult.data.suppressions.length,
      });
      
    } else {
      // Single suppression
      const validationResult = addSuppressionSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validationResult.error.errors },
          { status: 400 }
        );
      }

      await addSuppression(validationResult.data);
      
      return NextResponse.json({
        success: true,
        message: 'Suppression added successfully',
        email: validationResult.data.email,
      });
    }

  } catch (error) {
    logger.error('Failed to add suppression', error as Error);
    return NextResponse.json(
      { error: 'Failed to add suppression' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/suppressions - Remove suppression
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    await removeSuppression(email);
    
    return NextResponse.json({
      success: true,
      message: 'Suppression removed successfully',
      email,
    });

  } catch (error) {
    logger.error('Failed to remove suppression', error as Error);
    return NextResponse.json(
      { error: 'Failed to remove suppression' },
      { status: 500 }
    );
  }
}