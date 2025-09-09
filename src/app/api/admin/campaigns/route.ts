import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createCampaign,
  getCampaigns,
  CampaignData,
} from '@/lib/email-campaigns';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for campaign creation
const createCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject too long'),
  templateId: z.string().min(1, 'Template is required'),
  scheduledAt: z.string().datetime().optional(),
  recipientFilter: z
    .object({
      status: z.array(z.string()).optional(),
      subscribedAfter: z.string().datetime().optional(),
      subscribedBefore: z.string().datetime().optional(),
    })
    .optional(),
});

// GET /api/admin/campaigns - Get all campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await getCampaigns(page, limit);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Failed to fetch campaigns', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/admin/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createCampaignSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data: CampaignData = {
      title: validationResult.data.title,
      subject: validationResult.data.subject,
      templateId: validationResult.data.templateId,
      scheduledAt: validationResult.data.scheduledAt
        ? new Date(validationResult.data.scheduledAt)
        : undefined,
      recipientFilter: validationResult.data.recipientFilter
        ? {
            status: validationResult.data.recipientFilter.status,
            subscribedAfter: validationResult.data.recipientFilter
              .subscribedAfter
              ? new Date(validationResult.data.recipientFilter.subscribedAfter)
              : undefined,
            subscribedBefore: validationResult.data.recipientFilter
              .subscribedBefore
              ? new Date(validationResult.data.recipientFilter.subscribedBefore)
              : undefined,
          }
        : undefined,
    };

    const campaignId = await createCampaign(data);

    return NextResponse.json({
      success: true,
      campaignId,
      message: 'Campaign created successfully',
    });
  } catch (error) {
    logger.error('Failed to create campaign', error as Error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
