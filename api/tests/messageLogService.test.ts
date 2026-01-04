import { describe, it, expect, beforeEach } from 'vitest';
import { MessageLogService } from '../core/services/messageLogService.js';
import { InMemoryMessageLogStore } from '../core/stores/inMemoryMessageLogStore.js';

describe('MessageLogService', () => {
  let store: InMemoryMessageLogStore;
  let service: MessageLogService;

  beforeEach(() => {
    store = new InMemoryMessageLogStore();
    service = new MessageLogService(store);
  });

  describe('logMessage', () => {
    it('should create a log entry with all fields', async () => {
      const log = await service.logMessage({
        sessionId: 'test-session',
        sender: '00',
        target: 'development',
        message: 'Start the task',
        execute: true,
      });

      expect(log.id).toBeDefined();
      expect(log.sessionId).toBe('test-session');
      expect(log.sender).toBe('00');
      expect(log.target).toBe('development');
      expect(log.recipients).toEqual(['20', '21', '22', '23']);
      expect(log.message).toBe('Start the task');
      expect(log.type).toBe('instruction');
      expect(log.execute).toBe(true);
      expect(log.timestamp).toBeDefined();
    });

    it('should infer message type correctly', async () => {
      // Instruction
      const instructionLog = await service.logMessage({
        sessionId: 'test',
        sender: '20',
        target: '21',
        message: 'Do this',
        execute: true,
      });
      expect(instructionLog.type).toBe('instruction');

      // Report
      const reportLog = await service.logMessage({
        sessionId: 'test',
        sender: '21',
        target: '20',
        message: 'Done',
        execute: true,
      });
      expect(reportLog.type).toBe('report');

      // Broadcast
      const broadcastLog = await service.logMessage({
        sessionId: 'test',
        sender: '00',
        target: 'all',
        message: 'Hello everyone',
        execute: true,
      });
      expect(broadcastLog.type).toBe('broadcast');
    });
  });

  describe('getLogs', () => {
    beforeEach(async () => {
      // Add some test logs
      await service.logMessage({
        sessionId: 'session1',
        sender: '00',
        target: '10',
        message: 'msg1',
        execute: true,
      });
      await service.logMessage({
        sessionId: 'session1',
        sender: '10',
        target: '11',
        message: 'msg2',
        execute: true,
      });
      await service.logMessage({
        sessionId: 'session1',
        sender: '21',
        target: '20',
        message: 'msg3',
        execute: true,
      });
    });

    it('should return all logs for a session', async () => {
      const logs = await service.getLogs('session1');
      expect(logs).toHaveLength(3);
    });

    it('should filter by channel', async () => {
      const logs = await service.getLogs('session1', { channel: 'unit-1' });
      expect(logs).toHaveLength(2); // 00->10 and 10->11
    });

    it('should limit results', async () => {
      const logs = await service.getLogs('session1', { limit: 2 });
      expect(logs).toHaveLength(2);
    });

    it('should sort by timestamp descending', async () => {
      const logs = await service.getLogs('session1');
      for (let i = 1; i < logs.length; i++) {
        expect(new Date(logs[i - 1].timestamp).getTime())
          .toBeGreaterThanOrEqual(new Date(logs[i].timestamp).getTime());
      }
    });

    it('should return empty array for unknown session', async () => {
      const logs = await service.getLogs('unknown-session');
      expect(logs).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      await service.logMessage({
        sessionId: 'test',
        sender: '00',
        target: '10',
        message: 'msg1',
        execute: true,
      });
      await service.logMessage({
        sessionId: 'test',
        sender: '10',
        target: '11',
        message: 'msg2',
        execute: true,
      });

      const stats = await service.getStats('test');

      expect(stats.totalCount).toBe(2);
      expect(stats.lastMessageAt).toBeDefined();
      expect(stats.byType).toHaveProperty('instruction');
      expect(stats.bySender['00']).toBe(1);
      expect(stats.bySender['10']).toBe(1);
    });

    it('should handle empty session', async () => {
      const stats = await service.getStats('empty');

      expect(stats.totalCount).toBe(0);
      expect(stats.lastMessageAt).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all logs for a session', async () => {
      await service.logMessage({
        sessionId: 'test',
        sender: '00',
        target: '10',
        message: 'msg',
        execute: true,
      });

      await service.clear('test');

      const logs = await service.getLogs('test');
      expect(logs).toHaveLength(0);
    });
  });
});
