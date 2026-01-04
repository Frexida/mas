import { Hono } from 'hono';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { MessageLogService } from '../services/messageLogService.js';
import { FileMessageLogStore } from '../stores/fileMessageLogStore.js';
import { StaleMonitorService } from '../services/staleMonitorService.js';
import type { MessageSender } from '../types/messageLog.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAS_ROOT = path.resolve(__dirname, '../../../');

// Initialize services
const sessionsPath = path.resolve(MAS_ROOT, 'sessions');
const messageLogStore = new FileMessageLogStore(sessionsPath);
const messageLogService = new MessageLogService(messageLogStore);

// Message sender implementation
const messageSender: MessageSender = {
  async send(target: string, message: string, sessionId: string, execute: boolean = true): Promise<void> {
    const escapedTarget = target.replace(/['"\\]/g, '\\$&');
    const escapedMessage = message
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`')
      .replace(/\n/g, '\\n');

    let command = `${MAS_ROOT}/mas send "${escapedTarget}" "$(echo -e "${escapedMessage}")"`;
    if (execute) {
      command += ' -e';
    }

    await execAsync(command, {
      cwd: MAS_ROOT,
      timeout: 10000,
      env: { ...process.env, MAS_SESSION_NAME: sessionId },
    });
  },
};

const staleMonitorService = new StaleMonitorService(messageLogService, messageSender);

const app = new Hono();

// POST /monitor/start - Start monitoring
app.post('/start', async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ error: 'sessionId is required' }, 400);
  }

  if (staleMonitorService.isMonitoring(sessionId)) {
    return c.json({
      status: 'already_running',
      sessionId,
      message: 'Monitor is already running for this session',
    });
  }

  staleMonitorService.start(sessionId);

  return c.json({
    status: 'started',
    sessionId,
    message: 'Stale message monitor started',
  });
});

// POST /monitor/stop - Stop monitoring
app.post('/stop', async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ error: 'sessionId is required' }, 400);
  }

  if (!staleMonitorService.isMonitoring(sessionId)) {
    return c.json({
      status: 'not_running',
      sessionId,
      message: 'Monitor is not running for this session',
    });
  }

  staleMonitorService.stop(sessionId);

  return c.json({
    status: 'stopped',
    sessionId,
    message: 'Stale message monitor stopped',
  });
});

// GET /monitor/status - Get monitoring status
app.get('/status', async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ error: 'sessionId is required' }, 400);
  }

  const status = staleMonitorService.getStatus(sessionId);

  return c.json({
    sessionId,
    ...status,
  });
});

// POST /monitor/check - Manually trigger a check
app.post('/check', async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ error: 'sessionId is required' }, 400);
  }

  try {
    await staleMonitorService.checkAndRemind(sessionId);
    return c.json({
      status: 'checked',
      sessionId,
      message: 'Stale check completed',
    });
  } catch (error) {
    console.error('Failed to check stale messages:', error);
    return c.json({
      error: 'Check failed',
      message: String(error),
    }, 500);
  }
});

export default app;
