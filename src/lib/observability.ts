import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { sanitizeLogData, hashPII } from '@/lib/security-enhanced';

// Metrics collection and alerting system

interface Metrics {
  queueDepth: number;
  sendRateByDomain: Record<string, number>;
  successRate: number;
  errorRate: number;
  webhookLag: number;
  bounceRate: number;
  complaintRate: number;
}

interface Alert {
  id: string;
  type: 'queue_depth' | 'bounce_spike' | 'complaint_spike' | 'webhook_error' | 'send_rate_low';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: any;
}

// Metrics thresholds for alerting
const ALERT_THRESHOLDS = {
  queueDepthHigh: parseInt(process.env.ALERT_QUEUE_DEPTH_HIGH || '1000'),
  queueDepthCritical: parseInt(process.env.ALERT_QUEUE_DEPTH_CRITICAL || '5000'),
  bounceRateHigh: parseFloat(process.env.ALERT_BOUNCE_RATE_HIGH || '0.05'), // 5%
  bounceRateCritical: parseFloat(process.env.ALERT_BOUNCE_RATE_CRITICAL || '0.10'), // 10%
  complaintRateHigh: parseFloat(process.env.ALERT_COMPLAINT_RATE_HIGH || '0.001'), // 0.1%
  complaintRateCritical: parseFloat(process.env.ALERT_COMPLAINT_RATE_CRITICAL || '0.005'), // 0.5%
  webhookLagHigh: parseInt(process.env.ALERT_WEBHOOK_LAG_HIGH || '300'), // 5 minutes
  sendRateLow: parseFloat(process.env.ALERT_SEND_RATE_LOW || '0.8'), // 80% of expected
};

// In-memory metrics store (in production, use Redis/InfluxDB)
const metricsStore = new Map<string, any>();
const alertsStore: Alert[] = [];

// Structured logging with correlation IDs
export class StructuredLogger {
  private correlationId: string;
  private context: Record<string, any>;

  constructor(correlationId?: string, context: Record<string, any> = {}) {
    this.correlationId = correlationId || this.generateCorrelationId();
    this.context = sanitizeLogData(context);
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatLog(level: string, message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      context: this.context,
      data: data ? sanitizeLogData(data) : undefined,
    };

    // Use existing logger with structured data
    logger.info(JSON.stringify(logEntry));
  }

  info(message: string, data?: any): void {
    this.formatLog('INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.formatLog('WARN', message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.formatLog('ERROR', message, {
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...data,
    });
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.formatLog('DEBUG', message, data);
    }
  }

  // Create child logger with additional context
  child(additionalContext: Record<string, any>): StructuredLogger {
    return new StructuredLogger(this.correlationId, {
      ...this.context,
      ...sanitizeLogData(additionalContext),
    });
  }
}

// Metrics collection
export async function collectMetrics(): Promise<Metrics> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Queue depth (from email-queue or database)
    const queueDepth = await getQueueDepth();

    // Send rate by domain (last hour)
    const sendRateByDomain = await getSendRateByDomain(oneHourAgo, now);

    // Success/Error rates (last hour)
    const deliveryStats = await getDeliveryStats(oneHourAgo, now);

    // Webhook lag (average processing time)
    const webhookLag = await getWebhookLag(oneHourAgo, now);

    // Bounce and complaint rates (last 24 hours)
    const bounceComplaintStats = await getBounceComplaintStats(oneDayAgo, now);

    const metrics: Metrics = {
      queueDepth,
      sendRateByDomain,
      successRate: deliveryStats.successRate,
      errorRate: deliveryStats.errorRate,
      webhookLag,
      bounceRate: bounceComplaintStats.bounceRate,
      complaintRate: bounceComplaintStats.complaintRate,
    };

    // Store metrics for trending
    metricsStore.set(`metrics_${now.getTime()}`, metrics);

    // Check for alerts
    await checkAlerts(metrics);

    return metrics;

  } catch (error) {
    logger.error('Failed to collect metrics', error as Error);
    throw error;
  }
}

// Get queue depth
async function getQueueDepth(): Promise<number> {
  try {
    // Count pending deliveries
    const pendingCount = await prisma.campaignDelivery.count({
      where: {
        status: {
          in: ['QUEUED', 'SENDING'],
        },
      },
    });

    return pendingCount;
  } catch (error) {
    logger.error('Failed to get queue depth', error as Error);
    return 0;
  }
}

// Get send rate by domain
async function getSendRateByDomain(startTime: Date, endTime: Date): Promise<Record<string, number>> {
  try {
    const deliveries = await prisma.campaignDelivery.findMany({
      where: {
        deliveredAt: {
          gte: startTime,
          lte: endTime,
        },
        status: 'DELIVERED',
      },
      select: {
        recipientEmail: true,
      },
    });

    const domainCounts: Record<string, number> = {};
    
    deliveries.forEach(delivery => {
      const domain = delivery.recipientEmail.split('@')[1]?.toLowerCase();
      if (domain) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    });

    return domainCounts;
  } catch (error) {
    logger.error('Failed to get send rate by domain', error as Error);
    return {};
  }
}

// Get delivery statistics
async function getDeliveryStats(startTime: Date, endTime: Date): Promise<{ successRate: number; errorRate: number }> {
  try {
    const stats = await prisma.campaignDelivery.groupBy({
      by: ['status'],
      where: {
        lastAttemptAt: {
          gte: startTime,
          lte: endTime,
        },
      },
      _count: {
        status: true,
      },
    });

    let total = 0;
    let successful = 0;
    let failed = 0;

    stats.forEach(stat => {
      const count = stat._count.status;
      total += count;

      if (['DELIVERED', 'OPENED', 'CLICKED'].includes(stat.status)) {
        successful += count;
      } else if (['FAILED', 'BOUNCED', 'COMPLAINED'].includes(stat.status)) {
        failed += count;
      }
    });

    return {
      successRate: total > 0 ? successful / total : 0,
      errorRate: total > 0 ? failed / total : 0,
    };
  } catch (error) {
    logger.error('Failed to get delivery stats', error as Error);
    return { successRate: 0, errorRate: 0 };
  }
}

// Get webhook processing lag
async function getWebhookLag(startTime: Date, endTime: Date): Promise<number> {
  try {
    // This would require storing webhook receive time vs processing time
    // For now, return 0 as placeholder
    return 0;
  } catch (error) {
    logger.error('Failed to get webhook lag', error as Error);
    return 0;
  }
}

// Get bounce and complaint statistics
async function getBounceComplaintStats(startTime: Date, endTime: Date): Promise<{ bounceRate: number; complaintRate: number }> {
  try {
    const totalSent = await prisma.campaignDelivery.count({
      where: {
        deliveredAt: {
          gte: startTime,
          lte: endTime,
        },
        status: {
          in: ['DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED'],
        },
      },
    });

    const bounced = await prisma.campaignDelivery.count({
      where: {
        bouncedAt: {
          gte: startTime,
          lte: endTime,
        },
        status: 'BOUNCED',
      },
    });

    const complained = await prisma.campaignDelivery.count({
      where: {
        complainedAt: {
          gte: startTime,
          lte: endTime,
        },
        status: 'COMPLAINED',
      },
    });

    return {
      bounceRate: totalSent > 0 ? bounced / totalSent : 0,
      complaintRate: totalSent > 0 ? complained / totalSent : 0,
    };
  } catch (error) {
    logger.error('Failed to get bounce/complaint stats', error as Error);
    return { bounceRate: 0, complaintRate: 0 };
  }
}

// Alert checking
async function checkAlerts(metrics: Metrics): Promise<void> {
  const alerts: Alert[] = [];

  // Queue depth alerts
  if (metrics.queueDepth >= ALERT_THRESHOLDS.queueDepthCritical) {
    alerts.push({
      id: `queue_depth_critical_${Date.now()}`,
      type: 'queue_depth',
      severity: 'critical',
      message: `Queue depth critically high: ${metrics.queueDepth} items`,
      timestamp: new Date(),
      metadata: { queueDepth: metrics.queueDepth },
    });
  } else if (metrics.queueDepth >= ALERT_THRESHOLDS.queueDepthHigh) {
    alerts.push({
      id: `queue_depth_high_${Date.now()}`,
      type: 'queue_depth',
      severity: 'high',
      message: `Queue depth high: ${metrics.queueDepth} items`,
      timestamp: new Date(),
      metadata: { queueDepth: metrics.queueDepth },
    });
  }

  // Bounce rate alerts
  if (metrics.bounceRate >= ALERT_THRESHOLDS.bounceRateCritical) {
    alerts.push({
      id: `bounce_rate_critical_${Date.now()}`,
      type: 'bounce_spike',
      severity: 'critical',
      message: `Bounce rate critically high: ${(metrics.bounceRate * 100).toFixed(2)}%`,
      timestamp: new Date(),
      metadata: { bounceRate: metrics.bounceRate },
    });
  } else if (metrics.bounceRate >= ALERT_THRESHOLDS.bounceRateHigh) {
    alerts.push({
      id: `bounce_rate_high_${Date.now()}`,
      type: 'bounce_spike',
      severity: 'high',
      message: `Bounce rate high: ${(metrics.bounceRate * 100).toFixed(2)}%`,
      timestamp: new Date(),
      metadata: { bounceRate: metrics.bounceRate },
    });
  }

  // Complaint rate alerts
  if (metrics.complaintRate >= ALERT_THRESHOLDS.complaintRateCritical) {
    alerts.push({
      id: `complaint_rate_critical_${Date.now()}`,
      type: 'complaint_spike',
      severity: 'critical',
      message: `Complaint rate critically high: ${(metrics.complaintRate * 100).toFixed(3)}%`,
      timestamp: new Date(),
      metadata: { complaintRate: metrics.complaintRate },
    });
  } else if (metrics.complaintRate >= ALERT_THRESHOLDS.complaintRateHigh) {
    alerts.push({
      id: `complaint_rate_high_${Date.now()}`,
      type: 'complaint_spike',
      severity: 'high',
      message: `Complaint rate high: ${(metrics.complaintRate * 100).toFixed(3)}%`,
      timestamp: new Date(),
      metadata: { complaintRate: metrics.complaintRate },
    });
  }

  // Webhook lag alerts
  if (metrics.webhookLag >= ALERT_THRESHOLDS.webhookLagHigh) {
    alerts.push({
      id: `webhook_lag_high_${Date.now()}`,
      type: 'webhook_error',
      severity: 'medium',
      message: `Webhook processing lag high: ${metrics.webhookLag}s`,
      timestamp: new Date(),
      metadata: { webhookLag: metrics.webhookLag },
    });
  }

  // Store and process alerts
  if (alerts.length > 0) {
    alertsStore.push(...alerts);
    await processAlerts(alerts);
  }
}

// Process alerts (send notifications, etc.)
async function processAlerts(alerts: Alert[]): Promise<void> {
  for (const alert of alerts) {
    const structuredLogger = new StructuredLogger(undefined, {
      alertId: alert.id,
      alertType: alert.type,
      severity: alert.severity,
    });

    structuredLogger.warn('Alert triggered', {
      message: alert.message,
      metadata: alert.metadata,
    });

    // In production, send to alerting system (PagerDuty, Slack, etc.)
    if (process.env.NODE_ENV === 'production') {
      await sendAlert(alert);
    }
  }
}

// Send alert to external system
async function sendAlert(alert: Alert): Promise<void> {
  try {
    // Placeholder for external alerting integration
    // Could integrate with Slack, PagerDuty, email, etc.
    
    if (process.env.SLACK_WEBHOOK_URL && alert.severity === 'critical') {
      // Send to Slack for critical alerts
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Critical Alert: ${alert.message}`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Type', value: alert.type, short: true },
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Time', value: alert.timestamp.toISOString(), short: false },
            ],
          }],
        }),
      });

      if (!response.ok) {
        logger.error('Failed to send Slack alert', new Error(`HTTP ${response.status}`));
      }
    }
  } catch (error) {
    logger.error('Failed to send alert', error as Error, { alertId: alert.id });
  }
}

// Get current alerts
export function getCurrentAlerts(severity?: Alert['severity']): Alert[] {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
  
  return alertsStore
    .filter(alert => alert.timestamp > cutoff)
    .filter(alert => !severity || alert.severity === severity)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Get metrics history
export function getMetricsHistory(hours = 24): any[] {
  const cutoff = Date.now() - (hours * 60 * 60 * 1000);
  
  return Array.from(metricsStore.entries())
    .filter(([timestamp]) => parseInt(timestamp.split('_')[1]) > cutoff)
    .map(([timestamp, metrics]) => ({
      timestamp: new Date(parseInt(timestamp.split('_')[1])),
      ...metrics,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

// Cleanup old metrics and alerts
export function cleanupOldData(): void {
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Cleanup metrics
  for (const [key] of metricsStore.entries()) {
    const timestamp = parseInt(key.split('_')[1]);
    if (timestamp < cutoff) {
      metricsStore.delete(key);
    }
  }
  
  // Cleanup alerts
  const alertCutoff = new Date(cutoff);
  for (let i = alertsStore.length - 1; i >= 0; i--) {
    if (alertsStore[i].timestamp < alertCutoff) {
      alertsStore.splice(i, 1);
    }
  }
}