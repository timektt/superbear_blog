// @ts-nocheck
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { StructuredLogger } from '@/lib/observability';
import { hashPII } from '@/lib/security-enhanced';

// Data lifecycle and GDPR compliance utilities

export interface RetentionPolicy {
  newsletterEvents: number; // days
  campaignSnapshots: number; // days
  campaignDeliveries: number; // days
  suppressions: number; // days (0 = never delete)
  auditLogs: number; // days
}

const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  newsletterEvents: parseInt(process.env.RETENTION_NEWSLETTER_EVENTS || '180'), // 6 months
  campaignSnapshots: parseInt(
    process.env.RETENTION_CAMPAIGN_SNAPSHOTS || '730'
  ), // 2 years
  campaignDeliveries: parseInt(
    process.env.RETENTION_CAMPAIGN_DELIVERIES || '365'
  ), // 1 year
  suppressions: parseInt(process.env.RETENTION_SUPPRESSIONS || '0'), // Never delete (compliance)
  auditLogs: parseInt(process.env.RETENTION_AUDIT_LOGS || '2555'), // 7 years
};

// Data retention cleanup
export async function runDataRetentionCleanup(): Promise<{
  cleaned: Record<string, number>;
  errors: string[];
}> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'data_retention_cleanup',
  });

  const results = {
    cleaned: {} as Record<string, number>,
    errors: [] as string[],
  };

  structuredLogger.info('Starting data retention cleanup');

  try {
    // Clean newsletter events
    if (DEFAULT_RETENTION_POLICY.newsletterEvents > 0) {
      const eventsCutoff = new Date(
        Date.now() -
          DEFAULT_RETENTION_POLICY.newsletterEvents * 24 * 60 * 60 * 1000
      );

      const deletedEvents = await prisma.newsletterEvent.deleteMany({
        where: {
          timestamp: { lt: eventsCutoff },
        },
      });

      results.cleaned.newsletterEvents = deletedEvents.count;
      structuredLogger.info('Cleaned newsletter events', {
        count: deletedEvents.count,
      });
    }

    // Clean old campaign snapshots
    if (DEFAULT_RETENTION_POLICY.campaignSnapshots > 0) {
      const snapshotsCutoff = new Date(
        Date.now() -
          DEFAULT_RETENTION_POLICY.campaignSnapshots * 24 * 60 * 60 * 1000
      );

      const deletedSnapshots = await prisma.campaignSnapshot.deleteMany({
        where: {
          generatedAt: { lt: snapshotsCutoff },
        },
      });

      results.cleaned.campaignSnapshots = deletedSnapshots.count;
      structuredLogger.info('Cleaned campaign snapshots', {
        count: deletedSnapshots.count,
      });
    }

    // Clean old campaign deliveries
    if (DEFAULT_RETENTION_POLICY.campaignDeliveries > 0) {
      const deliveriesCutoff = new Date(
        Date.now() -
          DEFAULT_RETENTION_POLICY.campaignDeliveries * 24 * 60 * 60 * 1000
      );

      const deletedDeliveries = await prisma.campaignDelivery.deleteMany({
        where: {
          createdAt: { lt: deliveriesCutoff },
        },
      });

      results.cleaned.campaignDeliveries = deletedDeliveries.count;
      structuredLogger.info('Cleaned campaign deliveries', {
        count: deletedDeliveries.count,
      });
    }

    structuredLogger.info('Data retention cleanup completed', {
      results: results.cleaned,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(errorMessage);
    structuredLogger.error('Data retention cleanup failed', error as Error);
  }

  return results;
}

// Right to be forgotten (GDPR Article 17)
export async function processRightToBeForgotten(email: string): Promise<{
  success: boolean;
  deletedRecords: Record<string, number>;
  errors: string[];
}> {
  const emailHash = hashPII(email);
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'right_to_be_forgotten',
    emailHash,
  });

  const results = {
    success: false,
    deletedRecords: {} as Record<string, number>,
    errors: [] as string[],
  };

  structuredLogger.info('Processing right to be forgotten request');

  try {
    // Use transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete from Newsletter
      const deletedNewsletters = await tx.newsletter.deleteMany({
        where: { email: email.toLowerCase() },
      });
      results.deletedRecords.newsletters = deletedNewsletters.count;

      // Delete from NewsletterEvent
      const deletedEvents = await tx.newsletterEvent.deleteMany({
        where: { recipientEmail: email.toLowerCase() },
      });
      results.deletedRecords.newsletterEvents = deletedEvents.count;

      // Delete from CampaignDelivery
      const deletedDeliveries = await tx.campaignDelivery.deleteMany({
        where: { recipientEmail: email.toLowerCase() },
      });
      results.deletedRecords.campaignDeliveries = deletedDeliveries.count;

      // Delete from Suppression
      const deletedSuppressions = await tx.suppression.deleteMany({
        where: { email: email.toLowerCase() },
      });
      results.deletedRecords.suppressions = deletedSuppressions.count;

      // Delete from NewsletterPreferences (if exists)
      const newsletters = await tx.newsletter.findMany({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });

      if (newsletters.length > 0) {
        const deletedPreferences = await tx.newsletterPreferences.deleteMany({
          where: {
            recipientId: { in: newsletters.map((n) => n.id) },
          },
        });
        results.deletedRecords.newsletterPreferences = deletedPreferences.count;
      }
    });

    results.success = true;
    structuredLogger.info('Right to be forgotten processed successfully', {
      deletedRecords: results.deletedRecords,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(errorMessage);
    structuredLogger.error(
      'Right to be forgotten processing failed',
      error as Error
    );
  }

  return results;
}

// Data export for GDPR Article 15 (Right of access)
export async function exportUserData(email: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const emailHash = hashPII(email);
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'data_export',
    emailHash,
  });

  structuredLogger.info('Processing data export request');

  try {
    const userData = {
      newsletter: await prisma.newsletter.findMany({
        where: { email: email.toLowerCase() },
      }),
      events: await prisma.newsletterEvent.findMany({
        where: { recipientEmail: email.toLowerCase() },
        orderBy: { timestamp: 'desc' },
      }),
      deliveries: await prisma.campaignDelivery.findMany({
        where: { recipientEmail: email.toLowerCase() },
        orderBy: { createdAt: 'desc' },
      }),
      suppressions: await prisma.suppression.findMany({
        where: { email: email.toLowerCase() },
      }),
      preferences: [], // Will be populated if newsletter records exist
    };

    // Get preferences if newsletter records exist
    if (userData.newsletter.length > 0) {
      userData.preferences = await prisma.newsletterPreferences.findMany({
        where: {
          recipientId: { in: userData.newsletter.map((n) => n.id) },
        },
      });
    }

    structuredLogger.info('Data export completed successfully', {
      recordCounts: {
        newsletters: userData.newsletter.length,
        events: userData.events.length,
        deliveries: userData.deliveries.length,
        suppressions: userData.suppressions.length,
        preferences: userData.preferences.length,
      },
    });

    return {
      success: true,
      data: {
        exportedAt: new Date().toISOString(),
        email: email.toLowerCase(),
        ...userData,
      },
    };
  } catch (error) {
    structuredLogger.error('Data export failed', error as Error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// CSV injection prevention
export function sanitizeCSVField(field: string): string {
  if (typeof field !== 'string') {
    return String(field);
  }

  // Remove dangerous characters that could lead to CSV injection
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n'];
  let sanitized = field;

  // Check if field starts with dangerous characters
  if (dangerousChars.some((char) => sanitized.startsWith(char))) {
    sanitized = `'${sanitized}`; // Prefix with single quote to neutralize
  }

  // Escape double quotes
  sanitized = sanitized.replace(/"/g, '""');

  // Wrap in quotes if contains comma, quote, or newline
  if (
    sanitized.includes(',') ||
    sanitized.includes('"') ||
    sanitized.includes('\n')
  ) {
    sanitized = `"${sanitized}"`;
  }

  return sanitized;
}

// Safe CSV export
export function exportToCSV(data: any[], filename: string): string {
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.map(sanitizeCSVField).join(',');

  const csvRows = data.map((row) =>
    headers.map((header) => sanitizeCSVField(row[header] || '')).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

// Bulk suppression import with CSV injection protection
export async function importSuppressionsFromCSV(
  csvContent: string,
  source: string = 'csv_import'
): Promise<{
  success: boolean;
  imported: number;
  errors: string[];
  skipped: number;
}> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'suppression_csv_import',
    source,
  });

  const results = {
    success: false,
    imported: 0,
    errors: [] as string[],
    skipped: 0,
  };

  try {
    const lines = csvContent.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      results.errors.push('Empty CSV file');
      return results;
    }

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const emailIndex = headers.findIndex((h) => h.includes('email'));
    const reasonIndex = headers.findIndex((h) => h.includes('reason'));

    if (emailIndex === -1) {
      results.errors.push('Email column not found in CSV');
      return results;
    }

    structuredLogger.info('Starting CSV import', {
      totalLines: lines.length - 1,
      headers,
    });

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i]
          .split(',')
          .map((v) => v.trim().replace(/^"|"$/g, ''));
        const email = values[emailIndex];
        const reason = reasonIndex >= 0 ? values[reasonIndex] : 'MANUAL';

        // Validate email
        if (!email || !email.includes('@')) {
          results.skipped++;
          continue;
        }

        // Check for CSV injection attempts
        if (
          email.startsWith('=') ||
          email.startsWith('+') ||
          email.startsWith('-') ||
          email.startsWith('@')
        ) {
          results.errors.push(
            `Potential CSV injection attempt in line ${i + 1}: ${email}`
          );
          results.skipped++;
          continue;
        }

        // Import suppression
        const { addSuppression } = await import('@/lib/suppression');
        await addSuppression({
          email: email.toLowerCase(),
          reason: (reason.toUpperCase() as any) || 'MANUAL',
          source: `${source}_line_${i + 1}`,
        });

        results.imported++;
      } catch (error) {
        results.errors.push(
          `Error processing line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        results.skipped++;
      }
    }

    results.success = true;
    structuredLogger.info('CSV import completed', {
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.length,
    });
  } catch (error) {
    structuredLogger.error('CSV import failed', error as Error);
    results.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return results;
}

// Data anonymization (alternative to deletion)
export async function anonymizeUserData(email: string): Promise<{
  success: boolean;
  anonymizedRecords: Record<string, number>;
  errors: string[];
}> {
  const emailHash = hashPII(email);
  const anonymizedEmail = `anonymized_${emailHash}@example.com`;

  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'data_anonymization',
    emailHash,
  });

  const results = {
    success: false,
    anonymizedRecords: {} as Record<string, number>,
    errors: [] as string[],
  };

  structuredLogger.info('Processing data anonymization request');

  try {
    await prisma.$transaction(async (tx) => {
      // Anonymize Newsletter records
      const updatedNewsletters = await tx.newsletter.updateMany({
        where: { email: email.toLowerCase() },
        data: { email: anonymizedEmail },
      });
      results.anonymizedRecords.newsletters = updatedNewsletters.count;

      // Anonymize NewsletterEvent records
      const updatedEvents = await tx.newsletterEvent.updateMany({
        where: { recipientEmail: email.toLowerCase() },
        data: { recipientEmail: anonymizedEmail },
      });
      results.anonymizedRecords.newsletterEvents = updatedEvents.count;

      // Anonymize CampaignDelivery records
      const updatedDeliveries = await tx.campaignDelivery.updateMany({
        where: { recipientEmail: email.toLowerCase() },
        data: { recipientEmail: anonymizedEmail },
      });
      results.anonymizedRecords.campaignDeliveries = updatedDeliveries.count;

      // Anonymize Suppression records
      const updatedSuppressions = await tx.suppression.updateMany({
        where: { email: email.toLowerCase() },
        data: { email: anonymizedEmail },
      });
      results.anonymizedRecords.suppressions = updatedSuppressions.count;
    });

    results.success = true;
    structuredLogger.info('Data anonymization completed successfully', {
      anonymizedRecords: results.anonymizedRecords,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(errorMessage);
    structuredLogger.error('Data anonymization failed', error as Error);
  }

  return results;
}

// Schedule data lifecycle tasks
export async function scheduleDataLifecycleTasks(): Promise<void> {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'schedule_data_lifecycle',
  });

  try {
    // Run retention cleanup (daily)
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() < 5) {
      // Run at 2 AM
      await runDataRetentionCleanup();
    }

    structuredLogger.info('Data lifecycle tasks scheduled');
  } catch (error) {
    structuredLogger.error(
      'Failed to schedule data lifecycle tasks',
      error as Error
    );
  }
}
