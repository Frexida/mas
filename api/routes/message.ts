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

    // Escape shell arguments
    const target = validated.target.replace(/['"\\]/g, '\\$&');
    const message = validated.message.replace(/['"\\]/g, '\\$&');

    // Build command using mas_refactored.sh
    let command = `${MAS_ROOT}/mas_refactored.sh send "${target}" "${message}"`;
    if (validated.execute) {
      command += ' -e';
    }

    // Debug: Log the actual command
    console.log('Executing command:', command);
    console.log('Execute flag:', validated.execute);

    // Execute mas_refactored.sh send command
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: MAS_ROOT,
        timeout: 10000, // 10 second timeout
      });

      if (stderr && !stderr.includes('[INFO]') && !stderr.includes('[SUCCESS]')) {
        console.warn('mas_refactored.sh stderr:', stderr);
      }

      const response: MessageResponse = {
        status: 'acknowledged',
        timestamp: new Date().toISOString(),
        target: validated.target,
        message: validated.message
      };

      return c.json(response, 200);
    } catch (execError: any) {
      console.error('Failed to execute mas_refactored.sh:', execError);

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