// In-memory implementation for testing
import type { MessageLog, MessageLogStore } from '../types/messageLog.js';

export class InMemoryMessageLogStore implements MessageLogStore {
  private logs: Map<string, MessageLog[]> = new Map();

  async append(log: MessageLog): Promise<void> {
    const sessionLogs = this.logs.get(log.sessionId) || [];
    sessionLogs.push(log);
    this.logs.set(log.sessionId, sessionLogs);
  }

  async getAll(sessionId: string): Promise<MessageLog[]> {
    return this.logs.get(sessionId) || [];
  }

  async clear(sessionId: string): Promise<void> {
    this.logs.delete(sessionId);
  }

  // Test helper
  clearAll(): void {
    this.logs.clear();
  }
}
