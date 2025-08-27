import { logger } from '@/lib/logger';

// Timezone and quiet hours utilities

export interface QuietHours {
  startHour: number; // 0-23
  endHour: number; // 0-23
  timezone: string; // IANA timezone
}

export interface TimezoneConfig {
  defaultTimezone: string;
  quietHours: QuietHours;
  enableQuietHours: boolean;
}

const defaultTimezoneConfig: TimezoneConfig = {
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'UTC',
  quietHours: {
    startHour: parseInt(process.env.QUIET_HOURS_START || '22'), // 10 PM
    endHour: parseInt(process.env.QUIET_HOURS_END || '8'), // 8 AM
    timezone: process.env.QUIET_HOURS_TIMEZONE || 'UTC',
  },
  enableQuietHours: process.env.ENABLE_QUIET_HOURS === 'true',
};

// Check if current time is within quiet hours for a timezone
export function isWithinQuietHours(
  timezone: string = defaultTimezoneConfig.defaultTimezone,
  quietHours: QuietHours = defaultTimezoneConfig.quietHours
): boolean {
  if (!defaultTimezoneConfig.enableQuietHours) {
    return false;
  }

  try {
    const now = new Date();
    const timeInTimezone = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(now);

    const currentHour = parseInt(timeInTimezone);
    const { startHour, endHour } = quietHours;

    // Handle cases where quiet hours span midnight
    if (startHour > endHour) {
      // e.g., 22:00 to 08:00 (spans midnight)
      return currentHour >= startHour || currentHour < endHour;
    } else {
      // e.g., 01:00 to 06:00 (same day)
      return currentHour >= startHour && currentHour < endHour;
    }
  } catch (error) {
    logger.error('Failed to check quiet hours', error as Error, { timezone });
    return false; // Default to allowing sends if timezone check fails
  }
}

// Get next available send time outside quiet hours
export function getNextAvailableSendTime(
  timezone: string = defaultTimezoneConfig.defaultTimezone,
  quietHours: QuietHours = defaultTimezoneConfig.quietHours
): Date {
  if (
    !defaultTimezoneConfig.enableQuietHours ||
    !isWithinQuietHours(timezone, quietHours)
  ) {
    return new Date(); // Can send now
  }

  try {
    const now = new Date();
    const timeInTimezone = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(now);

    const currentHour = parseInt(timeInTimezone);
    const { endHour } = quietHours;

    // Calculate hours until quiet hours end
    let hoursUntilEnd: number;
    if (currentHour < endHour) {
      hoursUntilEnd = endHour - currentHour;
    } else {
      hoursUntilEnd = 24 - currentHour + endHour;
    }

    // Add the hours to current time
    const nextSendTime = new Date(
      now.getTime() + hoursUntilEnd * 60 * 60 * 1000
    );
    return nextSendTime;
  } catch (error) {
    logger.error('Failed to calculate next send time', error as Error, {
      timezone,
    });
    return new Date(); // Default to now if calculation fails
  }
}

// Convert UTC time to user timezone
export function convertToUserTimezone(utcDate: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(utcDate);
  } catch (error) {
    logger.error('Failed to convert timezone', error as Error, { timezone });
    return utcDate.toISOString();
  }
}

// Get recipient timezone from preferences or fallback
export async function getRecipientTimezone(
  recipientId: string
): Promise<string> {
  try {
    const { prisma } = await import('@/lib/prisma');

    const preferences = await prisma.newsletterPreferences.findUnique({
      where: { recipientId },
      select: { timezone: true },
    });

    return preferences?.timezone || defaultTimezoneConfig.defaultTimezone;
  } catch (error) {
    logger.error('Failed to get recipient timezone', error as Error, {
      recipientId,
    });
    return defaultTimezoneConfig.defaultTimezone;
  }
}

// Batch check quiet hours for multiple recipients
export async function filterRecipientsForQuietHours(
  recipientIds: string[]
): Promise<{
  canSendNow: string[];
  delayedSends: Array<{
    recipientId: string;
    nextSendTime: Date;
    timezone: string;
  }>;
}> {
  const canSendNow: string[] = [];
  const delayedSends: Array<{
    recipientId: string;
    nextSendTime: Date;
    timezone: string;
  }> = [];

  for (const recipientId of recipientIds) {
    try {
      const timezone = await getRecipientTimezone(recipientId);

      if (!isWithinQuietHours(timezone)) {
        canSendNow.push(recipientId);
      } else {
        const nextSendTime = getNextAvailableSendTime(timezone);
        delayedSends.push({
          recipientId,
          nextSendTime,
          timezone,
        });
      }
    } catch (error) {
      logger.error(
        'Failed to check quiet hours for recipient',
        error as Error,
        { recipientId }
      );
      // Default to allowing send if check fails
      canSendNow.push(recipientId);
    }
  }

  return { canSendNow, delayedSends };
}

// Validate timezone string
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Get common timezones list
export function getCommonTimezones(): Array<{
  value: string;
  label: string;
  offset: string;
}> {
  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'UTC',
  ];

  return timezones.map((tz) => {
    try {
      const now = new Date();
      const offset =
        new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          timeZoneName: 'short',
        })
          .formatToParts(now)
          .find((part) => part.type === 'timeZoneName')?.value || '';

      return {
        value: tz,
        label: tz.replace(/_/g, ' '),
        offset,
      };
    } catch {
      return {
        value: tz,
        label: tz.replace(/_/g, ' '),
        offset: '',
      };
    }
  });
}
