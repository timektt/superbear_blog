import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { StructuredLogger } from '@/lib/observability';
import { emailQueue } from '@/lib/email-queue';

// Campaign control system for pause/resume/cancel operations

export interface CampaignControlState {
  campaignId: string;
  status: 'RUNNING' | 'PAUSED' | 'CANCELLED' | 'COMPLETED';
  pausedAt?: Date;
  resumedAt?: Date;
  cancelledAt?: Date;
  reason?: string;
  pausedBy?: string;
}

// In-memory campaign control state (in production, use Redis)
const campaignControlState = new Map<string, CampaignControlState>();

// Pause campaign
export async function pauseCampaign(
  campaignId: string,
  reason: string = 'Manual pause',
  pausedBy?: string
): Promise<{ success: boolean; message: string }> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'pause_campaign',
    campaignId,
    pausedBy,
  });

  try {
    // Check if campaign exists and is in a pausable state
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }

    if (!['QUEUED', 'SENDING'].includes(campaign.status)) {
      return {
        success: false,
        message: `Cannot pause campaign in ${campaign.status} status`,
      };
    }

    // Update campaign status to PAUSED
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    });

    // Set control state
    campaignControlState.set(campaignId, {
      campaignId,
      status: 'PAUSED',
      pausedAt: new Date(),
      reason,
      pausedBy,
    });

    structuredLogger.info('Campaign paused successfully', { reason });

    return { success: true, message: 'Campaign paused successfully' };

  } catch (error) {
    structuredLogger.error('Failed to pause campaign', error as Error);
    return { success: false, message: 'Failed to pause campaign' };
  }
}

// Resume campaign
export async function resumeCampaign(
  campaignId: string,
  resumedBy?: string
): Promise<{ success: boolean; message: string }> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'resume_campaign',
    campaignId,
    resumedBy,
  });

  try {
    // Check if campaign exists and is paused
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }

    if (campaign.status !== 'PAUSED') {
      return {
        success: false,
        message: `Cannot resume campaign in ${campaign.status} status`,
      };
    }

    // Check if there are pending deliveries
    const pendingDeliveries = await prisma.campaignDelivery.count({
      where: {
        campaignId,
        status: { in: ['QUEUED', 'FAILED'] },
      },
    });

    if (pendingDeliveries === 0) {
      // No pending deliveries, mark as completed
      await prisma.newsletterCampaign.update({
        where: { id: campaignId },
        data: { status: 'COMPLETED' },
      });

      campaignControlState.set(campaignId, {
        campaignId,
        status: 'COMPLETED',
        resumedAt: new Date(),
      });

      return { success: true, message: 'Campaign completed (no pending deliveries)' };
    }

    // Resume campaign
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' },
    });

    // Update control state
    const currentState = campaignControlState.get(campaignId);
    campaignControlState.set(campaignId, {
      ...currentState!,
      status: 'RUNNING',
      resumedAt: new Date(),
    });

    structuredLogger.info('Campaign resumed successfully', { pendingDeliveries });

    return { success: true, message: `Campaign resumed with ${pendingDeliveries} pending deliveries` };

  } catch (error) {
    structuredLogger.error('Failed to resume campaign', error as Error);
    return { success: false, message: 'Failed to resume campaign' };
  }
}

// Cancel campaign
export async function cancelCampaign(
  campaignId: string,
  reason: string = 'Manual cancellation',
  cancelledBy?: string
): Promise<{ success: boolean; message: string; cancelledDeliveries: number }> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'cancel_campaign',
    campaignId,
    cancelledBy,
  });

  try {
    // Check if campaign exists
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return { success: false, message: 'Campaign not found', cancelledDeliveries: 0 };
    }

    if (['COMPLETED', 'CANCELLED'].includes(campaign.status)) {
      return {
        success: false,
        message: `Campaign already ${campaign.status.toLowerCase()}`,
        cancelledDeliveries: 0,
      };
    }

    // Cancel pending deliveries
    const cancelledDeliveries = await prisma.campaignDelivery.updateMany({
      where: {
        campaignId,
        status: { in: ['QUEUED', 'FAILED'] },
      },
      data: {
        status: 'FAILED',
        lastError: `Campaign cancelled: ${reason}`,
      },
    });

    // Update campaign status
    await prisma.newsletterCampaign.update({
      where: { id: campaignId },
      data: { status: 'CANCELLED' },
    });

    // Set control state
    campaignControlState.set(campaignId, {
      campaignId,
      status: 'CANCELLED',
      cancelledAt: new Date(),
      reason,
      pausedBy: cancelledBy,
    });

    structuredLogger.info('Campaign cancelled successfully', {
      reason,
      cancelledDeliveries: cancelledDeliveries.count,
    });

    return {
      success: true,
      message: 'Campaign cancelled successfully',
      cancelledDeliveries: cancelledDeliveries.count,
    };

  } catch (error) {
    structuredLogger.error('Failed to cancel campaign', error as Error);
    return { success: false, message: 'Failed to cancel campaign', cancelledDeliveries: 0 };
  }
}

// Check if campaign should be paused (called by queue processor)
export function shouldPauseCampaign(campaignId: string): boolean {
  const controlState = campaignControlState.get(campaignId);
  return controlState?.status === 'PAUSED';
}

// Get campaign control status
export function getCampaignControlStatus(campaignId: string): CampaignControlState | null {
  return campaignControlState.get(campaignId) || null;
}

// Get all campaign control states
export function getAllCampaignControlStates(): Map<string, CampaignControlState> {
  return new Map(campaignControlState);
}

// Emergency stop all campaigns
export async function emergencyStopAllCampaigns(
  reason: string = 'Emergency stop',
  stoppedBy?: string
): Promise<{ success: boolean; message: string; affectedCampaigns: string[] }> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'emergency_stop_all',
    stoppedBy,
  });

  try {
    // Get all active campaigns
    const activeCampaigns = await prisma.newsletterCampaign.findMany({
      where: {
        status: { in: ['QUEUED', 'SENDING'] },
      },
      select: { id: true, title: true },
    });

    const affectedCampaigns: string[] = [];

    // Pause each active campaign
    for (const campaign of activeCampaigns) {
      const result = await pauseCampaign(campaign.id, reason, stoppedBy);
      if (result.success) {
        affectedCampaigns.push(campaign.id);
      }
    }

    structuredLogger.info('Emergency stop completed', {
      reason,
      affectedCampaigns: affectedCampaigns.length,
    });

    return {
      success: true,
      message: `Emergency stop completed. ${affectedCampaigns.length} campaigns paused.`,
      affectedCampaigns,
    };

  } catch (error) {
    structuredLogger.error('Emergency stop failed', error as Error);
    return {
      success: false,
      message: 'Emergency stop failed',
      affectedCampaigns: [],
    };
  }
}

// Retry failed deliveries
export async function retryFailedDeliveries(
  campaignId: string,
  maxRetries: number = 3
): Promise<{ success: boolean; message: string; retriedCount: number }> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'retry_failed_deliveries',
    campaignId,
  });

  try {
    // Get failed deliveries that haven't exceeded max retries
    const failedDeliveries = await prisma.campaignDelivery.findMany({
      where: {
        campaignId,
        status: 'FAILED',
        attempts: { lt: maxRetries },
      },
    });

    if (failedDeliveries.length === 0) {
      return {
        success: true,
        message: 'No failed deliveries to retry',
        retriedCount: 0,
      };
    }

    // Reset failed deliveries to QUEUED
    const updated = await prisma.campaignDelivery.updateMany({
      where: {
        id: { in: failedDeliveries.map((d) => d.id) },
      },
      data: {
        status: 'QUEUED',
        lastError: null,
      },
    });

    // Re-queue the deliveries
    for (const delivery of failedDeliveries) {
      await emailQueue.addEmailJob({
        campaignId: delivery.campaignId,
        recipientId: delivery.recipientId,
        recipientEmail: delivery.recipientEmail,
        deliveryId: delivery.id,
        priority: 2, // Lower priority for retries
      });
    }

    structuredLogger.info('Failed deliveries retried', {
      retriedCount: updated.count,
    });

    return {
      success: true,
      message: `${updated.count} failed deliveries queued for retry`,
      retriedCount: updated.count,
    };

  } catch (error) {
    structuredLogger.error('Failed to retry deliveries', error as Error);
    return {
      success: false,
      message: 'Failed to retry deliveries',
      retriedCount: 0,
    };
  }
}

// Move failed deliveries to Dead Letter Queue
export async function moveToDeadLetterQueue(
  campaignId: string,
  maxAttempts: number = 3
): Promise<{ success: boolean; message: string; movedCount: number }> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'move_to_dlq',
    campaignId,
  });

  try {
    // Find deliveries that have exceeded max attempts
    const deadLetterDeliveries = await prisma.campaignDelivery.findMany({
      where: {
        campaignId,
        status: 'FAILED',
        attempts: { gte: maxAttempts },
      },
    });

    if (deadLetterDeliveries.length === 0) {
      return {
        success: true,
        message: 'No deliveries to move to DLQ',
        movedCount: 0,
      };
    }

    // Update status to indicate DLQ
    const updated = await prisma.campaignDelivery.updateMany({
      where: {
        id: { in: deadLetterDeliveries.map((d) => d.id) },
      },
      data: {
        status: 'FAILED',
        lastError: 'Moved to Dead Letter Queue after max attempts',
      },
    });

    structuredLogger.info('Deliveries moved to DLQ', {
      movedCount: updated.count,
    });

    return {
      success: true,
      message: `${updated.count} deliveries moved to Dead Letter Queue`,
      movedCount: updated.count,
    };

  } catch (error) {
    structuredLogger.error('Failed to move deliveries to DLQ', error as Error);
    return {
      success: false,
      message: 'Failed to move deliveries to DLQ',
      movedCount: 0,
    };
  }
}

// Get campaign statistics
export async function getCampaignStatistics(campaignId: string): Promise<{
  total: number;
  queued: number;
  sending: number;
  sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
}> {
  const stats = await prisma.campaignDelivery.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: { status: true },
  });

  const result = {
    total: 0,
    queued: 0,
    sending: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
  };

  stats.forEach((stat) => {
    const count = stat._count.status;
    result.total += count;

    switch (stat.status) {
      case 'QUEUED':
        result.queued = count;
        break;
      case 'SENDING':
        result.sending = count;
        break;
      case 'SENT':
        result.sent = count;
        break;
      case 'DELIVERED':
        result.delivered = count;
        break;
      case 'FAILED':
        result.failed = count;
        break;
      case 'OPENED':
        result.opened = count;
        break;
      case 'CLICKED':
        result.clicked = count;
        break;
      case 'BOUNCED':
        result.bounced = count;
        break;
      case 'COMPLAINED':
        result.complained = count;
        break;
    }
  });

  return result;
}