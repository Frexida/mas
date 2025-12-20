import { Hono } from 'hono';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { RunRequestSchema, type RunResponse } from '../validators/runs.js';

const execAsync = promisify(exec);

const app = new Hono();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 新構造: ワークスペースルートを環境変数から取得
const MAS_WORKSPACE_ROOT = process.env.MAS_WORKSPACE_ROOT ||
                          process.env.MAS_PROJECT_ROOT ||
                          process.cwd();
// 後方互換性のためMAS_ROOTを維持（スクリプトパス用）
const MAS_ROOT = path.resolve(__dirname, '../../');

// Generate a unique session ID (UUID v4 format)
function generateSessionId(): string {
  // Simple UUID v4 generation
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // Version 4
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8]; // Variant
    } else {
      uuid += hex[Math.floor(Math.random() * 16)];
    }
  }
  return uuid;
}

// POST /runs - Start a new MAS session
app.post('/', async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validated = RunRequestSchema.parse(body);

    // Generate session ID
    const sessionId = generateSessionId();

    // Always create isolated session workspace (新構造: ワークスペース内)
    const sessionDir = path.join(MAS_WORKSPACE_ROOT, 'sessions', sessionId);
    const unitDir = path.join(sessionDir, 'unit');
    const workflowsDir = path.join(sessionDir, 'workflows');
    const configPath = path.join('/tmp', `mas-config-${sessionId}.json`);

    // Save config file - save only agents configuration
    await writeFile(configPath, JSON.stringify(validated.agents, null, 2));

    // Build command - use dedicated session creation script
    const command = `${MAS_ROOT}/scripts/start_session.sh "${configPath}" "${sessionId}"`;

    // Execute session creation script
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: MAS_ROOT,
        timeout: 30000, // 30 second timeout for session creation
        env: {
          ...process.env,
          MAS_SESSION_ID: sessionId,
          MAS_SESSION_NAME: `mas-${sessionId.substring(0, 8)}`
        }
      });

      // Parse session name from output if available
      let tmuxSession = sessionId;
      const sessionMatch = stdout.match(/Session:\s+(\S+)/);
      if (sessionMatch) {
        tmuxSession = sessionMatch[1];
      }

      // Wait for agents to start
      console.log('Waiting for agents to start...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

      // Send initialization messages directly using mas send
      console.log('Sending initialization messages...');

      // Process meta manager if present
      if (validated.agents.metaManager) {
        const escapedPrompt = validated.agents.metaManager.prompt
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\$/g, '\\$')
          .replace(/`/g, '\\`')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        const metaCmd = `${MAS_ROOT}/mas send "00" "$(echo -e "${escapedPrompt}")" -e`;
        console.log('Sending to meta manager:', metaCmd);
        try {
          await execAsync(metaCmd, {
            cwd: MAS_ROOT,
            timeout: 5000,
            env: {
              ...process.env,
              MAS_SESSION_NAME: tmuxSession
            }
          });
        } catch (err) {
          console.warn('Failed to initialize meta manager:', err);
        }
      }

      // Process each unit
      for (const unit of validated.agents.units) {
        // Initialize manager
        if (unit.manager) {
          const escapedPrompt = unit.manager.prompt
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\$/g, '\\$')
            .replace(/`/g, '\\`')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          const managerCmd = `${MAS_ROOT}/mas send "${unit.manager.id}" "$(echo -e "${escapedPrompt}")" -e`;
          console.log('Sending to manager:', managerCmd);
          try {
            await execAsync(managerCmd, {
              cwd: MAS_ROOT,
              timeout: 5000,
              env: {
                ...process.env,
                MAS_SESSION_NAME: tmuxSession
              }
            });
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between messages
          } catch (err) {
            console.warn(`Failed to initialize manager ${unit.manager.id}:`, err);
          }
        }

        // Initialize workers
        for (const worker of unit.workers) {
          const escapedPrompt = worker.prompt
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\$/g, '\\$')
            .replace(/`/g, '\\`')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          const workerCmd = `${MAS_ROOT}/mas send "${worker.id}" "$(echo -e "${escapedPrompt}")" -e`;
          console.log('Sending to worker:', workerCmd);
          try {
            await execAsync(workerCmd, {
              cwd: MAS_ROOT,
              timeout: 5000,
              env: {
                ...process.env,
                MAS_SESSION_NAME: tmuxSession
              }
            });
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between messages
          } catch (err) {
            console.warn(`Failed to initialize worker ${worker.id}:`, err);
          }
        }
      }

      // Clean up config file after initialization
      await unlink(configPath).catch(err => {
        console.warn('Failed to delete config file:', err);
      });

      const response: RunResponse = {
        sessionId: sessionId,
        tmuxSession: tmuxSession,
        workingDir: sessionDir,
        unitDir: unitDir,
        workflowsDir: workflowsDir,
        startedAt: new Date().toISOString(),
        status: 'started'
      };

      return c.json(response, 201);
    } catch (execError: any) {
      console.error('Failed to start MAS session:', execError);

      // Try to clean up config file
      await unlink(configPath).catch(() => {});

      const response: RunResponse = {
        sessionId: sessionId,
        tmuxSession: '',
        workingDir: sessionDir,
        unitDir: unitDir,
        workflowsDir: workflowsDir,
        startedAt: new Date().toISOString(),
        status: 'failed'
      };

      return c.json(response, 500);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Validation error',
        details: error.errors
      }, 400);
    }

    console.error('Unexpected error:', error);
    return c.json({
      error: 'Internal server error'
    }, 500);
  }
});

export default app;