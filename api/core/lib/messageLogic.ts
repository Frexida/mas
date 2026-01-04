// Pure functions for message log logic
import type { MessageLog, Channel, StaleResult, MessageType } from '../types/messageLog.js';

// Agent ID patterns
const UNIT_AGENTS: Record<string, string[]> = {
  'unit-0': ['00'],
  'unit-1': ['10', '11', '12', '13'],
  'unit-2': ['20', '21', '22', '23'],
  'unit-3': ['30', '31', '32', '33'],
};

const ALL_AGENTS = Object.values(UNIT_AGENTS).flat();

// Instruction flow pairs (manager -> workers)
const INSTRUCTION_PAIRS = [
  { from: '00', to: ['10', '20', '30'] },
  { from: '10', to: ['11', '12', '13'] },
  { from: '20', to: ['21', '22', '23'] },
  { from: '30', to: ['31', '32', '33'] },
];

// Report flow pairs (workers -> manager)
const REPORT_PAIRS = INSTRUCTION_PAIRS.map(p => ({
  from: p.to,
  to: p.from,
}));

/**
 * Expand target string to list of agent IDs
 */
export function expandTarget(target: string): string[] {
  // Individual agent (00-33)
  if (/^[0-3][0-3]$/.test(target)) {
    return [target];
  }

  // agent-XX format
  if (target.startsWith('agent-')) {
    const id = target.replace('agent-', '');
    if (/^[0-3][0-3]$/.test(id)) {
      return [id];
    }
  }

  // Unit names
  switch (target) {
    case 'meta':
    case '0':
      return ['00'];
    case 'design':
    case '1':
      return ['10', '11', '12', '13'];
    case 'development':
    case '2':
      return ['20', '21', '22', '23'];
    case 'business':
    case '3':
      return ['30', '31', '32', '33'];
    case 'managers':
      return ['00', '10', '20', '30'];
    case 'workers':
      return ['11', '12', '13', '21', '22', '23', '31', '32', '33'];
    case 'all':
      return ALL_AGENTS;
  }

  // Window format (window0-3)
  const windowMatch = target.match(/^window([0-3])$/);
  if (windowMatch) {
    const num = windowMatch[1];
    return num === '0' ? ['00'] : UNIT_AGENTS[`unit-${num}`] || [];
  }

  // Comma-separated list
  if (target.includes(',')) {
    const parts = target.split(',').map(t => t.trim());
    const result: string[] = [];
    for (const part of parts) {
      result.push(...expandTarget(part));
    }
    return [...new Set(result)];
  }

  return [];
}

/**
 * Filter logs by channel
 */
export function filterByChannel(logs: MessageLog[], channel: Channel): MessageLog[] {
  if (channel === 'all') {
    return logs;
  }

  const unitAgents = UNIT_AGENTS[channel];
  if (!unitAgents) {
    return logs;
  }

  return logs.filter(log =>
    unitAgents.includes(log.sender) ||
    log.recipients.some(r => unitAgents.includes(r))
  );
}

/**
 * Infer message type from content and sender/target
 */
export function inferMessageType(
  sender: string,
  target: string,
  message: string
): MessageType {
  // System messages
  if (sender === 'system') {
    return 'reminder';
  }

  // Broadcast patterns
  const broadcastTargets = ['all', 'managers', 'workers'];
  if (broadcastTargets.includes(target)) {
    return 'broadcast';
  }

  // Check if it's instruction (manager -> worker direction)
  for (const pair of INSTRUCTION_PAIRS) {
    if (pair.from === sender) {
      const recipients = expandTarget(target);
      if (recipients.some(r => pair.to.includes(r))) {
        return 'instruction';
      }
    }
  }

  // Check if it's report (worker -> manager direction)
  for (const pair of REPORT_PAIRS) {
    if (Array.isArray(pair.from) && pair.from.includes(sender)) {
      const recipients = expandTarget(target);
      if (recipients.includes(pair.to)) {
        return 'report';
      }
    }
  }

  // Default to broadcast for peer communication
  return 'broadcast';
}

/**
 * Check for stale messages in instruction/report flows
 */
export function checkStaleMessages(
  logs: MessageLog[],
  thresholdMs: number = 180000 // 3 minutes
): StaleResult[] {
  const now = Date.now();
  const results: StaleResult[] = [];

  // Check instruction flow
  for (const pair of INSTRUCTION_PAIRS) {
    const relevantLogs = logs.filter(l =>
      l.sender === pair.from &&
      l.recipients.some(r => pair.to.includes(r))
    );

    const lastMessage = relevantLogs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    const lastTime = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;

    if (now - lastTime > thresholdMs) {
      results.push({
        stale: true,
        type: 'instruction',
        from: pair.from,
        to: pair.to[0],
        lastMessageAt: lastMessage?.timestamp || null,
      });
    }
  }

  // Check report flow
  for (const pair of REPORT_PAIRS) {
    const fromAgents = pair.from as string[];
    const relevantLogs = logs.filter(l =>
      fromAgents.includes(l.sender) &&
      l.recipients.includes(pair.to)
    );

    const lastMessage = relevantLogs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    const lastTime = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;

    if (now - lastTime > thresholdMs) {
      results.push({
        stale: true,
        type: 'report',
        from: fromAgents[0],
        to: pair.to,
        lastMessageAt: lastMessage?.timestamp || null,
      });
    }
  }

  return results;
}

/**
 * Get reminder message based on stale type
 */
export function getReminderMessage(type: 'instruction' | 'report'): string {
  if (type === 'instruction') {
    return '【システム通知】タスクの割り振りを完了してください。待機中のエージェントがいます。';
  }
  return '【システム通知】進捗を報告してください。マネージャーが待っています。';
}

/**
 * Get unit name from agent ID
 */
export function getUnitName(agentId: string): string {
  const unitNum = agentId.charAt(0);
  switch (unitNum) {
    case '0': return 'Meta';
    case '1': return 'Design';
    case '2': return 'Development';
    case '3': return 'Business';
    default: return 'Unknown';
  }
}

/**
 * Check if agent ID is a manager
 */
export function isManager(agentId: string): boolean {
  return ['00', '10', '20', '30'].includes(agentId);
}
