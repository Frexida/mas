/**
 * Session management type definitions
 */

export type SessionStatus = 'active' | 'inactive' | 'terminated';

export interface SessionInfo {
  sessionId: string;           // UUID
  tmuxSession: string;         // mas-XXXXXXXX format
  status: SessionStatus;
  workingDir: string;
  startedAt: string;           // ISO 8601 datetime
  agentCount: number;
  httpServerStatus: 'running' | 'stopped';
}

export interface AgentStatus {
  agentId: string;             // Two-digit ID (00, 10, 11, etc.)
  name: string;
  status: 'running' | 'stopped' | 'error';
  window: string;
  pane: number;
}

export interface WindowInfo {
  name: string;
  index: number;
  paneCount: number;
  active: boolean;
}

export interface SessionDetail extends SessionInfo {
  lastActivity?: string;       // ISO 8601 datetime
  agents: AgentStatus[];
  windows: WindowInfo[];
  config?: any;                // Original agent configuration
}

export interface ConnectionInfo {
  sessionId: string;
  tmuxSession: string;
  attachCommand: string;
  status: 'connected' | 'failed';
  timestamp: string;
  connectionDetails?: {
    windows: number;
    activeAgents: number;
    focusedWindow?: string;
  };
}

export interface SessionListResponse {
  sessions: SessionInfo[];
  total: number;
  timestamp: string;
}

export interface SessionListQuery {
  status?: 'active' | 'inactive' | 'all';
  limit?: number;
  offset?: number;
}

export interface ConnectRequest {
  reconnect?: boolean;
  window?: 'meta' | 'design' | 'development' | 'business';
}

export interface StopRequest {
  force?: boolean;
}

export interface ErrorResponse {
  error: string;
  details?: any;
  timestamp: string;
}