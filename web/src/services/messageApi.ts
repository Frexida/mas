// Message API service
import { getApiBaseUrl } from './apiConfig';

export type Channel = 'all' | 'unit-0' | 'unit-1' | 'unit-2' | 'unit-3';
export type MessageType = 'instruction' | 'report' | 'broadcast' | 'reminder';

export interface MessageLog {
  id: string;
  sessionId: string;
  timestamp: string;
  sender: string;
  target: string;
  recipients: string[];
  message: string;
  type: MessageType;
  execute: boolean;
}

export interface GetLogsResponse {
  logs: MessageLog[];
  count: number;
  sessionId: string;
  channel: Channel;
}

export interface MessageStats {
  sessionId: string;
  totalCount: number;
  lastMessageAt: string | null;
  byType: Record<string, number>;
  bySender: Record<string, number>;
}

export interface MonitorStatus {
  sessionId: string;
  monitoring: boolean;
  config: {
    thresholdMs: number;
    intervalMs: number;
  };
}

export async function getMessageLogs(
  sessionId: string,
  options: {
    channel?: Channel;
    limit?: number;
    before?: string;
  } = {}
): Promise<GetLogsResponse> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({ sessionId });

  if (options.channel) params.append('channel', options.channel);
  if (options.limit) params.append('limit', String(options.limit));
  if (options.before) params.append('before', options.before);

  const response = await fetch(`${baseUrl}/messages?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch logs: ${response.statusText}`);
  }
  return response.json();
}

export async function getMessageStats(sessionId: string): Promise<MessageStats> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/messages/stats?sessionId=${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }
  return response.json();
}

export async function startMonitor(sessionId: string): Promise<{ status: string }> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/monitor/start?sessionId=${sessionId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to start monitor: ${response.statusText}`);
  }
  return response.json();
}

export async function stopMonitor(sessionId: string): Promise<{ status: string }> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/monitor/stop?sessionId=${sessionId}`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to stop monitor: ${response.statusText}`);
  }
  return response.json();
}

export async function getMonitorStatus(sessionId: string): Promise<MonitorStatus> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/monitor/status?sessionId=${sessionId}`);
  if (!response.ok) {
    throw new Error(`Failed to get monitor status: ${response.statusText}`);
  }
  return response.json();
}

// Helper functions
export function getUnitName(agentId: string): string {
  const unitNum = agentId.charAt(0);
  switch (unitNum) {
    case '0': return 'Meta';
    case '1': return 'Design';
    case '2': return 'Development';
    case '3': return 'Business';
    default: return 'System';
  }
}

export function getAgentDisplayName(agentId: string): string {
  if (agentId === 'system') return 'System';
  const unit = getUnitName(agentId);
  const isManager = ['00', '10', '20', '30'].includes(agentId);
  return `${unit} ${isManager ? 'Manager' : 'Worker'} (${agentId})`;
}

export function getAgentColor(agentId: string): string {
  if (agentId === 'system') return 'bg-mas-text-muted';
  const unitNum = agentId.charAt(0);
  switch (unitNum) {
    case '0': return 'bg-mas-purple';
    case '1': return 'bg-mas-blue';
    case '2': return 'bg-mas-status-ok';
    case '3': return 'bg-mas-status-warning';
    default: return 'bg-mas-text-muted';
  }
}
