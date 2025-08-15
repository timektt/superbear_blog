import { NextRequest, NextResponse } from 'next/server';
import { EmailBounceHandler } from '@/lib/email-compliance';

// POST /api/webhooks/email-bounce - Handle email bounces
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (implement based on your email service)
    const signature = request.headers.get('x-webhook-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const body = await request.json();
    
    // Process different types of bounce events
    switch (body.eventType) {
      case 'bounce':
        await EmailBounceHandler.processBounce({
          email: body.recipient,
          bounceType: body.bounceType === 'Permanent' ? 'hard' : 'soft',
          reason: body.reason || 'Unknown',
          timestamp: body.timestamp
        });
        break;

      case 'complaint':
        await EmailBounceHandler.processComplaint({
          email: body.recipient,
          timestamp: body.timestamp,
          feedbackType: body.feedbackType
        });
        break;

      default:
        console.log('Unknown email event type:', body.eventType);
    }

    return NextResponse.json({ status: 'processed' });

  } catch (error) {
    console.error('Error processing email webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}