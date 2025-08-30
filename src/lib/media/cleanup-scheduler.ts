import { PrismaClient } from '@prisma/client';
import { cleanupEngine, CleanupSchedule } from './cleanup-engine';

// Types for cleanup scheduling
export interface CleanupScheduleConfig {
  id?: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  olderThanDays: number;
  dryRun: boolean;
  enabled: boolean;
  maxFiles?: number;
  createdBy?: string;
}

export interface ScheduledCleanupRun {
  id: string;
  scheduleId: string;
  scheduleName: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
  filesProcessed: number;
  filesDeleted: number;
  spaceFreed: number;
  errorMessage?: string;
}

export class CleanupScheduler {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Create a new cleanup schedule
   */
  async createSchedule(config: CleanupScheduleConfig): Promise<string> {
    // Validate time format
    if (!this.isValidTimeFormat(config.time)) {
      throw new Error('Invalid time format. Use HH:MM format (24-hour)');
    }

    // Validate frequency
    if (!['daily', 'weekly', 'monthly'].includes(config.frequency)) {
      throw new Error('Invalid frequency. Must be daily, weekly, or monthly');
    }

    // Validate olderThanDays
    if (config.olderThanDays < 1) {
      throw new Error('olderThanDays must be at least 1');
    }

    // Store schedule configuration in database
    // Note: In a real implementation, you'd have a cleanup_schedules table
    // For now, we'll use a simple JSON storage approach
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // This would typically be stored in a database table
    console.log(`Created cleanup schedule: ${scheduleId}`, config);
    
    return scheduleId;
  }

  /**
   * Update an existing cleanup schedule
   */
  async updateSchedule(scheduleId: string, config: Partial<CleanupScheduleConfig>): Promise<void> {
    if (config.time && !this.isValidTimeFormat(config.time)) {
      throw new Error('Invalid time format. Use HH:MM format (24-hour)');
    }

    if (config.frequency && !['daily', 'weekly', 'monthly'].includes(config.frequency)) {
      throw new Error('Invalid frequency. Must be daily, weekly, or monthly');
    }

    if (config.olderThanDays !== undefined && config.olderThanDays < 1) {
      throw new Error('olderThanDays must be at least 1');
    }

    // Update schedule in database
    console.log(`Updated cleanup schedule: ${scheduleId}`, config);
  }

  /**
   * Delete a cleanup schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    // Delete schedule from database
    console.log(`Deleted cleanup schedule: ${scheduleId}`);
  }

  /**
   * Get all cleanup schedules
   */
  async getSchedules(): Promise<CleanupScheduleConfig[]> {
    // This would fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Get a specific cleanup schedule
   */
  async getSchedule(scheduleId: string): Promise<CleanupScheduleConfig | null> {
    // This would fetch from database
    console.log(`Fetching schedule: ${scheduleId}`);
    return null;
  }

  /**
   * Execute a scheduled cleanup
   */
  async executeScheduledCleanup(scheduleId: string): Promise<ScheduledCleanupRun> {
    const schedule = await this.getSchedule(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    if (!schedule.enabled) {
      throw new Error(`Schedule is disabled: ${scheduleId}`);
    }

    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startedAt = new Date();

    try {
      // Calculate cutoff date
      const olderThan = new Date();
      olderThan.setDate(olderThan.getDate() - schedule.olderThanDays);

      // Find orphaned media
      const orphans = await cleanupEngine.findOrphanedMedia(olderThan);
      
      if (orphans.length === 0) {
        return {
          id: runId,
          scheduleId,
          scheduleName: schedule.name,
          startedAt,
          completedAt: new Date(),
          status: 'completed',
          filesProcessed: 0,
          filesDeleted: 0,
          spaceFreed: 0
        };
      }

      // Limit files if specified
      const filesToProcess = schedule.maxFiles 
        ? orphans.slice(0, schedule.maxFiles)
        : orphans;
      
      const publicIds = filesToProcess.map(file => file.publicId);

      // Perform cleanup
      const result = await cleanupEngine.cleanupOrphans(publicIds, schedule.dryRun);

      return {
        id: runId,
        scheduleId,
        scheduleName: schedule.name,
        startedAt,
        completedAt: new Date(),
        status: 'completed',
        filesProcessed: result.processed,
        filesDeleted: result.deleted,
        spaceFreed: result.freedSpace
      };

    } catch (error) {
      return {
        id: runId,
        scheduleId,
        scheduleName: schedule.name,
        startedAt,
        completedAt: new Date(),
        status: 'failed',
        filesProcessed: 0,
        filesDeleted: 0,
        spaceFreed: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get scheduled cleanup run history
   */
  async getScheduledRuns(scheduleId?: string, limit: number = 50): Promise<ScheduledCleanupRun[]> {
    // This would fetch from database
    // For now, return empty array
    console.log(`Fetching scheduled runs for: ${scheduleId || 'all'}, limit: ${limit}`);
    return [];
  }

  /**
   * Check if schedules need to be executed
   * This would typically be called by a cron job or scheduler
   */
  async checkAndExecuteSchedules(): Promise<ScheduledCleanupRun[]> {
    const schedules = await this.getSchedules();
    const results: ScheduledCleanupRun[] = [];
    const now = new Date();

    for (const schedule of schedules) {
      if (!schedule.enabled || !schedule.id) continue;

      if (this.shouldExecuteSchedule(schedule, now)) {
        try {
          const result = await this.executeScheduledCleanup(schedule.id);
          results.push(result);
        } catch (error) {
          console.error(`Failed to execute scheduled cleanup ${schedule.id}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Determine if a schedule should be executed now
   */
  private shouldExecuteSchedule(schedule: CleanupScheduleConfig, now: Date): boolean {
    const [hours, minutes] = schedule.time.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Check if we're within the execution window (5 minutes)
    const timeDiff = Math.abs(now.getTime() - scheduledTime.getTime());
    const withinWindow = timeDiff <= 5 * 60 * 1000; // 5 minutes

    if (!withinWindow) return false;

    // Check frequency
    switch (schedule.frequency) {
      case 'daily':
        return true; // Execute every day at the scheduled time
      
      case 'weekly':
        return now.getDay() === 1; // Execute on Mondays
      
      case 'monthly':
        return now.getDate() === 1; // Execute on the 1st of each month
      
      default:
        return false;
    }
  }

  /**
   * Validate time format (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Get next execution time for a schedule
   */
  getNextExecutionTime(schedule: CleanupScheduleConfig): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    let nextExecution = new Date(now);
    nextExecution.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, move to the next execution
    if (nextExecution <= now) {
      switch (schedule.frequency) {
        case 'daily':
          nextExecution.setDate(nextExecution.getDate() + 1);
          break;
        case 'weekly':
          nextExecution.setDate(nextExecution.getDate() + 7);
          break;
        case 'monthly':
          nextExecution.setMonth(nextExecution.getMonth() + 1);
          nextExecution.setDate(1);
          break;
      }
    }

    return nextExecution;
  }

  /**
   * Enable or disable a schedule
   */
  async toggleSchedule(scheduleId: string, enabled: boolean): Promise<void> {
    await this.updateSchedule(scheduleId, { enabled });
  }

  /**
   * Get cleanup schedule statistics
   */
  async getScheduleStatistics(): Promise<{
    totalSchedules: number;
    activeSchedules: number;
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastRunTime?: Date;
  }> {
    const schedules = await this.getSchedules();
    const runs = await this.getScheduledRuns();

    return {
      totalSchedules: schedules.length,
      activeSchedules: schedules.filter(s => s.enabled).length,
      totalRuns: runs.length,
      successfulRuns: runs.filter(r => r.status === 'completed').length,
      failedRuns: runs.filter(r => r.status === 'failed').length,
      lastRunTime: runs[0]?.completedAt
    };
  }
}

// Export singleton instance
export const cleanupScheduler = new CleanupScheduler();