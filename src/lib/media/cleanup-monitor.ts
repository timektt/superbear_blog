import { cleanupEngine } from './cleanup-engine';
import { cleanupScheduler } from './cleanup-scheduler';

export interface CleanupAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface CleanupMetrics {
  totalOrphans: number;
  totalOrphanSize: number;
  orphanPercentage: number;
  lastCleanupTime?: Date;
  cleanupFrequency: number; // cleanups per week
  averageCleanupSize: number;
  failureRate: number; // percentage of failed cleanups
  alerts: CleanupAlert[];
}

export class CleanupMonitor {
  private alerts: CleanupAlert[] = [];

  /**
   * Get comprehensive cleanup metrics and alerts
   */
  async getMetrics(): Promise<CleanupMetrics> {
    try {
      // Get orphan statistics
      const orphanStats = await cleanupEngine.getOrphanStatistics();
      
      // Get cleanup history
      const cleanupHistory = await cleanupEngine.getCleanupHistory(50);
      
      // Get schedule statistics
      const scheduleStats = await cleanupScheduler.getScheduleStatistics();

      // Calculate metrics
      const totalFiles = await this.getTotalMediaFiles();
      const orphanPercentage = totalFiles > 0 ? (orphanStats.totalOrphans / totalFiles) * 100 : 0;
      
      const recentCleanups = cleanupHistory.filter(
        cleanup => cleanup.completedAt && cleanup.completedAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      const cleanupFrequency = recentCleanups.length;
      const averageCleanupSize = recentCleanups.length > 0 
        ? recentCleanups.reduce((sum, cleanup) => sum + cleanup.spaceFreed, 0) / recentCleanups.length
        : 0;
      
      const failedCleanups = cleanupHistory.filter(cleanup => cleanup.status === 'failed').length;
      const failureRate = cleanupHistory.length > 0 
        ? (failedCleanups / cleanupHistory.length) * 100 
        : 0;

      // Generate alerts
      const alerts = await this.generateAlerts(orphanStats, orphanPercentage, failureRate, scheduleStats);

      return {
        totalOrphans: orphanStats.totalOrphans,
        totalOrphanSize: orphanStats.totalOrphanSize,
        orphanPercentage,
        lastCleanupTime: cleanupHistory[0]?.completedAt,
        cleanupFrequency,
        averageCleanupSize,
        failureRate,
        alerts
      };

    } catch (error) {
      console.error('Error getting cleanup metrics:', error);
      throw new Error(`Failed to get cleanup metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate alerts based on current metrics
   */
  private async generateAlerts(
    orphanStats: Awaited<ReturnType<typeof cleanupEngine.getOrphanStatistics>>,
    orphanPercentage: number,
    failureRate: number,
    scheduleStats: Awaited<ReturnType<typeof cleanupScheduler.getScheduleStatistics>>
  ): Promise<CleanupAlert[]> {
    const alerts: CleanupAlert[] = [];

    // High orphan percentage alert
    if (orphanPercentage > 20) {
      alerts.push({
        id: `orphan_percentage_${Date.now()}`,
        type: 'warning',
        title: 'High Orphan File Percentage',
        message: `${orphanPercentage.toFixed(1)}% of media files are orphaned. Consider running cleanup.`,
        timestamp: new Date(),
        data: {
          orphanPercentage,
          totalOrphans: orphanStats.totalOrphans,
          totalSize: orphanStats.totalOrphanSize
        }
      });
    }

    // Large storage usage alert
    const orphanSizeGB = orphanStats.totalOrphanSize / (1024 * 1024 * 1024);
    if (orphanSizeGB > 1) {
      alerts.push({
        id: `storage_usage_${Date.now()}`,
        type: 'warning',
        title: 'High Orphan Storage Usage',
        message: `Orphaned files are using ${orphanSizeGB.toFixed(2)} GB of storage space.`,
        timestamp: new Date(),
        data: {
          sizeGB: orphanSizeGB,
          totalOrphans: orphanStats.totalOrphans
        }
      });
    }

    // High failure rate alert
    if (failureRate > 10) {
      alerts.push({
        id: `failure_rate_${Date.now()}`,
        type: 'error',
        title: 'High Cleanup Failure Rate',
        message: `${failureRate.toFixed(1)}% of cleanup operations are failing. Check system logs.`,
        timestamp: new Date(),
        data: {
          failureRate
        }
      });
    }

    // No active schedules alert
    if (scheduleStats.activeSchedules === 0 && scheduleStats.totalSchedules > 0) {
      alerts.push({
        id: `no_active_schedules_${Date.now()}`,
        type: 'warning',
        title: 'No Active Cleanup Schedules',
        message: 'All cleanup schedules are disabled. Orphaned files may accumulate.',
        timestamp: new Date(),
        data: {
          totalSchedules: scheduleStats.totalSchedules
        }
      });
    }

    // Old orphan files alert
    if (orphanStats.oldestOrphan) {
      const daysSinceOldest = Math.floor(
        (Date.now() - orphanStats.oldestOrphan.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceOldest > 90) {
        alerts.push({
          id: `old_orphans_${Date.now()}`,
          type: 'info',
          title: 'Old Orphaned Files Detected',
          message: `Some orphaned files are ${daysSinceOldest} days old. Consider cleanup.`,
          timestamp: new Date(),
          data: {
            daysSinceOldest,
            oldestOrphan: orphanStats.oldestOrphan
          }
        });
      }
    }

    return alerts;
  }

  /**
   * Get total number of media files (for percentage calculations)
   */
  private async getTotalMediaFiles(): Promise<number> {
    try {
      // This would typically query the database
      // For now, we'll use a placeholder implementation
      return 1000; // Placeholder value
    } catch (error) {
      console.error('Error getting total media files count:', error);
      return 0;
    }
  }

  /**
   * Check system health and return status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    details: Record<string, unknown>;
  }> {
    try {
      const metrics = await this.getMetrics();
      
      // Determine overall health status
      const hasErrors = metrics.alerts.some(alert => alert.type === 'error');
      const hasWarnings = metrics.alerts.some(alert => alert.type === 'warning');
      
      let status: 'healthy' | 'warning' | 'critical';
      let message: string;
      
      if (hasErrors || metrics.failureRate > 25) {
        status = 'critical';
        message = 'Cleanup system has critical issues requiring immediate attention';
      } else if (hasWarnings || metrics.orphanPercentage > 30) {
        status = 'warning';
        message = 'Cleanup system has warnings that should be addressed';
      } else {
        status = 'healthy';
        message = 'Cleanup system is operating normally';
      }

      return {
        status,
        message,
        details: {
          orphanPercentage: metrics.orphanPercentage,
          failureRate: metrics.failureRate,
          totalAlerts: metrics.alerts.length,
          lastCleanup: metrics.lastCleanupTime
        }
      };

    } catch (error) {
      return {
        status: 'critical',
        message: 'Unable to determine cleanup system health',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Send alerts to configured notification channels
   * This is a placeholder for integration with notification systems
   */
  async sendAlert(alert: CleanupAlert): Promise<void> {
    // In a real implementation, this would send notifications via:
    // - Email
    // - Slack
    // - Discord
    // - SMS
    // - Push notifications
    // - Webhook endpoints
    
    console.log(`[CLEANUP ALERT] ${alert.type.toUpperCase()}: ${alert.title}`);
    console.log(`Message: ${alert.message}`);
    console.log(`Timestamp: ${alert.timestamp.toISOString()}`);
    
    if (alert.data) {
      console.log('Data:', JSON.stringify(alert.data, null, 2));
    }
  }

  /**
   * Get cleanup recommendations based on current state
   */
  async getRecommendations(): Promise<string[]> {
    const metrics = await this.getMetrics();
    const recommendations: string[] = [];

    if (metrics.orphanPercentage > 20) {
      recommendations.push('Run manual cleanup to reduce orphaned file percentage');
    }

    if (metrics.totalOrphanSize > 1024 * 1024 * 1024) { // > 1GB
      recommendations.push('Large amount of orphaned storage detected - cleanup recommended');
    }

    if (metrics.failureRate > 10) {
      recommendations.push('High cleanup failure rate - check system logs and configuration');
    }

    if (!metrics.lastCleanupTime || 
        metrics.lastCleanupTime < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
      recommendations.push('No recent cleanup operations - consider scheduling regular cleanups');
    }

    if (metrics.cleanupFrequency < 1) {
      recommendations.push('Low cleanup frequency - consider increasing cleanup schedule frequency');
    }

    if (recommendations.length === 0) {
      recommendations.push('Cleanup system is operating well - no immediate actions needed');
    }

    return recommendations;
  }
}

// Export singleton instance
export const cleanupMonitor = new CleanupMonitor();