import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const unsubscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = unsubscribeSchema.parse(body);

    // Find the subscription
    const subscription = await prisma.newsletter.findUnique({
      where: { email: validatedData.email },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status === 'UNSUBSCRIBED') {
      return NextResponse.json({
        success: true,
        message: 'Email is already unsubscribed',
      });
    }

    // Update subscription status to unsubscribed
    const updatedSubscription = await prisma.newsletter.update({
      where: { email: validatedData.email },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    });

    logger.info('Newsletter unsubscription', {
      email: validatedData.email,
      reason: validatedData.reason,
      unsubscribedAt: updatedSubscription.unsubscribedAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: {
        email: updatedSubscription.email,
        status: updatedSubscription.status,
      },
    });

  } catch (error) {
    logger.error('Newsletter unsubscription error', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input data',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    );
  }
}

// GET method for unsubscribe via email link
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // For security, you might want to implement a token-based unsubscribe
    // For now, we'll allow direct email unsubscribe
    const subscription = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (!subscription) {
      return NextResponse.redirect(
        new URL('/newsletter/unsubscribe?error=not_found', request.url)
      );
    }

    if (subscription.status === 'UNSUBSCRIBED') {
      return NextResponse.redirect(
        new URL('/newsletter/unsubscribe?status=already_unsubscribed', request.url)
      );
    }

    // Update subscription status
    await prisma.newsletter.update({
      where: { email },
      data: {
        status: 'UNSUBSCRIBED',
        unsubscribedAt: new Date(),
      },
    });

    logger.info('Newsletter unsubscription via link', { email });

    // Redirect to unsubscribe confirmation page
    return NextResponse.redirect(
      new URL('/newsletter/unsubscribe?status=success&email=' + encodeURIComponent(email), request.url)
    );

  } catch (error) {
    logger.error('Newsletter unsubscribe link error', error);

    return NextResponse.redirect(
      new URL('/newsletter/unsubscribe?error=server_error', request.url)
    );
  }
}