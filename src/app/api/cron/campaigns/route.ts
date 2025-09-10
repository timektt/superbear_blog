import { NextRequest, NextResponse } from 'next/server';
import { runCampaignScheduler } from '@/lib/campaign-scheduler';
import { processEmailQueue } from '@/lib/email-queue';
import { cleanupSoftBounces } from '@/lib/suppression';
import { runDataRetentionCleanup } from '@/lib/data-lifecycle';
import { checkRateLimit, checkIPAllowlist } from '@/lib/security-enhanced';
import { getSafePrismaClient } from '@/lib/db-safe/client';
import { handleApiError } from '@/lib/errors/handlers';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/cron/campaigns - Cron job endpoint for processing scheduled campaigns and email queue
export async function POST(request: NextRequest) {
  try {
    // Check IP allowlist
    if (!checkIPAllowlist(request)) {
      logger.warn('Cron job blocked by IP allowlist', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'IP not allowed' }, { status: 403 });
    }

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(request, 'cron');
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

    // Verify cron job authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job attempt', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Cron job triggered for campaign and queue processing');

    const results: {
      scheduler: any;
      queue: any;
      cleanup?: any;
      weeklyDigest?: any;
      dataRetention?: any;
    } = {
      scheduler: null,
      queue: null,
    };

    // 1. Process scheduled campaigns
    try {
      results.scheduler = await runCampaignScheduler();
      logger.info('Campaign scheduler completed');
    } catch (error) {
      logger.error('Campaign scheduler failed', error as Error);
      results.scheduler = { error: (error as Error).message };
    }

    // 2. Process email queue
    try {
      await processEmailQueue();
      results.queue = { success: true, message: 'Queue processing completed' };
      logger.info('Email queue processing completed');
    } catch (error) {
      logger.error('Email queue processing failed', error as Error);
      results.queue = { error: (error as Error).message };
    }

    // 3. Check for weekly digest creation (Sundays at 9 AM)
    const now = new Date();
    const weeklyDigestResult = await processWeeklyDigest(now);
    if (weeklyDigestResult) {
      results.weeklyDigest = weeklyDigestResult;
    }

    // 4. Cleanup soft bounces (run once per day)
    if (now.getHours() === 2 && now.getMinutes() < 5) {
      // Run at 2 AM
      try {
        await cleanupSoftBounces();
        results.cleanup = {
          success: true,
          message: 'Soft bounce cleanup completed',
        };
        logger.info('Soft bounce cleanup completed');
      } catch (error) {
        logger.error('Soft bounce cleanup failed', error as Error);
        results.cleanup = { error: (error as Error).message };
      }
    }

    // 5. Data retention cleanup (run once per day at 3 AM)
    if (now.getHours() === 3 && now.getMinutes() < 5) {
      try {
        const retentionResults = await runDataRetentionCleanup();
        results.dataRetention = retentionResults;
        logger.info('Data retention cleanup completed');
      } catch (error) {
        logger.error('Data retention cleanup failed', error as Error);
        results.dataRetention = { error: (error as Error).message };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cron job completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed', error as Error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET /api/cron/campaigns - Health check for cron job
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Campaign cron job endpoint is operational',
    });
  } catch (error) {
    logger.error('Cron health check failed', error as Error);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}

/**
 * Process weekly digest creation and scheduling
 */
async function processWeeklyDigest(now: Date): Promise<any | null> {
  try {
    // Check if it's time for weekly digest (every Sunday at 9 AM)
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const hour = now.getHours();

    // Only run on Sundays between 9-10 AM
    if (dayOfWeek !== 0 || hour !== 9) {
      return null;
    }

    const prisma = getSafePrismaClient();
    if (!prisma) {
      return {
        status: 'skipped',
        type: 'weekly_digest',
        message: 'Database unavailable',
      };
    }

    // Check if we already created a digest this week
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const existingDigest = await prisma.newsletterCampaign.findFirst({
      where: {
        title: {
          contains: 'Weekly Digest',
        },
        createdAt: {
          gte: weekStart,
        },
      },
    });

    if (existingDigest) {
      logger.info('Weekly digest already created this week');
      return null;
    }

    // Get top articles from the past week
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const topArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: weekAgo,
          lte: now,
        },
      },
      include: {
        author: true,
        category: true,
        tags: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 5,
    });

    if (topArticles.length === 0) {
      logger.info('No articles found for weekly digest');
      return {
        status: 'skipped',
        type: 'weekly_digest',
        message: 'No articles available',
      };
    }

    // Find or create weekly digest template
    let template = await prisma.emailTemplate.findFirst({
      where: {
        name: 'Weekly Digest Template',
      },
    });

    if (!template) {
      // Create default weekly digest template
      template = await prisma.emailTemplate.create({
        data: {
          name: 'Weekly Digest Template',
          subject: 'Weekly Tech Digest - {{week_date}}',
          htmlContent: generateWeeklyDigestTemplate(),
          category: 'NEWSLETTER',
          createdBy: 'system',
          variables: {
            week_date: 'Week of {{date}}',
            articles: '{{articles}}',
            unsubscribe_url: '{{unsubscribe_url}}',
          },
        },
      });
    }

    // Create weekly digest campaign
    const digestName = `Weekly Digest - ${now.toISOString().split('T')[0]}`;
    const scheduledAt = new Date(now);
    scheduledAt.setHours(10, 0, 0, 0); // Schedule for 10 AM same day

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        title: digestName,
        subject: digestName,
        templateId: template.id,
        status: 'SCHEDULED',
        scheduledAt,
        content: {
          type: 'weekly_digest',
          articles: topArticles.map((article) => ({
            id: article.id,
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            author: article.author.name,
            category: article.category.name,
            publishedAt: article.publishedAt,
          })),
          generatedAt: now.toISOString(),
        },
      },
    });

    logger.info(`Created weekly digest campaign: ${campaign.id}`);

    return {
      campaignId: campaign.id,
      name: campaign.title,
      status: 'scheduled',
      type: 'weekly_digest',
      scheduledAt: campaign.scheduledAt,
      articlesCount: topArticles.length,
    };
  } catch (error) {
    logger.error('Failed to process weekly digest', error as Error);
    return {
      status: 'failed',
      type: 'weekly_digest',
      error: (error as Error).message,
    };
  }
}

/**
 * Generate default weekly digest template
 */
function generateWeeklyDigestTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Tech Digest</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .article { margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
        .article h2 { color: #007bff; margin-bottom: 10px; }
        .article-meta { color: #666; font-size: 14px; margin-bottom: 10px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Weekly Tech Digest</h1>
            <p>{{week_date}}</p>
        </div>
        
        <div class="content">
            {{#each articles}}
            <div class="article">
                <h2><a href="{{../base_url}}/news/{{slug}}" style="color: #007bff; text-decoration: none;">{{title}}</a></h2>
                <div class="article-meta">
                    By {{author}} in {{category}} • {{publishedAt}}
                </div>
                <p>{{summary}}</p>
            </div>
            {{/each}}
        </div>
        
        <div class="footer">
            <p>Thanks for reading! <a href="{{base_url}}">Visit our website</a> for more tech news.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> from these emails.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}
