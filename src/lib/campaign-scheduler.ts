import { getScheduledCampaigns, sendCampaign } from '@/lib/email-campaigns';
import { logger } from '@/lib/logger';

// Process scheduled campaigns that are ready to be sent
export async function processScheduledCampaigns(): Promise<void> {
  try {
    logger.info('Processing scheduled campaigns...');

    const scheduledCampaigns = await getScheduledCampaigns();

    if (scheduledCampaigns.length === 0) {
      logger.info('No scheduled campaigns to process');
      return;
    }

    logger.info(
      `Found ${scheduledCampaigns.length} scheduled campaigns to process`
    );

    // Process each campaign
    for (const campaign of scheduledCampaigns) {
      try {
        logger.info(`Processing campaign: ${campaign.title}`, {
          campaignId: campaign.id,
        });

        await sendCampaign(campaign.id);

        logger.info(`Successfully sent scheduled campaign: ${campaign.title}`, {
          campaignId: campaign.id,
          recipients: campaign.recipients,
        });
      } catch (error) {
        logger.error(
          `Failed to send scheduled campaign: ${campaign.title}`,
          error as Error,
          {
            campaignId: campaign.id,
          }
        );

        // Continue processing other campaigns even if one fails
        continue;
      }
    }

    logger.info('Finished processing scheduled campaigns');
  } catch (error) {
    logger.error('Error processing scheduled campaigns', error as Error);
    throw error;
  }
}

// Check if campaign scheduler should run (every 5 minutes)
export function shouldRunScheduler(): boolean {
  const now = new Date();
  const minutes = now.getMinutes();

  // Run every 5 minutes (0, 5, 10, 15, etc.)
  return minutes % 5 === 0;
}

// Get next scheduled run time
export function getNextScheduledRun(): Date {
  const now = new Date();
  const nextRun = new Date(now);

  // Round up to next 5-minute interval
  const minutes = now.getMinutes();
  const nextMinutes = Math.ceil(minutes / 5) * 5;

  if (nextMinutes >= 60) {
    nextRun.setHours(nextRun.getHours() + 1);
    nextRun.setMinutes(0);
  } else {
    nextRun.setMinutes(nextMinutes);
  }

  nextRun.setSeconds(0);
  nextRun.setMilliseconds(0);

  return nextRun;
}

// Campaign scheduler status
export interface SchedulerStatus {
  isRunning: boolean;
  lastRun?: Date;
  nextRun: Date;
  scheduledCampaigns: number;
  errors: string[];
}

let schedulerStatus: SchedulerStatus = {
  isRunning: false,
  nextRun: getNextScheduledRun(),
  scheduledCampaigns: 0,
  errors: [],
};

// Get scheduler status
export function getSchedulerStatus(): SchedulerStatus {
  return { ...schedulerStatus };
}

// Update scheduler status
export function updateSchedulerStatus(updates: Partial<SchedulerStatus>): void {
  schedulerStatus = { ...schedulerStatus, ...updates };
}

// Run campaign scheduler (called by cron job or API endpoint)
export async function runCampaignScheduler(): Promise<SchedulerStatus> {
  if (schedulerStatus.isRunning) {
    logger.warn('Campaign scheduler is already running, skipping...');
    return schedulerStatus;
  }

  try {
    updateSchedulerStatus({
      isRunning: true,
      lastRun: new Date(),
      errors: [],
    });

    // Get count of scheduled campaigns
    const scheduledCampaigns = await getScheduledCampaigns();
    updateSchedulerStatus({ scheduledCampaigns: scheduledCampaigns.length });

    // Process campaigns
    await processScheduledCampaigns();

    // Update next run time
    updateSchedulerStatus({
      isRunning: false,
      nextRun: getNextScheduledRun(),
    });

    logger.info('Campaign scheduler completed successfully');
    return schedulerStatus;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    updateSchedulerStatus({
      isRunning: false,
      nextRun: getNextScheduledRun(),
      errors: [errorMessage],
    });

    logger.error('Campaign scheduler failed', error as Error);
    throw error;
  }
}
