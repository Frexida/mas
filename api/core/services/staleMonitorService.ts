// Stale Message Monitor Service
import type { MessageLog, MessageSender, ReminderLog, ReminderTrigger } from '../types/messageLog.js';
import { checkStaleMessages, getReminderMessage, expandTarget } from '../lib/messageLogic.js';
import { MessageLogService } from './messageLogService.js';
import { randomUUID } from 'crypto';

export interface MonitorConfig {
  thresholdMs: number;  // Time before considering stale (default: 3 min)
  intervalMs: number;   // Check interval (default: 30 sec)
}

const DEFAULT_CONFIG: MonitorConfig = {
  thresholdMs: 180000,  // 3 minutes
  intervalMs: 30000,    // 30 seconds
};

export class StaleMonitorService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private lastReminders: Map<string, Set<string>> = new Map();  // Prevent duplicate reminders
  private config: MonitorConfig;

  constructor(
    private logService: MessageLogService,
    private messageSender: MessageSender,
    config: Partial<MonitorConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  isMonitoring(sessionId: string): boolean {
    return this.intervals.has(sessionId);
  }

  start(sessionId: string): void {
    if (this.intervals.has(sessionId)) {
      return;
    }

    console.log(`[StaleMonitor] Starting monitor for session: ${sessionId}`);

    const interval = setInterval(async () => {
      try {
        await this.checkAndRemind(sessionId);
      } catch (error) {
        console.error(`[StaleMonitor] Error checking session ${sessionId}:`, error);
      }
    }, this.config.intervalMs);

    this.intervals.set(sessionId, interval);
    this.lastReminders.set(sessionId, new Set());
  }

  stop(sessionId: string): void {
    const interval = this.intervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(sessionId);
      this.lastReminders.delete(sessionId);
      console.log(`[StaleMonitor] Stopped monitor for session: ${sessionId}`);
    }
  }

  stopAll(): void {
    for (const sessionId of this.intervals.keys()) {
      this.stop(sessionId);
    }
  }

  async checkAndRemind(sessionId: string): Promise<void> {
    const logs = await this.logService.getLogs(sessionId);
    const staleResults = checkStaleMessages(logs, this.config.thresholdMs);
    const sentReminders = this.lastReminders.get(sessionId) || new Set();

    for (const result of staleResults) {
      if (!result.stale || !result.type || !result.from) continue;

      // Create unique key for this stale condition
      const staleKey = `${result.type}:${result.from}:${result.to}`;

      // Skip if we already sent a reminder for this condition
      if (sentReminders.has(staleKey)) {
        continue;
      }

      // Determine target for reminder
      const target = result.type === 'instruction' ? result.from! : result.from!;
      const message = getReminderMessage(result.type);

      try {
        // Send reminder
        await this.messageSender.send(target, message, sessionId, true);

        // Log the reminder
        const reminderLog: ReminderLog = {
          id: randomUUID(),
          sessionId,
          timestamp: new Date().toISOString(),
          sender: 'system',
          target,
          recipients: expandTarget(target),
          message,
          type: 'reminder',
          execute: true,
          reason: result.type === 'instruction' ? 'no_instruction' : 'no_report',
          triggeredBy: {
            expectedSender: result.from!,
            expectedRecipient: result.to!,
            lastMessageAt: result.lastMessageAt || null,
          },
        };

        // Log to message service
        await this.logService.logMessage({
          sessionId,
          sender: 'system',
          target,
          message,
          execute: true,
        });

        // Mark as sent
        sentReminders.add(staleKey);
        console.log(`[StaleMonitor] Sent reminder to ${target} for ${result.type} stale`);
      } catch (error) {
        console.error(`[StaleMonitor] Failed to send reminder:`, error);
      }
    }

    // Clean up old reminders when activity resumes
    // If there are no stale results for a key, remove it from sent reminders
    const currentStaleKeys = new Set(
      staleResults
        .filter(r => r.stale)
        .map(r => `${r.type}:${r.from}:${r.to}`)
    );

    for (const key of sentReminders) {
      if (!currentStaleKeys.has(key)) {
        sentReminders.delete(key);
      }
    }
  }

  getStatus(sessionId: string): {
    monitoring: boolean;
    config: MonitorConfig;
  } {
    return {
      monitoring: this.isMonitoring(sessionId),
      config: this.config,
    };
  }
}
