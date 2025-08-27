import { NextRequest, NextResponse } from 'next/server';
import {
  trackArticleView,
  trackArticleInteraction,
  updateReadingSession,
  generateSessionId,
} from '@/lib/analytics-core';
import { checkRateLimit } from '@/lib/security-enhanced';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors/handlers';
import { IS_DEVELOPMENT } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/analytics/track - Track analytics events
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for analytics endpoints
    const rateLimitResult = await checkRateLimit(
      request,
      'webhook',
      'analytics'
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(
              rateLimitResult.resetTime
            ).toISOString(),
          },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { type, articleId, sessionId, ...eventData } = body;

    // Development mode: Accept minimal payload and fill defaults
    if (IS_DEVELOPMENT) {
      // If missing required fields in development, fill with defaults and return success
      if (!type || !articleId) {
        // Log once per session to avoid spam
        const logKey = `analytics-dev-${request.headers.get('user-agent')?.substring(0, 20)}`;
        if (!global.devAnalyticsLogged) {
          global.devAnalyticsLogged = new Set();
        }

        if (!global.devAnalyticsLogged.has(logKey)) {
          logger.info(
            'Analytics in development mode - using defaults for missing fields'
          );
          global.devAnalyticsLogged.add(logKey);
        }

        return NextResponse.json({
          success: true,
          mode: 'development',
          message: 'Analytics tracking disabled in development mode',
        });
      }
    }

    // Production mode: Strict validation
    if (!type || !articleId) {
      const userAgent = request.headers.get('user-agent') || '';
      const referer = request.headers.get('referer') || '';

      // Skip logging for common bot/crawler requests
      const isBot = /bot|crawler|spider|scraper/i.test(userAgent);
      if (!isBot) {
        logger.warn('Analytics tracking failed - missing required fields', {
          type,
          articleId,
          userAgent: userAgent.substring(0, 100),
          referer,
          bodyKeys: Object.keys(body),
          body: JSON.stringify(body).substring(0, 500),
        });
      }

      return NextResponse.json(
        { error: 'Missing required fields: type, articleId' },
        { status: 400 }
      );
    }

    // Validate article ID format
    if (!articleId || typeof articleId !== 'string' || articleId.length < 10) {
      if (IS_DEVELOPMENT) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'Invalid article ID in development mode',
        });
      }

      logger.warn('Analytics tracking skipped - invalid article ID', {
        articleId,
      });
      return NextResponse.json({ success: true, skipped: true });
    }

    // Get client IP and user agent for session generation
    const clientIP =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Generate session ID if not provided
    const finalSessionId = sessionId || generateSessionId(userAgent, clientIP);

    let result: any = { success: true };

    if (type === 'view') {
      // Track article view
      const viewId = await trackArticleView({
        articleId,
        sessionId: finalSessionId,
        type: 'view',
        userAgent,
        referrer: eventData.referrer,
        country: await getCountryFromIP(clientIP),
        device: eventData.metadata?.device,
        timestamp: eventData.timestamp
          ? new Date(eventData.timestamp)
          : undefined,
        metadata: eventData.metadata,
      });

      result.viewId = viewId;
      result.sessionId = finalSessionId;

      // Update reading session
      await updateReadingSession(finalSessionId, {
        articlesRead: 1,
        pagesViewed: 1,
      });
    } else if (type === 'interaction') {
      // Track article interaction
      await trackArticleInteraction(
        {
          articleId,
          sessionId: finalSessionId,
          type: 'interaction',
          interactionType: eventData.interactionType,
          elementId: eventData.elementId,
          linkUrl: eventData.linkUrl,
          socialPlatform: eventData.socialPlatform,
          scrollPosition: eventData.scrollPosition,
          timeFromStart: eventData.timeFromStart,
          timestamp: eventData.timestamp
            ? new Date(eventData.timestamp)
            : undefined,
        },
        eventData.viewId
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/analytics/track - Update view with final metrics
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      viewId,
      timeOnPage,
      scrollDepth,
      linksClicked,
      socialShares,
      bounced,
    } = body;

    if (!viewId) {
      return NextResponse.json({ error: 'Missing viewId' }, { status: 400 });
    }

    // Update view record with final metrics
    const { prisma } = await import('@/lib/prisma');

    await prisma.articleView.update({
      where: { id: viewId },
      data: {
        timeOnPage,
        scrollDepth,
        linksClicked,
        socialShares,
        bounced,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Analytics update failed', error as Error);
    return NextResponse.json(
      { error: 'Failed to update analytics' },
      { status: 500 }
    );
  }
}

// Helper function to get country from IP (placeholder)
async function getCountryFromIP(ip: string): Promise<string | undefined> {
  // In production, use a service like MaxMind GeoIP or similar
  // For now, return undefined to maintain privacy
  return undefined;
}

// Declare global type for development logging
declare global {
  var devAnalyticsLogged: Set<string> | undefined;
}
