/**
 * Session management utilities
 */

import { readFile, access, readdir, stat } from 'fs/promises';
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

// 新構造: ワークスペースルートを環境変数から取得、またはカレントディレクトリを使用
const MAS_WORKSPACE_ROOT = process.env.MAS_WORKSPACE_ROOT ||
                          process.env.MAS_PROJECT_ROOT ||
                          process.cwd();
// 後方互換性のためMAS_ROOTを維持
const MAS_ROOT = MAS_WORKSPACE_ROOT;

// Legacy function removed - no longer reading .mas_session files

/**
 * Read isolated session metadata
 */
export async function readIsolatedSessionMetadata(sessionId: string): Promise<any> {
  const metadataFile = path.join(MAS_ROOT, 'sessions', sessionId, '.session');

  try {
    await access(metadataFile, constants.F_OK);
    const content = await readFile(metadataFile, 'utf-8');
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
 * Read sessions index file
 */
export async function readSessionsIndex(): Promise<any> {
  const indexFile = path.join(MAS_ROOT, 'sessions', '.sessions.index');

  try {
    await access(indexFile, constants.F_OK);
    const content = await readFile(indexFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return { version: '1.0', sessions: [], lastUpdated: '' };
  }
}

/**
 * Check if a UUID is valid
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
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
 * Get all MAS sessions (all are isolated now)
 */
export async function getAllSessions(): Promise<SessionInfo[]> {
  const sessions: SessionInfo[] = [];

  // Read sessions from sessions index
  const sessionsIndex = await readSessionsIndex();

  for (const indexEntry of sessionsIndex.sessions || []) {
    // Read session metadata
    const metadata = await readIsolatedSessionMetadata(indexEntry.sessionId);

    if (metadata) {
      const tmuxSessionName = metadata.TMUX_SESSION || indexEntry.tmuxSession;
      const status = await getSessionStatus(tmuxSessionName);
      const agents = await getAgentsStatus(tmuxSessionName);

      const sessionInfo: SessionInfo = {
        sessionId: indexEntry.sessionId,
        tmuxSession: tmuxSessionName,
        status,
        workingDir: metadata.SESSION_DIR || indexEntry.workingDir,
        startedAt: metadata.CREATED_AT || indexEntry.createdAt,
        agentCount: agents.filter(a => a.status === 'running').length,
        httpServerStatus: 'stopped' // TODO: implement HTTP server status check
      };

      sessions.push(sessionInfo);
    }
  }

  return sessions;
}

/**
 * Get detailed session information
 */
export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  // All sessions are isolated now, check by UUID
  if (!isValidUUID(sessionId)) {
    return null;
  }

  const metadata = await readIsolatedSessionMetadata(sessionId);
  if (!metadata) {
    return null;
  }

  const tmuxSessionName = metadata.TMUX_SESSION;
  const status = await getSessionStatus(tmuxSessionName);
  const windows = await getSessionWindows(tmuxSessionName);
  const agents = await getAgentsStatus(tmuxSessionName);

  return {
    sessionId: sessionId,
    tmuxSession: tmuxSessionName,
    status,
    workingDir: metadata.SESSION_DIR,
    unitDir: metadata.UNIT_DIR,
    workflowsDir: metadata.WORKFLOWS_DIR,
    startedAt: metadata.CREATED_AT,
    agentCount: agents.filter(a => a.status === 'running').length,
    httpServerStatus: 'stopped', // TODO: check HTTP server
    agents,
    windows,
    lastActivity: new Date().toISOString() // Could track actual activity
  };
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

  console.log('Looking for session:', sessionId);
  console.log('Available tmux sessions:', tmuxSessions);

  // Match by either full UUID or first 8 characters
  const sessionIdShort = sessionId.substring(0, 8);
  const tmuxSessionName = tmuxSessions.find(name => {
    // Check if it matches the pattern mas-XXXXXXXX
    if (name.startsWith('mas-')) {
      const nameId = name.substring(4); // Remove 'mas-' prefix
      console.log(`Comparing: nameId="${nameId}" with sessionId="${sessionId}" and sessionIdShort="${sessionIdShort}"`);
      // Match either full UUID or short form
      return nameId === sessionId || nameId === sessionIdShort ||
             sessionId.startsWith(nameId) || nameId.startsWith(sessionIdShort);
    }
    return false;
  });

  if (!tmuxSessionName) {
    console.error('Session not found in tmux sessions');
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
  // Check if it's an isolated session first
  if (isValidUUID(sessionId)) {
    const metadata = await readIsolatedSessionMetadata(sessionId);
    if (metadata) {
      // Update session status in metadata
      const metadataFile = path.join(MAS_ROOT, 'sessions', sessionId, '.session');
      const updatedMetadata = await readFile(metadataFile, 'utf-8');
      const updated = updatedMetadata.replace(/STATUS=.*/, 'STATUS=stopped');
      await require('fs/promises').writeFile(metadataFile, updated);

      // Update sessions index
      await updateSessionsIndex('update', sessionId, 'status', 'stopped');

      // Kill the tmux session
      const tmuxSessionName = metadata.TMUX_SESSION;
      if (tmuxSessionName) {
        const { killSession } = await import('./tmux.js');
        await killSession(tmuxSessionName, force);
      }
      return;
    }
  }

  // Fall back to legacy session handling
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

/**
 * Update sessions index (helper function)
 */
async function updateSessionsIndex(action: string, sessionId: string, field?: string, value?: string): Promise<void> {
  const indexFile = path.join(MAS_ROOT, 'sessions', '.sessions.index');
  const index = await readSessionsIndex();

  if (action === 'update' && field && value) {
    const session = index.sessions.find((s: any) => s.sessionId === sessionId);
    if (session) {
      session[field] = value;
    }
  }

  index.lastUpdated = new Date().toISOString();
  await require('fs/promises').writeFile(indexFile, JSON.stringify(index, null, 2));
}