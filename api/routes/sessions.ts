/**
 * Session management routes
 */

import { Hono } from 'hono';
import {
  getAllSessions,
  getSessionDetail,
  connectToSession,
  stopSession,
  restoreSession
} from '../utils/session-manager.js';
import {
  SessionListQuerySchema,
  SessionIdParamSchema,
  ConnectRequestSchema,
  StopRequestSchema,
  SessionListResponseSchema,
  RestoreRequestSchema
} from '../validators/sessions.js';
import type {
  SessionListResponse,
  ErrorResponse
} from '../types/session.js';

const app = new Hono();

/**
 * GET /sessions - List all MAS sessions
 */
app.get('/', async (c) => {
  try {
    // Parse and validate query parameters
    const query = c.req.query();
    const validatedQuery = SessionListQuerySchema.parse({
      status: query.status || 'all',
      limit: query.limit ? parseInt(query.limit) : 50,
      offset: query.offset ? parseInt(query.offset) : 0
    });

    // Get all sessions
    const allSessions = await getAllSessions();

    // Filter by status if needed
    let filteredSessions = allSessions;
    if (validatedQuery.status && validatedQuery.status !== 'all') {
      filteredSessions = allSessions.filter(s => s.status === validatedQuery.status);
    }

    // Apply pagination
    const start = validatedQuery.offset || 0;
    const limit = validatedQuery.limit || 50;
    const paginatedSessions = filteredSessions.slice(start, start + limit);

    // Build response
    const response: SessionListResponse = {
      sessions: paginatedSessions,
      total: filteredSessions.length,
      timestamp: new Date().toISOString()
    };

    return c.json(response, 200);
  } catch (error) {
    console.error('Failed to list sessions:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to list sessions',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return c.json(errorResponse, 500);
  }
});

/**
 * GET /sessions/:sessionId - Get session details
 */
app.get('/:sessionId', async (c) => {
  try {
    // Validate session ID
    const { sessionId } = SessionIdParamSchema.parse({
      sessionId: c.req.param('sessionId')
    });

    // Get session details
    const sessionDetail = await getSessionDetail(sessionId);

    if (!sessionDetail) {
      const errorResponse: ErrorResponse = {
        error: 'Session not found',
        details: { sessionId },
        timestamp: new Date().toISOString()
      };
      return c.json(errorResponse, 404);
    }

    return c.json(sessionDetail, 200);
  } catch (error) {
    console.error('Failed to get session details:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to get session details',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return c.json(errorResponse, 500);
  }
});

/**
 * POST /sessions/:sessionId/connect - Connect to an existing session
 */
app.post('/:sessionId/connect', async (c) => {
  try {
    // Validate session ID
    const { sessionId } = SessionIdParamSchema.parse({
      sessionId: c.req.param('sessionId')
    });

    // Parse and validate request body
    const body = await c.req.json().catch(() => ({}));
    const validatedRequest = ConnectRequestSchema.parse(body);

    // Connect to session
    const connectionInfo = await connectToSession(sessionId, {
      reconnect: validatedRequest.reconnect,
      window: validatedRequest.window
    });

    return c.json(connectionInfo, 200);
  } catch (error: any) {
    console.error('Failed to connect to session:', error);

    if (error.message === 'Session not found') {
      const errorResponse: ErrorResponse = {
        error: 'Session not found',
        details: { sessionId: c.req.param('sessionId') },
        timestamp: new Date().toISOString()
      };
      return c.json(errorResponse, 404);
    }

    const errorResponse: ErrorResponse = {
      error: 'Failed to connect to session',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return c.json(errorResponse, 500);
  }
});

/**
 * POST /sessions/:sessionId/restore - Restore a terminated MAS session
 */
app.post('/:sessionId/restore', async (c) => {
  try {
    // Validate session ID
    const { sessionId } = SessionIdParamSchema.parse({
      sessionId: c.req.param('sessionId')
    });

    // Parse and validate request body
    const body = await c.req.json().catch(() => ({}));
    const validatedRequest = RestoreRequestSchema.parse(body);

    // Restore the session
    const connectionInfo = await restoreSession(sessionId, {
      startAgents: validatedRequest.startAgents
    });

    return c.json({
      sessionId: connectionInfo.sessionId,
      tmuxSession: connectionInfo.tmuxSession,
      attachCommand: connectionInfo.attachCommand,
      status: 'restored',
      timestamp: new Date().toISOString(),
      agentsStarted: validatedRequest.startAgents || false
    }, 200);
  } catch (error: any) {
    console.error('Failed to restore session:', error);

    if (error.message === 'Session not found') {
      const errorResponse: ErrorResponse = {
        error: 'Session not found',
        details: { sessionId: c.req.param('sessionId') },
        timestamp: new Date().toISOString()
      };
      return c.json(errorResponse, 404);
    }

    if (error.message.includes('not terminated')) {
      const errorResponse: ErrorResponse = {
        error: 'Session is not terminated',
        details: error.message,
        timestamp: new Date().toISOString()
      };
      return c.json(errorResponse, 400);
    }

    if (error.message.includes('already in progress')) {
      const errorResponse: ErrorResponse = {
        error: 'Restoration already in progress',
        details: error.message,
        timestamp: new Date().toISOString()
      };
      return c.json(errorResponse, 409);
    }

    const errorResponse: ErrorResponse = {
      error: 'Failed to restore session',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return c.json(errorResponse, 500);
  }
});

/**
 * POST /sessions/:sessionId/stop - Stop a MAS session
 */
app.post('/:sessionId/stop', async (c) => {
  try {
    // Validate session ID
    const { sessionId } = SessionIdParamSchema.parse({
      sessionId: c.req.param('sessionId')
    });

    // Parse and validate request body
    const body = await c.req.json().catch(() => ({}));
    const validatedRequest = StopRequestSchema.parse(body);

    // Stop the session
    await stopSession(sessionId, validatedRequest.force);

    return c.json({
      sessionId,
      status: 'stopped',
      timestamp: new Date().toISOString()
    }, 200);
  } catch (error: any) {
    console.error('Failed to stop session:', error);

    if (error.message === 'Session not found') {
      const errorResponse: ErrorResponse = {
        error: 'Session not found',
        details: { sessionId: c.req.param('sessionId') },
        timestamp: new Date().toISOString()
      };
      return c.json(errorResponse, 404);
    }

    const errorResponse: ErrorResponse = {
      error: 'Failed to stop session',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return c.json(errorResponse, 500);
  }
});

/**
 * GET /sessions/:sessionId/agents - Get agents status for a session
 */
app.get('/:sessionId/agents', async (c) => {
  try {
    // Validate session ID
    const { sessionId } = SessionIdParamSchema.parse({
      sessionId: c.req.param('sessionId')
    });

    // Get session details to extract agents
    const sessionDetail = await getSessionDetail(sessionId);

    if (!sessionDetail) {
      const errorResponse: ErrorResponse = {
        error: 'Session not found',
        details: { sessionId },
        timestamp: new Date().toISOString()
      };
      return c.json(errorResponse, 404);
    }

    return c.json({
      sessionId,
      agents: sessionDetail.agents,
      timestamp: new Date().toISOString()
    }, 200);
  } catch (error) {
    console.error('Failed to get agents status:', error);

    const errorResponse: ErrorResponse = {
      error: 'Failed to get agents status',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };

    return c.json(errorResponse, 500);
  }
});

export default app;