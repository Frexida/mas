/**
 * Session management utilities
 */

import { readFile, access, readdir, stat, writeFile, rename, unlink } from 'fs/promises';
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

// 新構造: ワークスペースルートを環境変数から取得、またはプロジェクトルートを使用
const MAS_WORKSPACE_ROOT = process.env.MAS_WORKSPACE_ROOT ||
                          process.env.MAS_PROJECT_ROOT ||
                          path.resolve(__dirname, '../..');
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
 * Read sessions index file with retry logic
 */
export async function readSessionsIndex(): Promise<any> {
  const indexFile = path.join(MAS_ROOT, 'sessions', '.sessions.index');

  // Retry logic for race conditions
  let retries = 3;
  let lastError: any;

  while (retries > 0) {
    try {
      await access(indexFile, constants.F_OK);
      const content = await readFile(indexFile, 'utf-8');

      // Validate content is not empty
      if (!content || content.trim().length === 0) {
        throw new Error('Sessions index file is empty');
      }

      const parsed = JSON.parse(content);

      // Validate structure
      if (!parsed.version || !Array.isArray(parsed.sessions)) {
        throw new Error('Invalid sessions index structure');
      }

      return parsed;
    } catch (error: any) {
      lastError = error;
      retries--;

      if (retries > 0) {
        // Wait a bit before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (3 - retries) * 100));
      }
    }
  }

  // If all retries failed, log the error and return default
  console.error('Failed to read sessions index after retries:', lastError);
  return { version: '1.0', sessions: [], lastUpdated: '' };
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
 * Discover all session directories from filesystem
 */
async function discoverAllSessionDirectories(): Promise<string[]> {
  const sessionsDir = path.join(MAS_ROOT, 'sessions');
  const directories: string[] = [];

  try {
    const entries = await readdir(sessionsDir, { withFileTypes: true });

    for (const entry of entries) {
      // Check if it's a directory and looks like a UUID
      if (entry.isDirectory() && isValidUUID(entry.name)) {
        // Verify it has a .session file
        const sessionFile = path.join(sessionsDir, entry.name, '.session');
        try {
          await access(sessionFile, constants.F_OK);
          directories.push(entry.name);
        } catch {
          // No .session file, skip
        }
      }
    }
  } catch (error) {
    console.error('Failed to scan session directories:', error);
  }

  return directories;
}

/**
 * Get all MAS sessions (all are isolated now)
 */
export async function getAllSessions(): Promise<SessionInfo[]> {
  const sessions: SessionInfo[] = [];
  const processedSessionIds = new Set<string>();

  // Read sessions from sessions index
  const sessionsIndex = await readSessionsIndex();

  // Process indexed sessions first
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
        httpServerStatus: 'stopped', // TODO: implement HTTP server status check
        restorable: status === 'terminated'
      };

      sessions.push(sessionInfo);
      processedSessionIds.add(indexEntry.sessionId);
    }
  }

  // Discover and add any sessions not in the index
  const allDirectories = await discoverAllSessionDirectories();

  for (const sessionId of allDirectories) {
    if (!processedSessionIds.has(sessionId)) {
      // This session exists on filesystem but not in index
      const metadata = await readIsolatedSessionMetadata(sessionId);

      if (metadata) {
        const tmuxSessionName = metadata.TMUX_SESSION || `mas-${sessionId.substring(0, 8)}`;

        // For unindexed sessions, check tmux status but don't fail if tmux doesn't exist
        let status: SessionStatus = 'terminated';
        let agents: any[] = [];

        try {
          status = await getSessionStatus(tmuxSessionName);
          agents = await getAgentsStatus(tmuxSessionName);
        } catch {
          // If tmux operations fail, assume terminated
          status = 'terminated';
        }

        const sessionInfo: SessionInfo = {
          sessionId: sessionId,
          tmuxSession: tmuxSessionName,
          status,
          workingDir: metadata.SESSION_DIR || path.join(MAS_ROOT, 'sessions', sessionId),
          startedAt: metadata.CREATED_AT || 'Unknown',
          agentCount: agents.filter(a => a.status === 'running').length,
          httpServerStatus: 'stopped',
          restorable: status === 'terminated'
        };

        sessions.push(sessionInfo);
      }
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
 * Restore a terminated MAS session
 */
export async function restoreSession(
  sessionId: string,
  options: { startAgents?: boolean; force?: boolean } = {}
): Promise<ConnectionInfo> {
  const { startAgents = false, force = false } = options;

  // Resolve full session ID if shortened
  const sessionsIndex = await readSessionsIndex();
  let fullSessionId = sessionId;

  // Debug logging
  console.log('[DEBUG] MAS_WORKSPACE_ROOT:', MAS_WORKSPACE_ROOT);
  console.log('[DEBUG] Sessions index path:', path.join(MAS_ROOT, 'sessions', '.sessions.index'));
  console.log('[DEBUG] Sessions index content:', JSON.stringify(sessionsIndex, null, 2));
  console.log('[DEBUG] Looking for sessionId:', sessionId);

  if (sessionsIndex?.sessions) {
    const matchedSession = sessionsIndex.sessions.find((s: any) =>
      s.sessionId === sessionId || s.sessionId.startsWith(sessionId)
    );

    if (!matchedSession) {
      throw new Error('Session not found');
    }

    fullSessionId = matchedSession.sessionId;
    const tmuxSessionName = matchedSession.tmuxSession || `mas-${fullSessionId.substring(0, 8)}`;

    // Check if restoration is already in progress
    if (matchedSession.status === 'restoring') {
      throw new Error('Session restoration is already in progress');
    }

    // Smart validation: Check actual tmux session existence
    const tmuxExists = await sessionExists(tmuxSessionName);

    // If force flag is set, allow restoration regardless of status
    if (!force) {
      // Allow restoration in these cases:
      // 1. Status is 'terminated'
      // 2. Status is 'inactive' AND tmux doesn't exist
      // 3. Status is 'active' AND tmux doesn't exist (will update to terminated)

      if (matchedSession.status === 'terminated') {
        // Normal case: session is properly terminated
      } else if (!tmuxExists) {
        // Session lost its tmux process but status wasn't updated
        console.log(`Session ${fullSessionId} has status '${matchedSession.status}' but tmux session doesn't exist. Updating to 'terminated'.`);
        await updateSessionsIndex('update', fullSessionId, 'status', 'terminated');
        matchedSession.status = 'terminated';
      } else {
        // Tmux session exists and status is not terminated
        throw new Error(
          `Cannot restore session: tmux session still exists with status '${matchedSession.status}'. ` +
          `Use force option to override or stop the session first.`
        );
      }
    } else if (tmuxExists) {
      // Force restoration: terminate existing tmux session
      console.log(`Force restoring session ${fullSessionId}. Terminating existing tmux session.`);
      try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        await execAsync(`tmux kill-session -t "${tmuxSessionName}"`, { timeout: 5000 });
      } catch (error) {
        console.error('Failed to kill existing tmux session:', error);
      }
    }
  } else {
    throw new Error('Session index not found');
  }

  // Mark session as restoring to prevent concurrent attempts
  await updateSessionsIndex('update', fullSessionId, 'status', 'restoring');

  try {
    // Import and execute restoration
    const { executeRestore } = await import('./restore-wrapper.js');
    const result = await executeRestore({
      sessionId: fullSessionId,
      startAgents,
      workspaceRoot: MAS_WORKSPACE_ROOT
    });

    if (!result.success) {
      // Rollback status on failure
      await updateSessionsIndex('update', fullSessionId, 'status', 'terminated');
      throw new Error(result.error || 'Restoration failed');
    }

    // Update session status to inactive (not attached yet)
    await updateSessionsIndex('update', fullSessionId, 'status', 'inactive');

    // Return connection info
    return {
      sessionId: fullSessionId,
      tmuxSession: result.tmuxSession || `mas-${fullSessionId.substring(0, 8)}`,
      attachCommand: `tmux attach-session -t ${result.tmuxSession || `mas-${fullSessionId.substring(0, 8)}`}`,
      status: 'connected',
      timestamp: new Date().toISOString(),
      connectionDetails: {
        windows: 6,
        activeAgents: startAgents ? 14 : 0
      }
    };
  } catch (error: any) {
    // Ensure status is rolled back on any error
    await updateSessionsIndex('update', fullSessionId, 'status', 'terminated').catch(() => {});
    throw error;
  }
}

/**
 * Helper function to update sessions index with locking
 */
async function updateSessionsIndex(
  action: 'update',
  sessionId: string,
  field: string,
  value: any
): Promise<void> {
  const indexPath = path.join(MAS_WORKSPACE_ROOT, 'sessions', '.sessions.index');
  const lockPath = `${indexPath}.lock`;
  const tempPath = `${indexPath}.tmp.${Date.now()}`;

  // Simple file-based lock with timeout
  const acquireLock = async (maxRetries = 50): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Try to create lock file exclusively
        await writeFile(lockPath, process.pid.toString(), { flag: 'wx' });
        return true;
      } catch (error: any) {
        if (error.code === 'EEXIST') {
          // Lock exists, wait and retry
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          throw error;
        }
      }
    }
    return false;
  };

  const releaseLock = async () => {
    try {
      await unlink(lockPath);
    } catch (error) {
      // Ignore errors when releasing lock
    }
  };

  let lockAcquired = false;

  try {
    // Acquire lock
    lockAcquired = await acquireLock();
    if (!lockAcquired) {
      throw new Error('Failed to acquire lock for sessions index update');
    }

    // Read current content with validation
    const indexContent = await readFile(indexPath, 'utf-8');

    // Validate content is not empty
    if (!indexContent || indexContent.trim().length === 0) {
      throw new Error('Sessions index file is empty during update');
    }

    const index = JSON.parse(indexContent);

    if (index.sessions) {
      const session = index.sessions.find((s: any) => s.sessionId === sessionId);
      if (session) {
        session[field] = value;
        index.lastUpdated = new Date().toISOString();

        // Atomic write with unique temp file
        await writeFile(tempPath, JSON.stringify(index, null, 2));
        await rename(tempPath, indexPath);
      }
    }
  } catch (error) {
    console.error('Failed to update sessions index:', error);
    // Clean up temp file if it exists
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  } finally {
    if (lockAcquired) {
      await releaseLock();
    }
  }
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
      await writeFile(metadataFile, updated);

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
 * Update sessions index (helper function) - Legacy version
 */
async function updateSessionsIndexLegacy(action: string, sessionId: string, field?: string, value?: string): Promise<void> {
  const indexFile = path.join(MAS_ROOT, 'sessions', '.sessions.index');
  const index = await readSessionsIndex();

  if (action === 'update' && field && value) {
    const session = index.sessions.find((s: any) => s.sessionId === sessionId);
    if (session) {
      session[field] = value;
    }
  }

  index.lastUpdated = new Date().toISOString();
  await writeFile(indexFile, JSON.stringify(index, null, 2));
}