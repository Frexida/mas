import { Hono } from 'hono';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
import { MessageLogService } from '../services/messageLogService.js';
import { FileMessageLogStore } from '../stores/fileMessageLogStore.js';
import type { Channel } from '../types/messageLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAS_ROOT = path.resolve(__dirname, '../../../');

// Initialize message log service
const sessionsPath = path.resolve(MAS_ROOT, 'sessions');
const messageLogStore = new FileMessageLogStore(sessionsPath);
const messageLogService = new MessageLogService(messageLogStore);

const app = new Hono();

// Query schema
const GetLogsQuerySchema = z.object({
  sessionId: z.string().min(1),
  channel: z.enum(['all', 'unit-0', 'unit-1', 'unit-2', 'unit-3']).optional(),
  limit: z.string().transform(Number).optional(),
  before: z.string().optional(),
});

// Helper to resolve session name (UUID -> tmux session name)
function resolveSessionName(sessionId: string): string[] {
  // Return possible session names to check
  const candidates = [sessionId];

  // If it looks like a UUID, also try mas-{shortId} format
  if (sessionId.includes('-') && sessionId.length > 8) {
    const shortId = sessionId.split('-')[0];
    candidates.push(`mas-${shortId}`);
  }

  return candidates;
}

// GET /messages - Get message logs
app.get('/', async (c) => {
  try {
    const query = c.req.query();
    const validated = GetLogsQuerySchema.parse(query);

    // Try different session name formats
    const sessionCandidates = resolveSessionName(validated.sessionId);
    let logs: any[] = [];
    let resolvedSessionId = validated.sessionId;

    for (const candidate of sessionCandidates) {
      logs = await messageLogService.getLogs(candidate, {
        channel: validated.channel as Channel,
        limit: validated.limit,
        before: validated.before,
      });
      if (logs.length > 0) {
        resolvedSessionId = candidate;
        break;
      }
    }

    return c.json({
      logs,
      count: logs.length,
      sessionId: validated.sessionId,
      resolvedSessionId,
      channel: validated.channel || 'all',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors,
      }, 400);
    }

    console.error('Failed to get logs:', error);
    return c.json({
      error: 'Internal server error',
    }, 500);
  }
});

// GET /messages/stats - Get message statistics
app.get('/stats', async (c) => {
  try {
    const sessionId = c.req.query('sessionId');
    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }

    const stats = await messageLogService.getStats(sessionId);

    return c.json({
      sessionId,
      ...stats,
    });
  } catch (error) {
    console.error('Failed to get stats:', error);
    return c.json({
      error: 'Internal server error',
    }, 500);
  }
});

export default app;
