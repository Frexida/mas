// File-based implementation for production
import fs from 'fs/promises';
import path from 'path';
import type { MessageLog, MessageLogStore } from '../types/messageLog.js';

export class FileMessageLogStore implements MessageLogStore {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private getFilePath(sessionId: string): string {
    return path.join(this.basePath, sessionId, 'messages.json');
  }

  private async ensureDir(sessionId: string): Promise<void> {
    const dir = path.join(this.basePath, sessionId);
    await fs.mkdir(dir, { recursive: true });
  }

  async append(log: MessageLog): Promise<void> {
    await this.ensureDir(log.sessionId);
    const filePath = this.getFilePath(log.sessionId);

    let logs: MessageLog[] = [];
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      logs = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    logs.push(log);
    await fs.writeFile(filePath, JSON.stringify(logs, null, 2));
  }

  async getAll(sessionId: string): Promise<MessageLog[]> {
    const filePath = this.getFilePath(sessionId);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async clear(sessionId: string): Promise<void> {
    const filePath = this.getFilePath(sessionId);

    try {
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist
    }
  }
}
