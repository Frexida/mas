/**
 * Tmux command wrapper utilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { SessionInfo, AgentStatus, WindowInfo } from '../types/session';

const execAsync = promisify(exec);

/**
 * List all tmux sessions matching MAS pattern
 */
export async function listTmuxSessions(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('tmux list-sessions -F "#{session_name}"', {
      timeout: 5000
    });

    return stdout
      .split('\n')
      .filter(line => line.trim() !== '')
      .filter(line => line.startsWith('mas-'));
  } catch (error: any) {
    // If tmux server is not running, return empty array
    if (error.message.includes('no server running')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get detailed information about a specific tmux session
 */
export async function getTmuxSessionInfo(sessionName: string): Promise<any> {
  try {
    const { stdout } = await execAsync(
      `tmux list-sessions -F "#{session_name}:#{session_windows}:#{session_attached}" | grep "^${sessionName}:"`,
      { timeout: 5000 }
    );

    const parts = stdout.trim().split(':');
    return {
      name: parts[0],
      windowCount: parseInt(parts[1] || '0'),
      isAttached: parts[2] === '1'
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get windows information for a session
 */
export async function getSessionWindows(sessionName: string): Promise<WindowInfo[]> {
  try {
    const { stdout } = await execAsync(
      `tmux list-windows -t "${sessionName}" -F "#{window_index}:#{window_name}:#{window_panes}:#{window_active}"`,
      { timeout: 5000 }
    );

    return stdout
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const parts = line.split(':');
        return {
          index: parseInt(parts[0] || '0'),
          name: parts[1] || '',
          paneCount: parseInt(parts[2] || '0'),
          active: parts[3] === '1'
        };
      });
  } catch (error) {
    return [];
  }
}

/**
 * Get panes information for a window
 */
export async function getWindowPanes(sessionName: string, windowIndex: number): Promise<any[]> {
  try {
    const { stdout } = await execAsync(
      `tmux list-panes -t "${sessionName}:${windowIndex}" -F "#{pane_index}:#{pane_pid}:#{pane_current_command}"`,
      { timeout: 5000 }
    );

    return stdout
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const parts = line.split(':');
        return {
          index: parseInt(parts[0] || '0'),
          pid: parseInt(parts[1] || '0'),
          command: parts[2] || ''
        };
      });
  } catch (error) {
    return [];
  }
}

/**
 * Check if a session exists
 */
export async function sessionExists(sessionName: string): Promise<boolean> {
  try {
    await execAsync(`tmux has-session -t "${sessionName}"`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Kill a tmux session
 */
export async function killSession(sessionName: string, force: boolean = false): Promise<void> {
  const command = force
    ? `tmux kill-session -t "${sessionName}"`
    : `tmux kill-session -t "${sessionName}"`;

  try {
    await execAsync(command, { timeout: 5000 });
  } catch (error: any) {
    if (!error.message.includes('session not found')) {
      throw error;
    }
  }
}

/**
 * Send keys to a specific pane
 */
export async function sendToPane(
  sessionName: string,
  windowIndex: number,
  paneIndex: number,
  text: string,
  execute: boolean = false
): Promise<void> {
  const target = `${sessionName}:${windowIndex}.${paneIndex}`;
  let command = `tmux send-keys -t "${target}" "${text}"`;

  if (execute) {
    command += ' Enter';
  }

  await execAsync(command, { timeout: 5000 });
}

/**
 * Get agent status from tmux panes
 */
export async function getAgentsStatus(sessionName: string): Promise<AgentStatus[]> {
  const agents: AgentStatus[] = [];

  // Agent ID to window/pane mapping
  const agentMapping: Record<string, { window: string; pane: number }> = {
    '00': { window: 'meta', pane: 0 },
    '10': { window: 'design', pane: 0 },
    '11': { window: 'design', pane: 1 },
    '12': { window: 'design', pane: 2 },
    '13': { window: 'design', pane: 3 },
    '20': { window: 'development', pane: 0 },
    '21': { window: 'development', pane: 1 },
    '22': { window: 'development', pane: 2 },
    '23': { window: 'development', pane: 3 },
    '30': { window: 'business', pane: 0 },
    '31': { window: 'business', pane: 1 },
    '32': { window: 'business', pane: 2 },
    '33': { window: 'business', pane: 3 }
  };

  // Agent names
  const agentNames: Record<string, string> = {
    '00': 'Meta Manager',
    '10': 'Design Manager',
    '11': 'UI Designer',
    '12': 'UX Designer',
    '13': 'Visual Designer',
    '20': 'Development Manager',
    '21': 'Frontend Developer',
    '22': 'Backend Developer',
    '23': 'DevOps',
    '30': 'Business Manager',
    '31': 'Accounting',
    '32': 'Strategy',
    '33': 'Analytics'
  };

  for (const [agentId, location] of Object.entries(agentMapping)) {
    try {
      // Get window index
      const { stdout: windowInfo } = await execAsync(
        `tmux list-windows -t "${sessionName}" -F "#{window_name}:#{window_index}" | grep "^${location.window}:"`,
        { timeout: 1000 }
      );

      const windowIndex = parseInt(windowInfo.split(':')[1] || '0');

      // Get pane status
      const { stdout: paneInfo } = await execAsync(
        `tmux list-panes -t "${sessionName}:${windowIndex}" -F "#{pane_index}:#{pane_current_command}" | grep "^${location.pane}:"`,
        { timeout: 1000 }
      );

      const command = paneInfo.split(':')[1] || '';
      const status = command.includes('clauded') || command.includes('claude') ? 'running' : 'stopped';

      agents.push({
        agentId,
        name: agentNames[agentId] || `Agent ${agentId}`,
        status,
        window: location.window,
        pane: location.pane
      });
    } catch (error) {
      // If we can't get info for an agent, mark it as stopped
      agents.push({
        agentId,
        name: agentNames[agentId] || `Agent ${agentId}`,
        status: 'stopped',
        window: location.window,
        pane: location.pane
      });
    }
  }

  return agents;
}