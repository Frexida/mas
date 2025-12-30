/**
 * TypeScript wrapper for shell-based session restoration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RestoreOptions {
  sessionId: string;
  startAgents?: boolean;
  workspaceRoot?: string;
}

export interface RestoreResult {
  success: boolean;
  tmuxSession?: string;
  error?: string;
  details?: any;
}

/**
 * Execute the shell restoration script
 */
export async function executeRestore(options: RestoreOptions): Promise<RestoreResult> {
  const {
    sessionId,
    startAgents = false,
    workspaceRoot = process.env.MAS_WORKSPACE_ROOT || process.cwd()
  } = options;

  try {
    // Construct the shell command
    const MAS_ROOT = process.env.MAS_ROOT || path.resolve(__dirname, '../..');
    const scriptPath = path.join(MAS_ROOT, 'lib', 'session-restore.sh');
    const command = [
      `bash -c "`,
      `source ${scriptPath};`,
      `export MAS_WORKSPACE_ROOT='${workspaceRoot}';`,
      `restore_session '${sessionId}' '${startAgents ? 'true' : 'false'}'"`,
    ].join(' ');

    // Execute the restoration
    const { stdout, stderr } = await execAsync(command, {
      env: {
        ...process.env,
        MAS_WORKSPACE_ROOT: workspaceRoot,
        TMUX_SOCKET: process.env.TMUX_SOCKET || `/tmp/tmux-${process.getuid()}/default`
      },
      timeout: 10000 // 10 second timeout
    });

    // Parse the output for success/failure
    // Check if session already exists (this is informational, not an error)
    // Check both stdout and stderr as the message might appear in either
    const combinedOutput = stdout + stderr;
    if (combinedOutput.includes('Session already exists')) {
      // This is exit code 2 from the bash script - session exists but isn't an error
      return {
        success: false,
        error: 'Session already exists and is running',
        details: {
          code: 'SESSION_EXISTS',
          message: 'The tmux session is already running. Please stop it first or connect to the existing session.'
        }
      };
    }

    if (stderr && stderr.includes('[ERROR]')) {
      return {
        success: false,
        error: stderr.replace(/\[.*?\]/g, '').trim()
      };
    }

    // Extract tmux session name from output
    const sessionMatch = stdout.match(/mas-[a-f0-9]{8}/);
    const tmuxSession = sessionMatch ? sessionMatch[0] : `mas-${sessionId.substring(0, 8)}`;

    return {
      success: true,
      tmuxSession,
      details: {
        stdout: stdout.trim(),
        agentsStarted: startAgents
      }
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error during restoration',
      details: {
        code: error.code,
        signal: error.signal
      }
    };
  }
}

/**
 * Check if a session can be restored
 */
export async function isSessionRestorable(sessionId: string, workspaceRoot?: string): Promise<boolean> {
  const workspace = workspaceRoot || process.env.MAS_WORKSPACE_ROOT || process.cwd();
  const metadataPath = path.join(workspace, 'sessions', sessionId, '.session');

  try {
    const { stdout } = await execAsync(`test -f "${metadataPath}" && echo "exists"`, {
      timeout: 1000
    });
    return stdout.trim() === 'exists';
  } catch {
    return false;
  }
}

/**
 * Update session status in the index
 */
export async function updateSessionStatus(
  sessionId: string,
  status: string,
  workspaceRoot?: string
): Promise<void> {
  const workspace = workspaceRoot || process.env.MAS_WORKSPACE_ROOT || process.cwd();
  const MAS_ROOT = process.env.MAS_ROOT || path.resolve(__dirname, '../..');
  const scriptPath = path.join(MAS_ROOT, 'lib', 'session-restore.sh');

  const command = [
    `bash -c "`,
    `source ${scriptPath};`,
    `export MAS_WORKSPACE_ROOT='${workspace}';`,
    `update_session_status '${sessionId}' '${status}'"`,
  ].join(' ');

  await execAsync(command, {
    env: {
      ...process.env,
      MAS_WORKSPACE_ROOT: workspace
    },
    timeout: 5000
  });
}