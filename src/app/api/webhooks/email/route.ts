import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleWebhookEvent } from '@/lib/suppression';
import { prisma } from '@/lib/prisma';
import {
  verifyWebhookSignature,
  checkRateLimit,
} from '@/lib/security-enhanced';
import { StructuredLogger } from '@/lib/observability';

export const runtime = 'nodejs';

// Parse webhook payload based on provider
function parseWebhookPayload(payload: any, provider: string) {
  switch (provider) {
    case 'sendgrid':
      return parseSendGridWebhook(payload);
    case 'mailgun':
      return parseMailgunWebhook(payload);
    case 'postmark':
      return parsePostmarkWebhook(payload);
    case 'resend':
      return parseResendWebhook(payload);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// SendGrid webhook parser
function parseSendGridWebhook(events: any[]) {
  return events.map((event) => ({
    email: event.email,
    type: mapSendGridEventType(event.event),
    timestamp: new Date(event.timestamp * 1000),
    campaignId: event.unique_args?.campaign_id,
    bounceType: event.type, // hard/soft
    reason: event.reason,
    userAgent: event.useragent,
    ipAddress: event.ip,
    linkUrl: event.url,
    providerEventId: event.sg_event_id,
    providerData: event,
  }));
}

// Mailgun webhook parser
function parseMailgunWebhook(event: any) {
  return [
    {
      email: event['event-data']?.recipient,
      type: mapMailgunEventType(event['event-data']?.event),
      timestamp: new Date(event['event-data']?.timestamp * 1000),
      campaignId: event['event-data']?.['user-variables']?.campaign_id,
      bounceType: event['event-data']?.severity, // permanent/temporary
      reason: event['event-data']?.reason,
      userAgent: event['event-data']?.['client-info']?.['user-agent'],
      ipAddress: event['event-data']?.['client-info']?.['client-ip'],
      linkUrl: event['event-data']?.url,
      providerEventId: event['event-data']?.id,
      providerData: event,
    },
  ];
}

// Postmark webhook parser
function parsePostmarkWebhook(event: any) {
  return [
    {
      email: event.Email,
      type: mapPostmarkEventType(event.Type),
      timestamp: new Date(event.BouncedAt || event.ReceivedAt),
      campaignId: event.Metadata?.campaign_id,
      bounceType: event.Type === 'HardBounce' ? 'hard' : 'soft',
      reason: event.Description,
      userAgent: event.UserAgent,
      ipAddress: event.OriginalLink ? undefined : event.ClientIP,
      linkUrl: event.OriginalLink,
      providerEventId: event.MessageID,
      providerData: event,
    },
  ];
}

// Resend webhook parser
function parseResendWebhook(event: any) {
  return [
    {
      email: event.data.to[0],
      type: mapResendEventType(event.type),
      timestamp: new Date(event.created_at),
      campaignId: event.data.tags?.campaign_id,
      bounceType: event.data.bounce_type,
      reason: event.data.bounce_reason,
      linkUrl: event.data.link?.url,
      providerEventId: event.data.email_id,
      providerData: event,
    },
  ];
}

// Event type mappers
function mapSendGridEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    delivered: 'DELIVERED',
    open: 'OPENED',
    click: 'CLICKED',
    bounce: 'BOUNCED',
    dropped: 'BOUNCED',
    spamreport: 'COMPLAINED',
    unsubscribe: 'UNSUBSCRIBED',
    group_unsubscribe: 'UNSUBSCRIBED',
  };
  return mapping[eventType] || 'UNKNOWN';
}

function mapMailgunEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    delivered: 'DELIVERED',
    opened: 'OPENED',
    clicked: 'CLICKED',
    bounced: 'BOUNCED',
    failed: 'BOUNCED',
    complained: 'COMPLAINED',
    unsubscribed: 'UNSUBSCRIBED',
  };
  return mapping[eventType] || 'UNKNOWN';
}

function mapPostmarkEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    Delivery: 'DELIVERED',
    Open: 'OPENED',
    Click: 'CLICKED',
    Bounce: 'BOUNCED',
    HardBounce: 'BOUNCED',
    SoftBounce: 'BOUNCED',
    SpamComplaint: 'COMPLAINED',
    SubscriptionChange: 'UNSUBSCRIBED',
  };
  return mapping[eventType] || 'UNKNOWN';
}

function mapResendEventType(eventType: string): string {
  const mapping: Record<string, string> = {
    'email.delivered': 'DELIVERED',
    'email.opened': 'OPENED',
    'email.clicked': 'CLICKED',
    'email.bounced': 'BOUNCED',
    'email.complained': 'COMPLAINED',
    'email.unsubscribed': 'UNSUBSCRIBED',
  };
  return mapping[eventType] || 'UNKNOWN';
}

// POST /api/webhooks/email - Handle email provider webhooks
export async function POST(request: NextRequest) {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'webhook_email_processing',
  });

  try {
    // Check rate limiting
    const rateLimitResult = await checkRateLimit(request, 'webhook');
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

    const body = await request.text();
    const signature =
      request.headers.get('x-signature') ||
      request.headers.get('signature') ||
      request.headers.get('x-mailgun-signature-v2') ||
      request.headers.get('x-postmark-signature') ||
      request.headers.get('svix-signature') ||
      '';

    // Determine provider from headers or URL params
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'sendgrid';
    const timestamp =
      request.headers.get('x-timestamp') || request.headers.get('timestamp');

    // Verify webhook signature with replay protection
    const webhookSecret =
      process.env.WEBHOOK_SECRET || process.env.EMAIL_WEBHOOK_SECRET;
    if (webhookSecret) {
      const verificationResult = verifyWebhookSignature(
        body,
        signature,
        webhookSecret,
        provider as any,
        timestamp || undefined
      );

      if (!verificationResult.valid) {
        structuredLogger.warn('Invalid webhook signature', {
          provider,
          error: verificationResult.error,
          signature: signature.substring(0, 20),
        });
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const payload = JSON.parse(body);
    const events = parseWebhookPayload(payload, provider);

    logger.info(`Processing ${events.length} webhook events from ${provider}`);

    // Process each event
    for (const event of events) {
      try {
        // Skip events without email
        if (!event.email) {
          continue;
        }

        // Record event in database
        await prisma.newsletterEvent.create({
          data: {
            recipientEmail: event.email,
            campaignId: event.campaignId,
            type: event.type as any,
            timestamp: event.timestamp,
            userAgent: (event as any).userAgent || null,
            ipAddress: (event as any).ipAddress || null,
            linkUrl: event.linkUrl,
            providerEventId: event.providerEventId,
            providerData: event.providerData,
          },
        });

        // Update delivery status if exists
        if (event.campaignId) {
          await prisma.campaignDelivery.updateMany({
            where: {
              campaignId: event.campaignId,
              recipientEmail: event.email,
            },
            data: {
              status: event.type as any,
              ...(event.type === 'DELIVERED' && {
                deliveredAt: event.timestamp,
              }),
              ...(event.type === 'OPENED' && { openedAt: event.timestamp }),
              ...(event.type === 'CLICKED' && { clickedAt: event.timestamp }),
              ...(event.type === 'BOUNCED' && { bouncedAt: event.timestamp }),
              ...(event.type === 'COMPLAINED' && {
                complainedAt: event.timestamp,
              }),
            },
          });
        }

        // Handle suppressions
        if (['BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED'].includes(event.type)) {
          await handleWebhookEvent({
            email: event.email,
            type: event.type.toLowerCase() as any,
            bounceType:
              event.bounceType === 'permanent' || event.bounceType === 'hard'
                ? 'hard'
                : 'soft',
            reason: event.reason,
            campaignId: event.campaignId,
          });
        }

        logger.debug('Webhook event processed', {
          email: event.email,
          type: event.type,
          campaignId: event.campaignId,
        });
      } catch (error) {
        logger.error('Failed to process webhook event', error as Error, {
          event,
        });
        // Continue processing other events
      }
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
      message: 'Webhook events processed successfully',
    });
  } catch (error) {
    logger.error('Webhook processing failed', error as Error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET /api/webhooks/email - Webhook health check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || 'unknown';

  return NextResponse.json({
    status: 'healthy',
    provider,
    timestamp: new Date().toISOString(),
    message: 'Email webhook endpoint is operational',
  });
}
