import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendWelcomeEmail } from '@/lib/newsletter';
import { verifyToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find subscription by verification token
    const subscription = await prisma.newsletter.findUnique({
      where: { verificationToken: token },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification token' },
        { status: 404 }
      );
    }

    if (subscription.status === 'ACTIVE') {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified',
        data: {
          email: subscription.email,
          status: subscription.status,
        },
      });
    }

    // Update subscription status to active
    const updatedSubscription = await prisma.newsletter.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        verifiedAt: new Date(),
        verificationToken: null, // Clear the token after verification
      },
    });

    // Send welcome email
    await sendWelcomeEmail(subscription.email);

    logger.info('Newsletter subscription verified', {
      email: subscription.email,
      verifiedAt: updatedSubscription.verifiedAt,
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        '/newsletter/verified?email=' + encodeURIComponent(subscription.email),
        request.url
      )
    );
  } catch (error) {
    logger.error('Newsletter verification error', error);

    return NextResponse.json(
      { success: false, message: 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}
