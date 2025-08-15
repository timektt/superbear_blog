import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateVerificationToken } from '@/lib/auth-utils';
import { sendVerificationEmail } from '@/lib/newsletter';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

// Validation schema for newsletter subscription
const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
  variant: z.string().optional(),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  preferences: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
      categories: z.array(z.string()).default([]),
      breakingNews: z.boolean().default(true),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per IP per 10 minutes
    const rateLimitResult = await rateLimit(request, {
      limit: 5,
      window: 10 * 60 * 1000, // 10 minutes
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many attempts. Try again in a minute.',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = subscribeSchema.parse(body);

    // Normalize email
    validatedData.email = validatedData.email.toLowerCase().trim();

    // Check if email already exists
    const existingSubscription = await prisma.newsletter.findUnique({
      where: { email: validatedData.email },
    });

    if (existingSubscription) {
      // If already subscribed and active
      if (existingSubscription.status === 'ACTIVE') {
        return NextResponse.json(
          {
            success: false,
            message: 'Email is already subscribed to our newsletter',
          },
          { status: 409 }
        );
      }

      // If previously unsubscribed, reactivate
      if (existingSubscription.status === 'UNSUBSCRIBED') {
        const verificationToken = generateVerificationToken();

        const updatedSubscription = await prisma.newsletter.update({
          where: { email: validatedData.email },
          data: {
            status: 'PENDING',
            verificationToken,
            subscribedAt: new Date(),
            unsubscribedAt: null,
            preferences:
              validatedData.preferences || existingSubscription.preferences,
            source: validatedData.utm_source || existingSubscription.source,
          },
        });

        // Send verification email
        await sendVerificationEmail(validatedData.email, verificationToken);

        logger.info('Newsletter resubscription initiated', {
          email: validatedData.email,
          variant: validatedData.variant,
          utm_source: validatedData.utm_source,
          utm_campaign: validatedData.utm_campaign,
          ip: request.ip,
          userAgent: request.headers.get('user-agent'),
        });

        return NextResponse.json({
          success: true,
          message: 'Please check your email to confirm your subscription',
          data: {
            email: updatedSubscription.email,
            status: updatedSubscription.status,
          },
        });
      }

      // If pending, resend verification
      if (existingSubscription.status === 'PENDING') {
        if (existingSubscription.verificationToken) {
          await sendVerificationEmail(
            validatedData.email,
            existingSubscription.verificationToken
          );
        }

        return NextResponse.json({
          success: true,
          message:
            'Verification email has been resent. Please check your inbox.',
        });
      }
    }

    // Create new subscription
    const verificationToken = generateVerificationToken();

    const newSubscription = await prisma.newsletter.create({
      data: {
        email: validatedData.email,
        status: 'PENDING',
        verificationToken,
        preferences: validatedData.preferences,
        source: validatedData.utm_source || 'website',
      },
    });

    // Send verification email
    await sendVerificationEmail(validatedData.email, verificationToken);

    logger.info('New newsletter subscription created', {
      email: validatedData.email,
      variant: validatedData.variant,
      utm_source: validatedData.utm_source,
      utm_campaign: validatedData.utm_campaign,
      ip: request.ip,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Please check your email to confirm your subscription',
        data: {
          email: newSubscription.email,
          status: newSubscription.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Newsletter subscription error', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input data',
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to subscribe to newsletter',
      },
      { status: 500 }
    );
  }
}

// Get subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const subscription = await prisma.newsletter.findUnique({
      where: { email },
      select: {
        email: true,
        status: true,
        subscribedAt: true,
        verifiedAt: true,
        preferences: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    logger.error('Newsletter status check error', error);

    return NextResponse.json(
      { success: false, message: 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}
