// Message Log Service
import { randomUUID } from 'crypto';
import type { MessageLog, MessageLogStore, Channel } from '../types/messageLog.js';
import { expandTarget, filterByChannel, inferMessageType } from '../lib/messageLogic.js';

export interface LogMessageParams {
  sessionId: string;
  sender: string;
  target: string;
  message: string;
  execute: boolean;
}

export interface GetLogsOptions {
  channel?: Channel;
  limit?: number;
  before?: string;
}

export class MessageLogService {
  constructor(private store: MessageLogStore) {}

  async logMessage(params: LogMessageParams): Promise<MessageLog> {
    const { sessionId, sender, target, message, execute } = params;

    const log: MessageLog = {
      id: randomUUID(),
      sessionId,
      timestamp: new Date().toISOString(),
      sender,
      target,
      recipients: expandTarget(target),
      message,
      type: inferMessageType(sender, target, message),
      execute,
    };

    await this.store.append(log);
    return log;
  }

  async getLogs(sessionId: string, options: GetLogsOptions = {}): Promise<MessageLog[]> {
    let logs = await this.store.getAll(sessionId);

    // Filter by channel
    if (options.channel) {
      logs = filterByChannel(logs, options.channel);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by before timestamp
    if (options.before) {
      const beforeTime = new Date(options.before).getTime();
      logs = logs.filter(l => new Date(l.timestamp).getTime() < beforeTime);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  }

  async getStats(sessionId: string): Promise<{
    totalCount: number;
    lastMessageAt: string | null;
    byType: Record<string, number>;
    bySender: Record<string, number>;
  }> {
    const logs = await this.store.getAll(sessionId);

    const stats = {
      totalCount: logs.length,
      lastMessageAt: null as string | null,
      byType: {} as Record<string, number>,
      bySender: {} as Record<string, number>,
    };

    if (logs.length > 0) {
      // Sort to get last message
      const sorted = [...logs].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      stats.lastMessageAt = sorted[0].timestamp;

      // Count by type
      for (const log of logs) {
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
        stats.bySender[log.sender] = (stats.bySender[log.sender] || 0) + 1;
      }
    }

    return stats;
  }

  async clear(sessionId: string): Promise<void> {
    await this.store.clear(sessionId);
  }
}
