/**
 * Type definitions for MAS API (OpenAPI compliant)
 * API Spec: https://mtdnot.dev/mas/api-docs/
 */

/**
 * Agent definition
 * @property id - Two-digit numeric string (pattern: \d{2})
 * @property prompt - Agent instructions (1-5000 characters)
 */
export interface Agent {
  id: string;
  prompt: string;
}

/**
 * Unit definition containing manager and workers
 * @property unitId - Unit identifier (1-4)
 * @property manager - Unit manager agent
 * @property workers - Array of worker agents (1-5 items)
 */
export interface Unit {
  unitId: number;
  manager: Agent;
  workers: Agent[];
}

/**
 * Request payload for POST /runs endpoint
 * @property agents - Agent configuration object
 */
export interface RunsRequest {
  agents: {
    metaManager?: Agent;
    units: Unit[];
  };
}

/**
 * Response from POST /runs endpoint
 * @property sessionId - UUID of the created session
 * @property tmuxSession - Tmux session identifier
 * @property workingDir - Working directory path
 * @property startedAt - ISO 8601 timestamp
 */
export interface RunsResponse {
  sessionId: string;
  tmuxSession: string;
  workingDir: string;
  startedAt: string;
}

/**
 * Session status enumeration
 */
export type SessionStatus = 'active' | 'inactive' | 'terminated' | 'restoring';

/**
 * Session information for listing
 * @property sessionId - UUID of the session
 * @property tmuxSession - Tmux session identifier
 * @property workingDir - Working directory path
 * @property startedAt - ISO 8601 timestamp when session was created
 * @property status - Current status of the session
 * @property lastActivity - ISO 8601 timestamp of last activity (optional)
 * @property agentCount - Number of agents in the session (optional)
 * @property restorable - Whether the session can be restored (optional)
 */
export interface SessionInfo {
  sessionId: string;
  tmuxSession: string;
  workingDir: string;
  startedAt: string;
  status: SessionStatus;
  lastActivity?: string;
  agentCount?: number;
  restorable?: boolean;
}

/**
 * Response from GET /sessions endpoint
 * @property sessions - Array of available sessions
 * @property count - Total number of sessions
 */
export interface SessionListResponse {
  sessions: SessionInfo[];
  count: number;
}

/**
 * Request parameters for GET /sessions endpoint
 * @property status - Filter by session status (optional)
 * @property limit - Maximum number of sessions to return (optional)
 * @property offset - Number of sessions to skip (optional)
 */
export interface SessionListRequest {
  status?: SessionStatus;
  limit?: number;
  offset?: number;
}

/**
 * Request payload for POST /message endpoint
 * @property target - Target recipient (e.g., "window1", "agent-11", "all")
 * @property message - Message content to send
 * @property execute - Whether to execute as command (default: false)
 * @property session - Tmux session name (required)
 */
export interface MessageRequest {
  target: string;
  message: string;
  execute?: boolean;
  session: string;
}

/**
 * Response from POST /message endpoint
 * @property status - Acknowledgment status
 * @property target - Target that received the message
 * @property timestamp - ISO 8601 timestamp
 */
export interface MessageResponse {
  status: string;
  target: string;
  timestamp: string;
}

/**
 * Request payload for POST /sessions/:sessionId/restore endpoint
 * @property startAgents - Whether to start agents after restoration (optional)
 */
export interface RestoreRequest {
  startAgents?: boolean;
}

/**
 * Response from POST /sessions/:sessionId/restore endpoint
 * @property sessionId - UUID of the restored session
 * @property tmuxSession - Tmux session identifier
 * @property attachCommand - Command to attach to the session
 * @property status - Status of restoration
 * @property timestamp - ISO 8601 timestamp
 * @property agentsStarted - Whether agents were started
 */
export interface RestoreResponse {
  sessionId: string;
  tmuxSession: string;
  attachCommand: string;
  status: string;
  timestamp: string;
  agentsStarted: boolean;
}

/**
 * Error response structure
 * @property error - Error message
 * @property code - Error code
 */
export interface ErrorResponse {
  error: string;
  code?: string;
}

// Validation constants
export const AGENT_ID_PATTERN = /^\d{2}$/;
export const MIN_PROMPT_LENGTH = 1;
export const MAX_PROMPT_LENGTH = 5000;
export const MIN_UNITS = 1;
export const MAX_UNITS = 4;
export const MIN_WORKERS = 1;
export const MAX_WORKERS = 5;

/**
 * Validates agent ID format
 */
export function isValidAgentId(id: string): boolean {
  return AGENT_ID_PATTERN.test(id);
}

/**
 * Validates prompt length
 */
export function isValidPromptLength(prompt: string): boolean {
  return prompt.length >= MIN_PROMPT_LENGTH && prompt.length <= MAX_PROMPT_LENGTH;
}

/**
 * Validates unit count
 */
export function isValidUnitCount(count: number): boolean {
  return count >= MIN_UNITS && count <= MAX_UNITS;
}

/**
 * Validates worker count
 */
export function isValidWorkerCount(count: number): boolean {
  return count >= MIN_WORKERS && count <= MAX_WORKERS;
}

/**
 * Type guard for error response
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return response && typeof response.error === 'string';
}

/**
 * Migration type mapping from old to new structure
 */
export interface MigrationMapping {
  oldToNewAgent(old: { id: string; prompt: string; role?: string }): Agent;
  oldToNewUnit(old: { manager: any; workers: any[] }, unitId: number): Unit;
  oldRequestToNew(old: any): RunsRequest;
}