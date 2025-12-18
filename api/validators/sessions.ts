/**
 * Session management validation schemas using Zod
 */

import { z } from 'zod';

// Session status enum
export const SessionStatusSchema = z.enum(['active', 'inactive', 'terminated']);

// Session info schema
export const SessionInfoSchema = z.object({
  sessionId: z.string().min(1), // Flexible session ID format
  tmuxSession: z.string().regex(/^mas-/), // Must start with "mas-"
  status: SessionStatusSchema,
  workingDir: z.string(),
  startedAt: z.string().datetime(),
  agentCount: z.number().int().min(0),
  httpServerStatus: z.enum(['running', 'stopped'])
});

// Agent status schema
export const AgentStatusSchema = z.object({
  agentId: z.string().regex(/^[0-9]{2}$/),
  name: z.string(),
  status: z.enum(['running', 'stopped', 'error']),
  window: z.string(),
  pane: z.number().int().min(0)
});

// Window info schema
export const WindowInfoSchema = z.object({
  name: z.string(),
  index: z.number().int().min(0),
  paneCount: z.number().int().min(0),
  active: z.boolean()
});

// Session detail schema
export const SessionDetailSchema = SessionInfoSchema.extend({
  lastActivity: z.string().datetime().optional(),
  agents: z.array(AgentStatusSchema),
  windows: z.array(WindowInfoSchema),
  config: z.any().optional()
});

// Connection info schema
export const ConnectionInfoSchema = z.object({
  sessionId: z.string().min(1), // Flexible session ID format
  tmuxSession: z.string(),
  attachCommand: z.string(),
  status: z.enum(['connected', 'failed']),
  timestamp: z.string().datetime(),
  connectionDetails: z.object({
    windows: z.number().int().min(0),
    activeAgents: z.number().int().min(0),
    focusedWindow: z.string().optional()
  }).optional()
});

// Request/Response schemas
export const SessionListQuerySchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).default('all').optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional()
});

export const SessionListResponseSchema = z.object({
  sessions: z.array(SessionInfoSchema),
  total: z.number().int().min(0),
  timestamp: z.string().datetime()
});

export const ConnectRequestSchema = z.object({
  reconnect: z.boolean().default(false).optional(),
  window: z.enum(['meta', 'design', 'development', 'business']).optional()
});

export const StopRequestSchema = z.object({
  force: z.boolean().default(false).optional()
});

export const SessionIdParamSchema = z.object({
  sessionId: z.string().min(1) // Flexible session ID format
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  timestamp: z.string().datetime()
});

// Export types
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export type SessionInfo = z.infer<typeof SessionInfoSchema>;
export type SessionDetail = z.infer<typeof SessionDetailSchema>;
export type AgentStatus = z.infer<typeof AgentStatusSchema>;
export type WindowInfo = z.infer<typeof WindowInfoSchema>;
export type ConnectionInfo = z.infer<typeof ConnectionInfoSchema>;
export type SessionListQuery = z.infer<typeof SessionListQuerySchema>;
export type SessionListResponse = z.infer<typeof SessionListResponseSchema>;
export type ConnectRequest = z.infer<typeof ConnectRequestSchema>;
export type StopRequest = z.infer<typeof StopRequestSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;