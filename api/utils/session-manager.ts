/**
 * Session management utilities
 */

import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  SessionInfo,
  SessionDetail,
  SessionStatus,
  ConnectionInfo
} from '../types/session';
import {
  listTmuxSessions,
  getTmuxSessionInfo,
  getSessionWindows,
  getAgentsStatus,
  sessionExists
} from './tmux';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAS_ROOT = path.resolve(__dirname, '../../../');

/**
 * Read .mas_session file
 */
export async function readSessionFile(): Promise<any> {
  const sessionFile = path.join(MAS_ROOT, '.mas_session');

  try {
    await access(sessionFile, constants.F_OK);
    const content = await readFile(sessionFile, 'utf-8');
    const lines = content.trim().split('\n');

    const sessionData: any = {};
    for (const line of lines) {
      const [key, value] = line.split('=');
      if (key && value) {
        sessionData[key] = value;
      }
    }

    return sessionData;
  } catch (error) {
    return null;
  }
}

/**
 * Parse tmux session name to extract session ID
 */
export function parseSessionId(tmuxSessionName: string): string {
  // mas-XXXXXXXX format - extract the UUID part
  const parts = tmuxSessionName.replace('mas-', '');

  // If it's just the first 8 characters of a UUID, we need to reconstruct it
  // For now, we'll use the short form as the ID
  return parts;
}

/**
 * Determine session status
 */
export async function getSessionStatus(tmuxSessionName: string): Promise<SessionStatus> {
  const exists = await sessionExists(tmuxSessionName);

  if (!exists) {
    return 'terminated';
  }

  const info = await getTmuxSessionInfo(tmuxSessionName);
  if (info && info.isAttached) {
    return 'active';
  }

  return 'inactive';
}

/**
 * Get all MAS sessions
 */
export async function getAllSessions(): Promise<SessionInfo[]> {
  const tmuxSessions = await listTmuxSessions();
  const sessions: SessionInfo[] = [];

  // Read session metadata
  const sessionFileData = await readSessionFile();

  for (const tmuxSessionName of tmuxSessions) {
    const status = await getSessionStatus(tmuxSessionName);
    const windows = await getSessionWindows(tmuxSessionName);
    const agents = await getAgentsStatus(tmuxSessionName);

    const sessionInfo: SessionInfo = {
      sessionId: parseSessionId(tmuxSessionName),
      tmuxSession: tmuxSessionName,
      status,
      workingDir: sessionFileData?.project_dir || MAS_ROOT,
      startedAt: sessionFileData?.started_at || new Date().toISOString(),
      agentCount: agents.filter(a => a.status === 'running').length,
      httpServerStatus: sessionFileData?.http_server === 'running' ? 'running' : 'stopped'
    };

    sessions.push(sessionInfo);
  }

  return sessions;
}

/**
 * Get detailed session information
 */
export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  // Find the tmux session with this ID
  const tmuxSessions = await listTmuxSessions();
  const tmuxSessionName = tmuxSessions.find(name =>
    name.includes(sessionId) || parseSessionId(name) === sessionId
  );

  if (!tmuxSessionName) {
    return null;
  }

  const status = await getSessionStatus(tmuxSessionName);
  const windows = await getSessionWindows(tmuxSessionName);
  const agents = await getAgentsStatus(tmuxSessionName);
  const sessionFileData = await readSessionFile();

  const sessionDetail: SessionDetail = {
    sessionId: parseSessionId(tmuxSessionName),
    tmuxSession: tmuxSessionName,
    status,
    workingDir: sessionFileData?.project_dir || MAS_ROOT,
    startedAt: sessionFileData?.started_at || new Date().toISOString(),
    agentCount: agents.filter(a => a.status === 'running').length,
    httpServerStatus: sessionFileData?.http_server === 'running' ? 'running' : 'stopped',
    agents,
    windows,
    lastActivity: new Date().toISOString() // Could track actual activity
  };

  // Try to read original config if available
  try {
    const configPath = path.join(MAS_ROOT, `config-${sessionId}.json`);
    await access(configPath, constants.F_OK);
    const configContent = await readFile(configPath, 'utf-8');
    sessionDetail.config = JSON.parse(configContent);
  } catch (error) {
    // Config file not available
  }

  return sessionDetail;
}

/**
 * Connect to an existing session
 */
export async function connectToSession(
  sessionId: string,
  options?: { reconnect?: boolean; window?: string }
): Promise<ConnectionInfo> {
  // Find the tmux session
  const tmuxSessions = await listTmuxSessions();
  const tmuxSessionName = tmuxSessions.find(name =>
    name.includes(sessionId) || parseSessionId(name) === sessionId
  );

  if (!tmuxSessionName) {
    throw new Error('Session not found');
  }

  const exists = await sessionExists(tmuxSessionName);
  if (!exists) {
    throw new Error('Session no longer exists');
  }

  const windows = await getSessionWindows(tmuxSessionName);
  const agents = await getAgentsStatus(tmuxSessionName);

  // Build attach command
  let attachCommand = `tmux attach-session -t ${tmuxSessionName}`;
  if (options?.window) {
    attachCommand += `:${options.window}`;
  }

  const connectionInfo: ConnectionInfo = {
    sessionId,
    tmuxSession: tmuxSessionName,
    attachCommand,
    status: 'connected',
    timestamp: new Date().toISOString(),
    connectionDetails: {
      windows: windows.length,
      activeAgents: agents.filter(a => a.status === 'running').length,
      focusedWindow: options?.window
    }
  };

  return connectionInfo;
}

/**
 * Stop a MAS session
 */
export async function stopSession(sessionId: string, force: boolean = false): Promise<void> {
  // Find the tmux session
  const tmuxSessions = await listTmuxSessions();
  const tmuxSessionName = tmuxSessions.find(name =>
    name.includes(sessionId) || parseSessionId(name) === sessionId
  );

  if (!tmuxSessionName) {
    throw new Error('Session not found');
  }

  // Use the killSession function from tmux utils
  const { killSession } = await import('./tmux.js');
  await killSession(tmuxSessionName, force);
}