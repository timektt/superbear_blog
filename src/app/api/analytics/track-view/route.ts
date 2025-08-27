import { NextRequest, NextResponse } from 'next/server';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { handleApiError } from '@/lib/errors/handlers';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/analytics/track-view - Track article view with unique visitor detection
export async function POST(request: NextRequest) {
  try {
    const prisma = getSafePrismaClient();
    if (!prisma) {
      // In safe mode, just return success without tracking
      return NextResponse.json({ success: true, tracked: false });
    }

    const {
      articleId,
      sessionId,
      userAgent,
      referrer,
      country,
      device,
      fingerprint,
    } = await request.json();

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // Verify article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true },
    });

    if (!article || article.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Article not found or not published' },
        { status: 404 }
      );
    }

    // Create privacy-compliant session hash
    const sessionHash =
      sessionId ||
      createHash('sha256')
        .update(`${userAgent || ''}-${request.ip || ''}-${Date.now()}`)
        .digest('hex');

    // Create browser fingerprint hash if provided
    const fingerprintHash = fingerprint
      ? createHash('sha256').update(fingerprint).digest('hex')
      : null;

    // Check if this is a unique view (same session within last hour)
    const recentView = await prisma.articleView.findFirst({
      where: {
        articleId,
        sessionId: sessionHash,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentView) {
      // Update existing view with additional data if needed
      return NextResponse.json({
        success: true,
        tracked: false,
        reason: 'duplicate_view',
        viewId: recentView.id,
      });
    }

    // Create new view record
    const view = await prisma.articleView.create({
      data: {
        articleId,
        sessionId: sessionHash,
        fingerprint: fingerprintHash,
        userAgent: userAgent?.substring(0, 500), // Limit length
        referrer: referrer?.substring(0, 500),
        country: country?.substring(0, 100),
        device: device?.substring(0, 50),
        timestamp: new Date(),
      },
    });

    // Update article stats asynchronously
    updateArticleStats(articleId).catch((error) => {
      logger.error('Failed to update article stats', error);
    });

    logger.info('Article view tracked', {
      articleId,
      viewId: view.id,
      sessionId: sessionHash,
      country,
      device,
    });

    return NextResponse.json({
      success: true,
      tracked: true,
      viewId: view.id,
    });
  } catch (error) {
    logger.error('Failed to track article view', error as Error);
    return handleApiError(error);
  }
}

// PUT /api/analytics/track-view - Update view with engagement metrics
export async function PUT(request: NextRequest) {
  try {
    const prisma = getSafePrismaClient();
    if (!prisma) {
      return NextResponse.json({ success: true, updated: false });
    }

    const {
      viewId,
      timeOnPage,
      scrollDepth,
      readingTime,
      bounced,
      linksClicked,
      socialShares,
      newsletterSignup,
    } = await request.json();

    if (!viewId) {
      return NextResponse.json(
        { error: 'View ID is required' },
        { status: 400 }
      );
    }

    // Update view with engagement metrics
    const updatedView = await prisma.articleView.update({
      where: { id: viewId },
      data: {
        timeOnPage: timeOnPage
          ? Math.max(0, Math.min(timeOnPage, 3600))
          : undefined, // Cap at 1 hour
        scrollDepth: scrollDepth
          ? Math.max(0, Math.min(scrollDepth, 100))
          : undefined, // 0-100%
        readingTime: readingTime
          ? Math.max(0, Math.min(readingTime, 3600))
          : undefined,
        bounced: bounced === true,
        linksClicked: linksClicked ? Math.max(0, linksClicked) : undefined,
        socialShares: socialShares ? Math.max(0, socialShares) : undefined,
        newsletterSignup: newsletterSignup === true,
      },
    });

    // Update article stats asynchronously
    updateArticleStats(updatedView.articleId).catch((error) => {
      logger.error(
        'Failed to update article stats after engagement update',
        error
      );
    });

    return NextResponse.json({
      success: true,
      updated: true,
      viewId: updatedView.id,
    });
  } catch (error) {
    logger.error('Failed to update view engagement', error as Error);
    return handleApiError(error);
  }
}

/**
 * Update aggregated article statistics
 */
async function updateArticleStats(articleId: string): Promise<void> {
  const prisma = getSafePrismaClient();
  if (!prisma) return;

  try {
    // Get all views for this article
    const views = await prisma.articleView.findMany({
      where: { articleId },
      select: {
        sessionId: true,
        timeOnPage: true,
        scrollDepth: true,
        bounced: true,
        readingTime: true,
        linksClicked: true,
        socialShares: true,
        newsletterSignup: true,
        timestamp: true,
      },
    });

    if (views.length === 0) return;

    // Calculate aggregated metrics
    const uniqueSessions = new Set(views.map((v) => v.sessionId));
    const validTimeOnPage = views.filter(
      (v) => v.timeOnPage && v.timeOnPage > 0
    );
    const validScrollDepth = views.filter(
      (v) => v.scrollDepth && v.scrollDepth > 0
    );
    const validReadingTime = views.filter(
      (v) => v.readingTime && v.readingTime > 0
    );

    const bounces = views.filter((v) => v.bounced).length;
    const completions = views.filter(
      (v) => v.scrollDepth && v.scrollDepth >= 80
    ).length;
    const totalShares = views.reduce(
      (sum, v) => sum + (v.socialShares || 0),
      0
    );
    const totalClicks = views.reduce(
      (sum, v) => sum + (v.linksClicked || 0),
      0
    );
    const newsletterSignups = views.filter((v) => v.newsletterSignup).length;

    // Time-based calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const viewsToday = views.filter((v) => v.timestamp >= today).length;
    const viewsThisWeek = views.filter((v) => v.timestamp >= thisWeek).length;
    const viewsThisMonth = views.filter((v) => v.timestamp >= thisMonth).length;

    // Calculate peak metrics
    const viewsByHour = new Map<string, number>();
    const viewsByDay = new Map<string, number>();

    views.forEach((view) => {
      const hour = view.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
      const day = view.timestamp.toISOString().substring(0, 10); // YYYY-MM-DD

      viewsByHour.set(hour, (viewsByHour.get(hour) || 0) + 1);
      viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1);
    });

    const peakViewsHour = Math.max(...Array.from(viewsByHour.values()), 0);
    const peakViewsDay = Math.max(...Array.from(viewsByDay.values()), 0);

    // Update or create article stats
    await prisma.articleStats.upsert({
      where: { articleId },
      create: {
        articleId,
        totalViews: views.length,
        uniqueViews: uniqueSessions.size,
        avgTimeOnPage:
          validTimeOnPage.length > 0
            ? validTimeOnPage.reduce((sum, v) => sum + (v.timeOnPage || 0), 0) /
              validTimeOnPage.length
            : null,
        avgScrollDepth:
          validScrollDepth.length > 0
            ? validScrollDepth.reduce(
                (sum, v) => sum + (v.scrollDepth || 0),
                0
              ) / validScrollDepth.length
            : null,
        bounceRate: views.length > 0 ? (bounces / views.length) * 100 : null,
        totalShares: totalShares,
        totalClicks: totalClicks,
        newsletterSignups,
        avgReadingTime:
          validReadingTime.length > 0
            ? validReadingTime.reduce(
                (sum, v) => sum + (v.readingTime || 0),
                0
              ) / validReadingTime.length
            : null,
        completionRate:
          views.length > 0 ? (completions / views.length) * 100 : null,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        peakViewsHour,
        peakViewsDay,
        lastCalculated: new Date(),
      },
      update: {
        totalViews: views.length,
        uniqueViews: uniqueSessions.size,
        avgTimeOnPage:
          validTimeOnPage.length > 0
            ? validTimeOnPage.reduce((sum, v) => sum + (v.timeOnPage || 0), 0) /
              validTimeOnPage.length
            : null,
        avgScrollDepth:
          validScrollDepth.length > 0
            ? validScrollDepth.reduce(
                (sum, v) => sum + (v.scrollDepth || 0),
                0
              ) / validScrollDepth.length
            : null,
        bounceRate: views.length > 0 ? (bounces / views.length) * 100 : null,
        totalShares: totalShares,
        totalClicks: totalClicks,
        newsletterSignups,
        avgReadingTime:
          validReadingTime.length > 0
            ? validReadingTime.reduce(
                (sum, v) => sum + (v.readingTime || 0),
                0
              ) / validReadingTime.length
            : null,
        completionRate:
          views.length > 0 ? (completions / views.length) * 100 : null,
        viewsToday,
        viewsThisWeek,
        viewsThisMonth,
        peakViewsHour,
        peakViewsDay,
        lastCalculated: new Date(),
      },
    });

    logger.debug('Article stats updated', {
      articleId,
      totalViews: views.length,
      uniqueViews: uniqueSessions.size,
    });
  } catch (error) {
    logger.error('Failed to update article stats', error as Error);
  }
}
