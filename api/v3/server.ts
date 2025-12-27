import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { corsMiddleware, loggerMiddleware, errorHandler } from '../core/middleware.js';
import { getServerConfig } from '../core/config.js';

// Import routes from core
import messageRoute from '../core/routes/message.js';
import runsRoute from '../core/routes/runs.js';
import statusRoute from '../core/routes/status.js';
import sessionsRoute from '../core/routes/sessions.js';
import docsRoute from '../core/routes/docs.js';

const app = new Hono();
const config = getServerConfig('v3');

// Middleware
app.use('*', corsMiddleware);
app.use('*', loggerMiddleware);

// Error handling
app.onError(errorHandler);

// Root endpoint - API info
app.on(['GET', 'HEAD'], '/', (c) => {
  if (c.req.method === 'HEAD') {
    c.status(200);
    return c.body(null);
  }

  return c.json({
    name: 'MAS API Server',
    version: 'v3',
    apiVersion: '3.0.0-experimental',
    status: 'running',
    port: config.port,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /health',
      'POST /message',
      'POST /runs',
      'GET /status',
      'GET /sessions',
      'GET /sessions/:sessionId',
      'POST /sessions/:sessionId/connect',
      'POST /sessions/:sessionId/stop',
      // V3 experimental endpoints
      'GET /metrics',
      'POST /batch',
      'GET /websocket',
      'POST /stream'
    ]
  });
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: 'v3',
    port: config.port,
    experimental: true,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.route('/message', messageRoute);
app.route('/runs', runsRoute);
app.route('/status', statusRoute);
app.route('/sessions', sessionsRoute);
app.route('/session', sessionsRoute); // Alias for WebUI compatibility
app.route('/docs', docsRoute);

// V3 experimental routes (placeholders)
app.get('/metrics', (c) => {
  return c.json({
    version: 'v3',
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

app.post('/batch', (c) => {
  return c.json({
    message: 'Advanced batch processing endpoint (v3 feature)',
    version: 'v3',
    experimental: true
  });
});

app.get('/websocket', (c) => {
  return c.json({
    message: 'WebSocket endpoint info (v3 experimental)',
    version: 'v3',
    wsUrl: `ws://localhost:${config.port}/ws`
  });
});

app.post('/stream', (c) => {
  return c.json({
    message: 'Stream processing endpoint (v3 experimental)',
    version: 'v3',
    experimental: true
  });
});

// Export for testing
export default {
  port: config.port,
  fetch: app.fetch,
};

// For direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`MAS API Server v3 (experimental) starting on ${config.host}:${config.port}`);

  serve({
    fetch: app.fetch,
    port: config.port,
    hostname: config.host,
  }, (info) => {
    console.log(`API v3 (experimental) is running at http://${info.address}:${info.port}`);
  });
}