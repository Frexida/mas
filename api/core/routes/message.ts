import { Hono } from 'hono';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { MessageRequestSchema, type MessageResponse } from '../validators/message.js';

const execAsync = promisify(exec);

const app = new Hono();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAS_ROOT = path.resolve(__dirname, '../../');

// POST /message - Send message to agents
app.post('/', async (c) => {
  try {
    // Parse and validate request body
    const body = await c.req.json();
    const validated = MessageRequestSchema.parse(body);

    // Process target (handle "agent-XX" format)
    let target = validated.target;
    if (target.startsWith('agent-')) {
      target = target.replace('agent-', '');
    }

    // Escape shell arguments
    target = target.replace(/['"\\]/g, '\\$&');
    // For message, we need to handle newlines and other special characters
    const message = validated.message
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/"/g, '\\"')    // Escape double quotes
      .replace(/\$/g, '\\$')   // Escape dollar signs
      .replace(/`/g, '\\`')    // Escape backticks
      .replace(/\n/g, '\\n')   // Convert newlines to \n
      .replace(/\r/g, '\\r')   // Convert carriage returns to \r
      .replace(/\t/g, '\\t');  // Convert tabs to \t

    // Use the session from the request
    const sessionName = validated.session;

    // Validate session exists
    try {
      const { stdout: sessionCheck } = await execAsync(`tmux has-session -t "${sessionName}" 2>/dev/null && echo "exists"`, {
        shell: true
      });

      if (!sessionCheck.includes('exists')) {
        const response: MessageResponse = {
          status: 'failed',
          timestamp: new Date().toISOString(),
          target: validated.target,
          error: `Session not found: ${sessionName}`
        };
        return c.json(response, 404);
      }
    } catch (checkError) {
      const response: MessageResponse = {
        status: 'failed',
        timestamp: new Date().toISOString(),
        target: validated.target,
        error: `Session not found: ${sessionName}`
      };
      return c.json(response, 404);
    }

    console.log('Using session:', sessionName);

    // Build mas send command with echo -e for proper handling of escape sequences
    let command = `${MAS_ROOT}/mas send "${target}" "$(echo -e "${message}")"`;
    if (validated.execute) {
      command += ' -e';
    }

    console.log('Executing command:', command);
    console.log('Execute flag:', validated.execute);

    // Execute mas send command with specified session
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: MAS_ROOT,
        timeout: 10000, // 10 second timeout
        env: {
          ...process.env,
          MAS_SESSION_NAME: sessionName
        }
      });

      // Debug: Log all output
      console.log('mas send stdout:', stdout);
      if (stderr) {
        console.log('mas send stderr:', stderr);
      }

      // Send "EOF" after 3 seconds for all messages (unconditionally)
      // This is required for Claude Code specification
      setTimeout(async () => {
        try {
          const execCmd = `${MAS_ROOT}/mas send "${target}" "EOF" -e`;
          const { stdout: execStdout, stderr: execStderr } = await execAsync(execCmd, {
            cwd: MAS_ROOT,
            env: { ...process.env, MAS_SESSION_NAME: sessionName },
            timeout: 10000
          });

          if (execStderr) {
            console.log('mas send execution stderr:', execStderr);
          }
          console.log('[Auto EOF] Sent "EOF" with Enter key after 3 seconds');
        } catch (execError: any) {
          console.error('[Auto EOF] Failed to send "EOF" command:', execError);
        }
      }, 3000);

      const response: MessageResponse = {
        status: 'acknowledged',
        timestamp: new Date().toISOString(),
        target: validated.target,
        session: sessionName,
        message: validated.message
      };

      return c.json(response, 200);
    } catch (execError: any) {
      console.error('Failed to execute mas send:', execError);

      const response: MessageResponse = {
        status: 'failed',
        timestamp: new Date().toISOString(),
        target: validated.target,
        error: execError.message || 'Failed to send message'
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