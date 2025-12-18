import { Hono } from 'hono';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const app = new Hono();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAS_ROOT = path.resolve(__dirname, '../../');

// Status response type
interface StatusResponse {
  status: 'running' | 'partial' | 'stopped' | 'error';
  session?: string;
  agents?: {
    id: string;
    status: 'running' | 'stopped';
    window: string;
    pane: number;
  }[];
  httpServer?: {
    running: boolean;
    port?: number;
    pid?: number;
  };
  error?: string;
}

// GET /status - Get MAS session status
app.get('/', async (c) => {
  try {
    // Check tmux sessions
    const { stdout: tmuxList } = await execAsync('tmux ls 2>/dev/null || echo ""', {
      cwd: MAS_ROOT
    });

    // Find MAS sessions
    const masSession = tmuxList
      .split('\n')
      .find(line => line.includes('mas-'));

    if (!masSession) {
      return c.json<StatusResponse>({
        status: 'stopped'
      }, 200);
    }

    // Extract session name
    const sessionName = masSession.split(':')[0];

    // Get detailed status using mas
    try {
      const { stdout: statusOut } = await execAsync(`${MAS_ROOT}/mas status --detail`, {
        cwd: MAS_ROOT,
        env: {
          ...process.env,
          SESSION_NAME: sessionName
        }
      });

      // Parse agent statuses
      const agents: StatusResponse['agents'] = [];
      const agentLines = statusOut.match(/Agent \d{2}: \w+/g) || [];

      for (const line of agentLines) {
        const match = line.match(/Agent (\d{2}): (\w+)/);
        if (match) {
          const [, id, status] = match;
          agents.push({
            id,
            status: status as 'running' | 'stopped',
            window: getAgentWindow(id),
            pane: getAgentPane(id)
          });
        }
      }

      // Check HTTP server status
      const httpServer: StatusResponse['httpServer'] = {
        running: false
      };

      try {
        const { stdout: pidContent } = await execAsync('cat .mas_http.pid 2>/dev/null || echo ""', {
          cwd: MAS_ROOT
        });

        if (pidContent.trim()) {
          const pid = parseInt(pidContent.trim());
          // Check if process is running
          const { stdout: psOut } = await execAsync(`ps -p ${pid} -o comm= 2>/dev/null || echo ""`, {
            cwd: MAS_ROOT
          });

          if (psOut.trim()) {
            httpServer.running = true;
            httpServer.pid = pid;
            httpServer.port = parseInt(process.env.MAS_HTTP_PORT || '8765');
          }
        }
      } catch {}

      // Determine overall status
      const runningCount = agents.filter(a => a.status === 'running').length;
      let overallStatus: StatusResponse['status'];

      if (runningCount === 13) {
        overallStatus = 'running';
      } else if (runningCount === 0) {
        overallStatus = 'stopped';
      } else {
        overallStatus = 'partial';
      }

      return c.json<StatusResponse>({
        status: overallStatus,
        session: sessionName,
        agents,
        httpServer
      }, 200);
    } catch (statusError: any) {
      console.error('Failed to get detailed status:', statusError);

      return c.json<StatusResponse>({
        status: 'error',
        session: sessionName,
        error: 'Failed to get detailed status'
      }, 200);
    }
  } catch (error: any) {
    console.error('Status check error:', error);

    return c.json<StatusResponse>({
      status: 'error',
      error: error.message || 'Failed to check status'
    }, 500);
  }
});

// Helper functions to map agent ID to window/pane
function getAgentWindow(agentId: string): string {
  const id = parseInt(agentId);
  if (id === 0) return 'meta';
  if (id >= 10 && id <= 13) return 'design';
  if (id >= 20 && id <= 23) return 'development';
  if (id >= 30 && id <= 33) return 'business';
  return 'unknown';
}

function getAgentPane(agentId: string): number {
  const id = parseInt(agentId);
  if (id === 0 || id === 10 || id === 20 || id === 30) return 0;
  if (id === 11 || id === 21 || id === 31) return 1;
  if (id === 12 || id === 22 || id === 32) return 2;
  if (id === 13 || id === 23 || id === 33) return 3;
  return -1;
}

export default app;