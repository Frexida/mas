import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

import messageRoute from './routes/message.js';
import runsRoute from './routes/runs.js';
import statusRoute from './routes/status.js';
import sessionsRoute from './routes/sessions.js';
import docsRoute from './core/routes/docs.js';
import templatesRoute from './core/routes/templates.js';
import messagesRoute from './core/routes/messages.js';
import monitorRoute from './core/routes/monitor.js';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Error handling
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({
      error: err.message,
      status: err.status
    }, err.status);
  }

  console.error('Unhandled error:', err);
  return c.json({
    error: 'Internal Server Error',
    status: 500
  }, 500);
});

// Root endpoint - API info (supports both GET and HEAD)
app.on(['GET', 'HEAD'], '/', (c) => {
  // For HEAD requests, just return status
  if (c.req.method === 'HEAD') {
    c.status(200);
    return c.body(null);
  }

  // For GET requests, return API info
  return c.json({
    name: 'MAS API Server',
    version: '2.1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health',
      'POST /message',
      'POST /runs',
      'GET /status',
      'GET /sessions',
      'GET /sessions/:sessionId',
      'POST /sessions/:sessionId/connect',
      'POST /sessions/:sessionId/stop'
    ]
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.route('/message', messageRoute);
app.route('/runs', runsRoute);
app.route('/status', statusRoute);
app.route('/sessions', sessionsRoute);
// Alias for WebUI compatibility
app.route('/session', sessionsRoute);
app.route('/docs', docsRoute);
app.route('/templates', templatesRoute);
app.route('/messages', messagesRoute);
app.route('/monitor', monitorRoute);

// Start server
const port = Number(process.env.MAS_API_PORT || 8765);
const host = process.env.MAS_API_HOST || '0.0.0.0';

console.log(`MAS API Server starting on ${host}:${port}`);

export default {
  port,
  fetch: app.fetch,
};

// For direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const { serve } = await import('@hono/node-server');
  serve({
    fetch: app.fetch,
    port,
    hostname: host,
  }, (info) => {
    console.log(`Server is running at http://${info.address}:${info.port}`);
  });
}