import { z } from 'zod';
import { logger } from '@/lib/logger';

// Enhanced environment validation with Zod

const envSchema = z.object({
  // Core Next.js and Database
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // Authentication
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),

  // Email Configuration
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().regex(/^\d+$/, 'SMTP_PORT must be a number'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required'),
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email').optional(),

  // Security
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
  EMAIL_WEBHOOK_SECRET: z
    .string()
    .min(16, 'EMAIL_WEBHOOK_SECRET must be at least 16 characters'),
  WEBHOOK_SECRET: z
    .string()
    .min(16, 'WEBHOOK_SECRET must be at least 16 characters')
    .optional(),

  // Email Provider Settings
  MAIL_PROVIDER: z
    .enum(['smtp', 'sendgrid', 'mailgun', 'postmark', 'resend'])
    .optional(),
  SENDGRID_API_KEY: z.string().optional(),
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  POSTMARK_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Email Limits and Throttling
  EMAIL_BATCH_SIZE: z
    .string()
    .regex(/^\d+$/, 'EMAIL_BATCH_SIZE must be a number')
    .optional(),
  EMAIL_SEND_THROTTLE_MS: z
    .string()
    .regex(/^\d+$/, 'EMAIL_SEND_THROTTLE_MS must be a number')
    .optional(),

  // Domain-specific throttling
  GMAIL_THROTTLE_LIMIT: z
    .string()
    .regex(/^\d+$/, 'GMAIL_THROTTLE_LIMIT must be a number')
    .optional(),
  GMAIL_DAILY_LIMIT: z
    .string()
    .regex(/^\d+$/, 'GMAIL_DAILY_LIMIT must be a number')
    .optional(),
  GMAIL_HOURLY_LIMIT: z
    .string()
    .regex(/^\d+$/, 'GMAIL_HOURLY_LIMIT must be a number')
    .optional(),

  OUTLOOK_THROTTLE_LIMIT: z
    .string()
    .regex(/^\d+$/, 'OUTLOOK_THROTTLE_LIMIT must be a number')
    .optional(),
  OUTLOOK_DAILY_LIMIT: z
    .string()
    .regex(/^\d+$/, 'OUTLOOK_DAILY_LIMIT must be a number')
    .optional(),
  OUTLOOK_HOURLY_LIMIT: z
    .string()
    .regex(/^\d+$/, 'OUTLOOK_HOURLY_LIMIT must be a number')
    .optional(),

  YAHOO_DAILY_LIMIT: z
    .string()
    .regex(/^\d+$/, 'YAHOO_DAILY_LIMIT must be a number')
    .optional(),
  YAHOO_HOURLY_LIMIT: z
    .string()
    .regex(/^\d+$/, 'YAHOO_HOURLY_LIMIT must be a number')
    .optional(),

  HOTMAIL_DAILY_LIMIT: z
    .string()
    .regex(/^\d+$/, 'HOTMAIL_DAILY_LIMIT must be a number')
    .optional(),
  HOTMAIL_HOURLY_LIMIT: z
    .string()
    .regex(/^\d+$/, 'HOTMAIL_HOURLY_LIMIT must be a number')
    .optional(),

  // Email Warmup
  EMAIL_WARMUP_ENABLED: z.string().optional(),
  EMAIL_WARMUP_INITIAL: z
    .string()
    .regex(/^\d+$/, 'EMAIL_WARMUP_INITIAL must be a number')
    .optional(),
  EMAIL_WARMUP_INCREMENT: z
    .string()
    .regex(/^\d+$/, 'EMAIL_WARMUP_INCREMENT must be a number')
    .optional(),
  EMAIL_WARMUP_MAX: z
    .string()
    .regex(/^\d+$/, 'EMAIL_WARMUP_MAX must be a number')
    .optional(),

  // Deliverability
  EMAIL_LIST_ID: z.string().optional(),
  EMAIL_TRACKING_DOMAIN: z.string().optional(),

  // Data Retention (GDPR)
  RETENTION_NEWSLETTER_EVENTS: z
    .string()
    .regex(/^\d+$/, 'RETENTION_NEWSLETTER_EVENTS must be a number')
    .optional(),
  RETENTION_CAMPAIGN_SNAPSHOTS: z
    .string()
    .regex(/^\d+$/, 'RETENTION_CAMPAIGN_SNAPSHOTS must be a number')
    .optional(),
  RETENTION_CAMPAIGN_DELIVERIES: z
    .string()
    .regex(/^\d+$/, 'RETENTION_CAMPAIGN_DELIVERIES must be a number')
    .optional(),
  RETENTION_SUPPRESSIONS: z
    .string()
    .regex(/^\d+$/, 'RETENTION_SUPPRESSIONS must be a number')
    .optional(),
  RETENTION_AUDIT_LOGS: z
    .string()
    .regex(/^\d+$/, 'RETENTION_AUDIT_LOGS must be a number')
    .optional(),

  // Timezone and Quiet Hours
  DEFAULT_TIMEZONE: z.string().optional(),
  QUIET_HOURS_START: z
    .string()
    .regex(/^\d+$/, 'QUIET_HOURS_START must be a number (0-23)')
    .optional(),
  QUIET_HOURS_END: z
    .string()
    .regex(/^\d+$/, 'QUIET_HOURS_END must be a number (0-23)')
    .optional(),
  QUIET_HOURS_TIMEZONE: z.string().optional(),
  ENABLE_QUIET_HOURS: z.string().optional(),

  // Monitoring and Alerts
  ALERT_QUEUE_DEPTH_HIGH: z
    .string()
    .regex(/^\d+$/, 'ALERT_QUEUE_DEPTH_HIGH must be a number')
    .optional(),
  ALERT_QUEUE_DEPTH_CRITICAL: z
    .string()
    .regex(/^\d+$/, 'ALERT_QUEUE_DEPTH_CRITICAL must be a number')
    .optional(),
  ALERT_BOUNCE_RATE_HIGH: z
    .string()
    .regex(/^\d*\.?\d+$/, 'ALERT_BOUNCE_RATE_HIGH must be a number')
    .optional(),
  ALERT_BOUNCE_RATE_CRITICAL: z
    .string()
    .regex(/^\d*\.?\d+$/, 'ALERT_BOUNCE_RATE_CRITICAL must be a number')
    .optional(),
  ALERT_COMPLAINT_RATE_HIGH: z
    .string()
    .regex(/^\d*\.?\d+$/, 'ALERT_COMPLAINT_RATE_HIGH must be a number')
    .optional(),
  ALERT_COMPLAINT_RATE_CRITICAL: z
    .string()
    .regex(/^\d*\.?\d+$/, 'ALERT_COMPLAINT_RATE_CRITICAL must be a number')
    .optional(),
  ALERT_WEBHOOK_LAG_HIGH: z
    .string()
    .regex(/^\d+$/, 'ALERT_WEBHOOK_LAG_HIGH must be a number')
    .optional(),
  ALERT_SEND_RATE_LOW: z
    .string()
    .regex(/^\d*\.?\d+$/, 'ALERT_SEND_RATE_LOW must be a number')
    .optional(),

  // External Services
  SLACK_WEBHOOK_URL: z
    .string()
    .url('SLACK_WEBHOOK_URL must be a valid URL')
    .optional(),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),

  // Cloudinary (for images)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Sentry (error tracking)
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Security
  ALLOWED_IPS: z.string().optional(), // Comma-separated list
  ENABLE_RATE_LIMITING: z.string().optional(),
  ENABLE_SECURITY_HEADERS: z.string().optional(),

  // Feature Flags
  ENABLE_CAMPAIGN_SCHEDULER: z.string().optional(),
  ENABLE_EMAIL_QUEUE: z.string().optional(),
  ENABLE_WEBHOOK_PROCESSING: z.string().optional(),
});

// Validate environment variables
export function validateEnvironment(): {
  success: boolean;
  errors?: string[];
  warnings?: string[];
} {
  try {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      const errors = (result.error as any).errors.map(
        (err: unknown) => `${err.path.join('.')}: ${err.message}`
      );

      return {
        success: false,
        errors,
      };
    }

    // Additional validation warnings
    const warnings: string[] = [];

    // Check for development-only settings in production
    if (process.env.NODE_ENV === 'production') {
      if (process.env.CRON_SECRET === 'dev-secret') {
        warnings.push('Using development CRON_SECRET in production');
      }

      if (
        process.env.NEXTAUTH_SECRET &&
        process.env.NEXTAUTH_SECRET.length < 64
      ) {
        warnings.push(
          'NEXTAUTH_SECRET should be longer in production (recommended: 64+ characters)'
        );
      }

      if (!process.env.SENTRY_DSN) {
        warnings.push('SENTRY_DSN not configured - error tracking disabled');
      }

      if (!process.env.REDIS_URL) {
        warnings.push(
          'REDIS_URL not configured - using in-memory storage (not recommended for production)'
        );
      }
    }

    // Check email provider configuration
    const mailProvider = process.env.MAIL_PROVIDER || 'smtp';
    switch (mailProvider) {
      case 'sendgrid':
        if (!process.env.SENDGRID_API_KEY) {
          warnings.push(
            'SENDGRID_API_KEY not configured but MAIL_PROVIDER is sendgrid'
          );
        }
        break;
      case 'mailgun':
        if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
          warnings.push(
            'MAILGUN_API_KEY or MAILGUN_DOMAIN not configured but MAIL_PROVIDER is mailgun'
          );
        }
        break;
      case 'postmark':
        if (!process.env.POSTMARK_API_KEY) {
          warnings.push(
            'POSTMARK_API_KEY not configured but MAIL_PROVIDER is postmark'
          );
        }
        break;
      case 'resend':
        if (!process.env.RESEND_API_KEY) {
          warnings.push(
            'RESEND_API_KEY not configured but MAIL_PROVIDER is resend'
          );
        }
        break;
    }

    // Check quiet hours configuration
    if (process.env.ENABLE_QUIET_HOURS === 'true') {
      const startHour = parseInt(process.env.QUIET_HOURS_START || '22');
      const endHour = parseInt(process.env.QUIET_HOURS_END || '8');

      if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        warnings.push(
          'QUIET_HOURS_START and QUIET_HOURS_END must be between 0-23'
        );
      }
    }

    return {
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    logger.error('Environment validation failed', error as Error);
    return {
      success: false,
      errors: ['Environment validation failed with unexpected error'],
    };
  }
}

// Get typed environment variables
export function getEnvConfig() {
  const validation = validateEnvironment();

  if (!validation.success) {
    throw new Error(
      `Environment validation failed: ${validation.errors?.join(', ')}`
    );
  }

  return {
    // Core
    nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
    databaseUrl: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,

    // Auth
    nextAuthSecret: process.env.NEXTAUTH_SECRET!,
    nextAuthUrl: process.env.NEXTAUTH_URL!,

    // Email
    smtpHost: process.env.SMTP_HOST!,
    smtpPort: parseInt(process.env.SMTP_PORT!),
    smtpUser: process.env.SMTP_USER!,
    smtpPassword: process.env.SMTP_PASSWORD!,
    smtpFrom: process.env.SMTP_FROM,

    // Security
    cronSecret: process.env.CRON_SECRET!,
    emailWebhookSecret: process.env.EMAIL_WEBHOOK_SECRET!,
    webhookSecret: process.env.WEBHOOK_SECRET,

    // Email Provider
    mailProvider: (process.env.MAIL_PROVIDER || 'smtp') as
      | 'smtp'
      | 'sendgrid'
      | 'mailgun'
      | 'postmark'
      | 'resend',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    mailgunApiKey: process.env.MAILGUN_API_KEY,
    mailgunDomain: process.env.MAILGUN_DOMAIN,
    postmarkApiKey: process.env.POSTMARK_API_KEY,
    resendApiKey: process.env.RESEND_API_KEY,

    // Limits
    emailBatchSize: parseInt(process.env.EMAIL_BATCH_SIZE || '50'),
    emailSendThrottleMs: parseInt(process.env.EMAIL_SEND_THROTTLE_MS || '1000'),

    // Domain Limits
    gmailDailyLimit: parseInt(process.env.GMAIL_DAILY_LIMIT || '2000'),
    gmailHourlyLimit: parseInt(process.env.GMAIL_HOURLY_LIMIT || '100'),
    outlookDailyLimit: parseInt(process.env.OUTLOOK_DAILY_LIMIT || '1000'),
    outlookHourlyLimit: parseInt(process.env.OUTLOOK_HOURLY_LIMIT || '50'),

    // Warmup
    emailWarmupEnabled: process.env.EMAIL_WARMUP_ENABLED === 'true',
    emailWarmupInitial: parseInt(process.env.EMAIL_WARMUP_INITIAL || '100'),
    emailWarmupIncrement: parseInt(process.env.EMAIL_WARMUP_INCREMENT || '50'),
    emailWarmupMax: parseInt(process.env.EMAIL_WARMUP_MAX || '10000'),

    // Deliverability
    emailListId: process.env.EMAIL_LIST_ID || 'newsletter.superbear.blog',
    emailTrackingDomain: process.env.EMAIL_TRACKING_DOMAIN,

    // Timezone
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'UTC',
    enableQuietHours: process.env.ENABLE_QUIET_HOURS === 'true',
    quietHoursStart: parseInt(process.env.QUIET_HOURS_START || '22'),
    quietHoursEnd: parseInt(process.env.QUIET_HOURS_END || '8'),
    quietHoursTimezone: process.env.QUIET_HOURS_TIMEZONE || 'UTC',

    // External Services
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    redisUrl: process.env.REDIS_URL,
    sentryDsn: process.env.SENTRY_DSN,

    // Security
    allowedIPs: process.env.ALLOWED_IPS?.split(',').map((ip) => ip.trim()),
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',

    // Feature Flags
    enableCampaignScheduler: process.env.ENABLE_CAMPAIGN_SCHEDULER !== 'false',
    enableEmailQueue: process.env.ENABLE_EMAIL_QUEUE !== 'false',
    enableWebhookProcessing: process.env.ENABLE_WEBHOOK_PROCESSING !== 'false',
  };
}

// Validate environment on startup
export function validateEnvironmentOnStartup(): void {
  const validation = validateEnvironment();

  if (!validation.success) {
    console.error('❌ Environment validation failed:');
    validation.errors?.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  if (validation.warnings?.length) {
    console.warn('⚠️  Environment validation warnings:');
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  console.log('✅ Environment validation passed');
}
