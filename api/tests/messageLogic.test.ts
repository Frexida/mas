import { describe, it, expect } from 'vitest';
import {
  expandTarget,
  filterByChannel,
  inferMessageType,
  checkStaleMessages,
  getReminderMessage,
  getUnitName,
  isManager,
} from '../core/lib/messageLogic.js';
import type { MessageLog } from '../core/types/messageLog.js';

describe('expandTarget', () => {
  it('should expand individual agent IDs', () => {
    expect(expandTarget('00')).toEqual(['00']);
    expect(expandTarget('21')).toEqual(['21']);
  });

  it('should expand agent-XX format', () => {
    expect(expandTarget('agent-10')).toEqual(['10']);
  });

  it('should expand unit names', () => {
    expect(expandTarget('meta')).toEqual(['00']);
    expect(expandTarget('design')).toEqual(['10', '11', '12', '13']);
    expect(expandTarget('development')).toEqual(['20', '21', '22', '23']);
    expect(expandTarget('business')).toEqual(['30', '31', '32', '33']);
  });

  it('should expand numeric unit aliases', () => {
    expect(expandTarget('0')).toEqual(['00']);
    expect(expandTarget('1')).toEqual(['10', '11', '12', '13']);
    expect(expandTarget('2')).toEqual(['20', '21', '22', '23']);
    expect(expandTarget('3')).toEqual(['30', '31', '32', '33']);
  });

  it('should expand group names', () => {
    expect(expandTarget('managers')).toEqual(['00', '10', '20', '30']);
    expect(expandTarget('workers')).toContain('11');
    expect(expandTarget('workers')).not.toContain('00');
    expect(expandTarget('all')).toHaveLength(13);
  });

  it('should expand comma-separated targets', () => {
    const result = expandTarget('00, 10, 20');
    expect(result).toContain('00');
    expect(result).toContain('10');
    expect(result).toContain('20');
  });

  it('should return empty for invalid targets', () => {
    expect(expandTarget('invalid')).toEqual([]);
    expect(expandTarget('99')).toEqual([]);
  });
});

describe('filterByChannel', () => {
  const mockLogs: MessageLog[] = [
    {
      id: '1',
      sessionId: 'test',
      timestamp: '2024-01-01T00:00:00Z',
      sender: '00',
      target: '10',
      recipients: ['10'],
      message: 'test',
      type: 'instruction',
      execute: true,
    },
    {
      id: '2',
      sessionId: 'test',
      timestamp: '2024-01-01T00:01:00Z',
      sender: '21',
      target: '20',
      recipients: ['20'],
      message: 'test',
      type: 'report',
      execute: true,
    },
  ];

  it('should return all logs for "all" channel', () => {
    expect(filterByChannel(mockLogs, 'all')).toHaveLength(2);
  });

  it('should filter by unit-0 (meta)', () => {
    const result = filterByChannel(mockLogs, 'unit-0');
    expect(result).toHaveLength(1);
    expect(result[0].sender).toBe('00');
  });

  it('should filter by unit-2 (development)', () => {
    const result = filterByChannel(mockLogs, 'unit-2');
    expect(result).toHaveLength(1);
    expect(result[0].sender).toBe('21');
  });
});

describe('inferMessageType', () => {
  it('should identify system messages as reminder', () => {
    expect(inferMessageType('system', '10', 'test')).toBe('reminder');
  });

  it('should identify broadcast targets', () => {
    expect(inferMessageType('00', 'all', 'test')).toBe('broadcast');
    expect(inferMessageType('00', 'managers', 'test')).toBe('broadcast');
  });

  it('should identify instruction flow', () => {
    expect(inferMessageType('00', '10', 'test')).toBe('instruction');
    expect(inferMessageType('20', '21', 'test')).toBe('instruction');
  });

  it('should identify report flow', () => {
    expect(inferMessageType('21', '20', 'test')).toBe('report');
    expect(inferMessageType('11', '10', 'test')).toBe('report');
  });
});

describe('checkStaleMessages', () => {
  it('should detect stale when no messages exist', () => {
    const results = checkStaleMessages([], 1000);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.stale)).toBe(true);
  });

  it('should not detect stale for recent messages', () => {
    const recentLogs: MessageLog[] = [
      {
        id: '1',
        sessionId: 'test',
        timestamp: new Date().toISOString(),
        sender: '00',
        target: 'managers',
        recipients: ['10', '20', '30'],
        message: 'test',
        type: 'instruction',
        execute: true,
      },
    ];

    const results = checkStaleMessages(recentLogs, 180000);
    // Should not be stale for the 00->managers flow
    const staleFor00 = results.find((r) => r.from === '00' && r.type === 'instruction');
    expect(staleFor00?.stale).toBeFalsy();
  });
});

describe('getReminderMessage', () => {
  it('should return instruction reminder', () => {
    const msg = getReminderMessage('instruction');
    expect(msg).toContain('タスクの割り振り');
  });

  it('should return report reminder', () => {
    const msg = getReminderMessage('report');
    expect(msg).toContain('報告');
  });
});

describe('getUnitName', () => {
  it('should return correct unit names', () => {
    expect(getUnitName('00')).toBe('Meta');
    expect(getUnitName('10')).toBe('Design');
    expect(getUnitName('21')).toBe('Development');
    expect(getUnitName('33')).toBe('Business');
  });
});

describe('isManager', () => {
  it('should identify managers', () => {
    expect(isManager('00')).toBe(true);
    expect(isManager('10')).toBe(true);
    expect(isManager('20')).toBe(true);
    expect(isManager('30')).toBe(true);
  });

  it('should identify workers', () => {
    expect(isManager('11')).toBe(false);
    expect(isManager('21')).toBe(false);
    expect(isManager('32')).toBe(false);
  });
});
