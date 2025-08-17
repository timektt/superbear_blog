import { logger } from '@/lib/logger';
import { StructuredLogger } from '@/lib/observability';

// Enhanced deliverability features

export interface DeliverabilityConfig {
  headers: {
    listUnsubscribe: boolean;
    listUnsubscribePost: boolean;
    precedence: 'bulk' | 'list' | 'junk';
    listId: string;
  };
  tracking: {
    domain?: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign?: string;
  };
  warmup: {
    enabled: boolean;
    initialLimit: number;
    incrementPerDay: number;
    maxLimit: number;
  };
  domainLimits: Record<string, {
    dailyLimit: number;
    hourlyLimit: number;
    currentDaily: number;
    currentHourly: number;
    lastReset: Date;
  }>;
}

const defaultDeliverabilityConfig: DeliverabilityConfig = {
  headers: {
    listUnsubscribe: true,
    listUnsubscribePost: true,
    precedence: 'bulk',
    listId: process.env.EMAIL_LIST_ID || 'newsletter.superbear.blog',
  },
  tracking: {
    domain: process.env.EMAIL_TRACKING_DOMAIN,
    utmSource: 'newsletter',
    utmMedium: 'email',
  },
  warmup: {
    enabled: process.env.EMAIL_WARMUP_ENABLED === 'true',
    initialLimit: parseInt(process.env.EMAIL_WARMUP_INITIAL || '100'),
    incrementPerDay: parseInt(process.env.EMAIL_WARMUP_INCREMENT || '50'),
    maxLimit: parseInt(process.env.EMAIL_WARMUP_MAX || '10000'),
  },
  domainLimits: {},
};

// Enhanced email headers for deliverability
export function generateDeliverabilityHeaders(
  campaignId: string,
  recipientEmail: string,
  unsubscribeUrl: string
): Record<string, string> {
  const config = defaultDeliverabilityConfig;
  const headers: Record<string, string> = {};

  // List-Unsubscribe header (RFC 2369)
  if (config.headers.listUnsubscribe) {
    headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
  }

  // List-Unsubscribe-Post header (RFC 8058) for one-click unsubscribe
  if (config.headers.listUnsubscribePost) {
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  // Precedence header
  headers['Precedence'] = config.headers.precedence;

  // List-ID header
  headers['List-ID'] = `<${config.headers.listId}>`;

  // Message-ID for tracking
  headers['Message-ID'] = `<${campaignId}.${Date.now()}@${config.headers.listId}>`;

  // Auto-Submitted header
  headers['Auto-Submitted'] = 'auto-generated';

  // X-Campaign-ID for internal tracking
  headers['X-Campaign-ID'] = campaignId;

  // Feedback-ID for FBL (Feedback Loop)
  const domain = recipientEmail.split('@')[1];
  headers['Feedback-ID'] = `${campaignId}:${domain}:superbear:newsletter`;

  return headers;
}

// UTM parameter generation
export function generateUTMParameters(
  campaignId: string,
  linkType: 'article' | 'cta' | 'footer' | 'header' = 'article'
): string {
  const config = defaultDeliverabilityConfig.tracking;

  const params = new URLSearchParams({
    utm_source: config.utmSource,
    utm_medium: config.utmMedium,
    utm_campaign: config.utmCampaign || campaignId,
    utm_content: linkType,
  });

  return params.toString();
}

// Enhanced link tracking with UTM
export function enhanceLinksWithTracking(
  htmlContent: string,
  campaignId: string,
  trackingDomain?: string
): string {
  const structuredLogger = new StructuredLogger(undefined, {
    operation: 'enhance_links_tracking',
    campaignId,
  });

  try {
    // Replace article links with tracking
    let enhancedContent = htmlContent;

    // Find all links in the content
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;

    enhancedContent = enhancedContent.replace(linkRegex, (match, url, text) => {
      try {
        const originalUrl = new URL(url);

        // Skip if already has UTM parameters or is unsubscribe link
        if (originalUrl.searchParams.has('utm_source') || url.includes('unsubscribe')) {
          return match;
        }

        // Determine link type
        let linkType: 'article' | 'cta' | 'footer' | 'header' = 'article';
        if (text.toLowerCase().includes('read more') || text.toLowerCase().includes('continue reading')) {
          linkType = 'cta';
        } else if (match.toLowerCase().includes('footer')) {
          linkType = 'footer';
        } else if (match.toLowerCase().includes('header')) {
          linkType = 'header';
        }

        // Add UTM parameters
        const utmParams = generateUTMParameters(campaignId, linkType);
        const separator = originalUrl.search ? '&' : '?';
        const trackedUrl = `${url}${separator}${utmParams}`;

        // Use tracking domain if configured
        let finalUrl = trackedUrl;
        if (trackingDomain && !url.startsWith('http')) {
          finalUrl = `https://${trackingDomain}/track?url=${encodeURIComponent(trackedUrl)}&campaign=${campaignId}`;
        }

        return match.replace(url, finalUrl);
      } catch (error) {
        // If URL parsing fails, return original
        return match;
      }
    });

    structuredLogger.info('Links enhanced with tracking');
    return enhancedContent;

  } catch (error) {
    structuredLogger.error('Failed to enhance links with tracking', error as Error);
    return htmlContent;
  }
}

// Warm-up management
export class WarmupManager {
  private static instance: WarmupManager;
  private config: DeliverabilityConfig['warmup'];
  private currentLimits: Map<string, number> = new Map();

  private constructor() {
    this.config = defaultDeliverabilityConfig.warmup;
    this.loadCurrentLimits();
  }

  static getInstance(): WarmupManager {
    if (!WarmupManager.instance) {
      WarmupManager.instance = new WarmupManager();
    }
    return WarmupManager.instance;
  }

  private loadCurrentLimits(): void {
    // In production, load from Redis/database
    // For now, use environment variables
    const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];

    domains.forEach((domain) => {
      const envKey = `WARMUP_LIMIT_${domain.replace('.', '_').toUpperCase()}`;
      const limit = parseInt(process.env[envKey] || this.config.initialLimit.toString());
      this.currentLimits.set(domain, limit);
    });
  }

  getCurrentLimit(domain: string): number {
    if (!this.config.enabled) {
      return this.config.maxLimit;
    }

    return this.currentLimits.get(domain) || this.config.initialLimit;
  }

  canSendToDomain(domain: string, currentCount: number): boolean {
    const limit = this.getCurrentLimit(domain);
    return currentCount < limit;
  }

  incrementDailyLimit(domain: string): void {
    if (!this.config.enabled) return;

    const currentLimit = this.getCurrentLimit(domain);
    const newLimit = Math.min(
      currentLimit + this.config.incrementPerDay,
      this.config.maxLimit
    );

    this.currentLimits.set(domain, newLimit);

    // In production, save to Redis/database
    const structuredLogger = new StructuredLogger(undefined, {
      operation: 'warmup_increment',
      domain,
    });

    structuredLogger.info('Warmup limit incremented', {
      domain,
      oldLimit: currentLimit,
      newLimit,
    });
  }

  getWarmupStatus(): Record<string, { current: number; max: number; progress: number }> {
    const status: Record<string, { current: number; max: number; progress: number }> = {};

    for (const [domain, current] of this.currentLimits.entries()) {
      status[domain] = {
        current,
        max: this.config.maxLimit,
        progress: (current / this.config.maxLimit) * 100,
      };
    }

    return status;
  }
}

// Domain-specific sending limits
export class DomainLimitManager {
  private static instance: DomainLimitManager;
  private limits: Map<string, DeliverabilityConfig['domainLimits'][string]> = new Map();

  private constructor() {
    this.initializeLimits();
  }

  static getInstance(): DomainLimitManager {
    if (!DomainLimitManager.instance) {
      DomainLimitManager.instance = new DomainLimitManager();
    }
    return DomainLimitManager.instance;
  }

  private initializeLimits(): void {
    // Initialize with environment variables or defaults
    const domainConfigs = {
      'gmail.com': {
        dailyLimit: parseInt(process.env.GMAIL_DAILY_LIMIT || '2000'),
        hourlyLimit: parseInt(process.env.GMAIL_HOURLY_LIMIT || '100'),
      },
      'outlook.com': {
        dailyLimit: parseInt(process.env.OUTLOOK_DAILY_LIMIT || '1000'),
        hourlyLimit: parseInt(process.env.OUTLOOK_HOURLY_LIMIT || '50'),
      },
      'yahoo.com': {
        dailyLimit: parseInt(process.env.YAHOO_DAILY_LIMIT || '1500'),
        hourlyLimit: parseInt(process.env.YAHOO_HOURLY_LIMIT || '75'),
      },
      'hotmail.com': {
        dailyLimit: parseInt(process.env.HOTMAIL_DAILY_LIMIT || '800'),
        hourlyLimit: parseInt(process.env.HOTMAIL_HOURLY_LIMIT || '40'),
      },
    };

    Object.entries(domainConfigs).forEach(([domain, config]) => {
      this.limits.set(domain, {
        ...config,
        currentDaily: 0,
        currentHourly: 0,
        lastReset: new Date(),
      });
    });
  }

  canSendToDomain(domain: string): boolean {
    const limit = this.limits.get(domain);
    if (!limit) {
      return true; // No limit configured for this domain
    }

    this.resetCountersIfNeeded(domain, limit);

    return limit.currentDaily < limit.dailyLimit && limit.currentHourly < limit.hourlyLimit;
  }

  recordSend(domain: string): void {
    const limit = this.limits.get(domain);
    if (!limit) return;

    this.resetCountersIfNeeded(domain, limit);

    limit.currentDaily++;
    limit.currentHourly++;

    this.limits.set(domain, limit);
  }

  private resetCountersIfNeeded(
    domain: string,
    limit: DeliverabilityConfig['domainLimits'][string]
  ): void {
    const now = new Date();
    const hoursSinceReset = (now.getTime() - limit.lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      // Reset daily counter
      limit.currentDaily = 0;
      limit.currentHourly = 0;
      limit.lastReset = now;
    } else if (hoursSinceReset >= 1) {
      // Reset hourly counter
      limit.currentHourly = 0;
    }
  }

  getDomainStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [domain, limit] of this.limits.entries()) {
      this.resetCountersIfNeeded(domain, limit);

      status[domain] = {
        dailyUsage: `${limit.currentDaily}/${limit.dailyLimit}`,
        hourlyUsage: `${limit.currentHourly}/${limit.hourlyLimit}`,
        dailyPercentage: (limit.currentDaily / limit.dailyLimit) * 100,
        hourlyPercentage: (limit.currentHourly / limit.hourlyLimit) * 100,
        canSend: this.canSendToDomain(domain),
      };
    }

    return status;
  }
}

// Email content optimization
export function optimizeEmailContent(htmlContent: string): {
  optimized: string;
  warnings: string[];
  stats: {
    size: number;
    imageCount: number;
    linkCount: number;
  };
} {
  const warnings: string[] = [];
  let optimized = htmlContent;

  // Remove script tags (security)
  const scriptRegex = /<script[^>]*>.*?<\/script>/gis;
  if (scriptRegex.test(optimized)) {
    optimized = optimized.replace(scriptRegex, '');
    warnings.push('Script tags removed for security');
  }

  // Remove iframe tags (security)
  const iframeRegex = /<iframe[^>]*>.*?<\/iframe>/gis;
  if (iframeRegex.test(optimized)) {
    optimized = optimized.replace(iframeRegex, '');
    warnings.push('Iframe tags removed for security');
  }

  // Check email size
  const size = new Blob([optimized]).size;
  if (size > 102400) { // 100KB
    warnings.push(`Email size (${Math.round(size / 1024)}KB) exceeds recommended 100KB`);
  }

  // Count images and links
  const imageCount = (optimized.match(/<img[^>]*>/gi) || []).length;
  const linkCount = (optimized.match(/<a[^>]*>/gi) || []).length;

  if (imageCount > 20) {
    warnings.push(`High image count (${imageCount}) may affect deliverability`);
  }

  return {
    optimized,
    warnings,
    stats: {
      size,
      imageCount,
      linkCount,
    },
  };
}

// Deliverability score calculation
export function calculateDeliverabilityScore(emailData: {
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName: string;
  replyTo?: string;
}): {
  score: number;
  factors: Array<{ factor: string; score: number; impact: 'positive' | 'negative' | 'neutral'; description: string }>;
} {
  const factors: Array<{ factor: string; score: number; impact: 'positive' | 'negative' | 'neutral'; description: string }> = [];
  let totalScore = 0;

  // Subject line analysis
  const subjectLength = emailData.subject.length;
  if (subjectLength >= 30 && subjectLength <= 50) {
    factors.push({
      factor: 'Subject Length',
      score: 10,
      impact: 'positive',
      description: 'Subject line length is optimal (30-50 characters)',
    });
    totalScore += 10;
  } else {
    factors.push({
      factor: 'Subject Length',
      score: -5,
      impact: 'negative',
      description: `Subject line is ${subjectLength < 30 ? 'too short' : 'too long'}`,
    });
    totalScore -= 5;
  }

  // Spam words check
  const spamWords = ['free', 'urgent', 'act now', 'limited time', 'click here', 'buy now'];
  const spamWordsFound = spamWords.filter((word) =>
    emailData.subject.toLowerCase().includes(word) ||
    emailData.htmlContent.toLowerCase().includes(word)
  );

  if (spamWordsFound.length === 0) {
    factors.push({
      factor: 'Spam Words',
      score: 15,
      impact: 'positive',
      description: 'No common spam words detected',
    });
    totalScore += 15;
  } else {
    factors.push({
      factor: 'Spam Words',
      score: -10 * spamWordsFound.length,
      impact: 'negative',
      description: `Spam words detected: ${spamWordsFound.join(', ')}`,
    });
    totalScore -= 10 * spamWordsFound.length;
  }

  // Text version check
  if (emailData.textContent && emailData.textContent.length > 100) {
    factors.push({
      factor: 'Text Version',
      score: 10,
      impact: 'positive',
      description: 'Text version provided',
    });
    totalScore += 10;
  } else {
    factors.push({
      factor: 'Text Version',
      score: -5,
      impact: 'negative',
      description: 'No text version or too short',
    });
    totalScore -= 5;
  }

  // From name check
  if (emailData.fromName && !emailData.fromName.includes('noreply')) {
    factors.push({
      factor: 'From Name',
      score: 5,
      impact: 'positive',
      description: 'Personal from name used',
    });
    totalScore += 5;
  }

  // Content optimization
  const contentAnalysis = optimizeEmailContent(emailData.htmlContent);
  if (contentAnalysis.warnings.length === 0) {
    factors.push({
      factor: 'Content Quality',
      score: 10,
      impact: 'positive',
      description: 'Content passes all optimization checks',
    });
    totalScore += 10;
  } else {
    factors.push({
      factor: 'Content Quality',
      score: -2 * contentAnalysis.warnings.length,
      impact: 'negative',
      description: `Content issues: ${contentAnalysis.warnings.join(', ')}`,
    });
    totalScore -= 2 * contentAnalysis.warnings.length;
  }

  // Normalize score to 0-100
  const normalizedScore = Math.max(0, Math.min(100, totalScore + 50));

  return {
    score: normalizedScore,
    factors,
  };
}