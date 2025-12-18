/**
 * Test Dashboard Server
 * Web-based dashboard for test results and monitoring
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { testManager } from './index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

const app = new Hono();

// Enable CORS
app.use('/*', cors());

// Serve static dashboard HTML
app.get('/', async (c) => {
  const html = await generateDashboardHTML();
  return c.html(html);
});

// API: Get test results
app.get('/api/results', async (c) => {
  try {
    const resultsPath = path.join(process.cwd(), 'test-results.json');
    const data = await fs.readFile(resultsPath, 'utf-8');
    return c.json(JSON.parse(data));
  } catch {
    return c.json({
      timestamp: new Date().toISOString(),
      results: [],
      summary: { total: 0, passed: 0, failed: 0, skipped: 0, errors: 0 }
    });
  }
});

// API: Get test statistics
app.get('/api/stats', async (c) => {
  const stats = testManager.getStats();
  return c.json(stats);
});

// API: Run tests
app.post('/api/run', async (c) => {
  const body = await c.req.json();

  // Run tests asynchronously
  testManager.run({
    suites: body.suites,
    coverage: body.coverage,
    parallel: body.parallel,
    reporter: 'json'
  }).then(() => {
    console.log('Test run completed');
  }).catch(error => {
    console.error('Test run failed:', error);
  });

  return c.json({ status: 'started' });
});

// API: Get real-time test status
app.get('/api/status', async (c) => {
  // This would connect to a WebSocket or SSE for real-time updates
  return c.json({
    running: false,
    currentSuite: null,
    progress: 0
  });
});

// API: Get coverage data
app.get('/api/coverage', async (c) => {
  try {
    const coveragePath = path.join(process.cwd(), 'api', 'coverage', 'coverage-summary.json');
    const data = await fs.readFile(coveragePath, 'utf-8');
    return c.json(JSON.parse(data));
  } catch {
    return c.json({
      total: {
        lines: { pct: 0 },
        statements: { pct: 0 },
        functions: { pct: 0 },
        branches: { pct: 0 }
      }
    });
  }
});

// API: Get test history
app.get('/api/history', async (c) => {
  // This would fetch historical test results from a database
  return c.json({
    runs: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        passed: 45,
        failed: 2,
        duration: 12500
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        passed: 47,
        failed: 0,
        duration: 11200
      }
    ]
  });
});

/**
 * Generate dashboard HTML
 */
async function generateDashboardHTML(): Promise<string> {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAS Test Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header h1 {
      color: #2d3748;
      font-size: 28px;
      margin-bottom: 8px;
    }

    .header .subtitle {
      color: #718096;
      font-size: 14px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .card h2 {
      color: #4a5568;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .metric {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .metric-value {
      font-size: 36px;
      font-weight: bold;
    }

    .metric-label {
      color: #718096;
      font-size: 14px;
    }

    .metric.passed .metric-value {
      color: #48bb78;
    }

    .metric.failed .metric-value {
      color: #f56565;
    }

    .metric.coverage .metric-value {
      color: #4299e1;
    }

    .metric.duration .metric-value {
      color: #9f7aea;
    }

    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }

    .test-list {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .test-item {
      display: flex;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      transition: background 0.2s;
    }

    .test-item:hover {
      background: #f7fafc;
    }

    .test-item:last-child {
      border-bottom: none;
    }

    .test-status {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 12px;
    }

    .test-status.passed {
      background: #48bb78;
    }

    .test-status.failed {
      background: #f56565;
    }

    .test-status.skipped {
      background: #cbd5e0;
    }

    .test-name {
      flex: 1;
      color: #2d3748;
    }

    .test-duration {
      color: #718096;
      font-size: 14px;
    }

    .controls {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #cbd5e0;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-indicator.running {
      background: #fef5e7;
      color: #f39c12;
    }

    .status-indicator.idle {
      background: #e8f5e9;
      color: #27ae60;
    }

    .spinner {
      width: 12px;
      height: 12px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .coverage-bar {
      width: 100%;
      height: 24px;
      background: #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      margin-top: 8px;
    }

    .coverage-fill {
      height: 100%;
      background: linear-gradient(90deg, #48bb78, #38a169);
      transition: width 0.3s ease;
    }

    .coverage-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #2d3748;
      font-size: 12px;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🧪 MAS Test Dashboard</h1>
      <div class="subtitle">Real-time test monitoring and results</div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button class="btn btn-primary" onclick="runTests()">Run All Tests</button>
      <button class="btn btn-secondary" onclick="runTests(['api-unit'])">Run API Tests</button>
      <button class="btn btn-secondary" onclick="runTests(['shell-unit'])">Run Shell Tests</button>
      <button class="btn btn-secondary" onclick="refreshData()">Refresh</button>
      <div class="status-indicator idle" id="statusIndicator">
        <span>Idle</span>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid">
      <div class="card">
        <h2>Tests Passed</h2>
        <div class="metric passed">
          <div class="metric-value" id="passedCount">0</div>
          <div class="metric-label">tests</div>
        </div>
      </div>

      <div class="card">
        <h2>Tests Failed</h2>
        <div class="metric failed">
          <div class="metric-value" id="failedCount">0</div>
          <div class="metric-label">tests</div>
        </div>
      </div>

      <div class="card">
        <h2>Code Coverage</h2>
        <div class="metric coverage">
          <div class="metric-value" id="coveragePercent">0</div>
          <div class="metric-label">%</div>
        </div>
        <div class="coverage-bar">
          <div class="coverage-fill" id="coverageFill" style="width: 0%"></div>
          <div class="coverage-text" id="coverageText">0%</div>
        </div>
      </div>

      <div class="card">
        <h2>Duration</h2>
        <div class="metric duration">
          <div class="metric-value" id="duration">0</div>
          <div class="metric-label">seconds</div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="chart-container">
      <h2 style="margin-bottom: 16px; color: #2d3748;">Test Results Over Time</h2>
      <canvas id="historyChart" width="400" height="200"></canvas>
    </div>

    <!-- Test List -->
    <div class="test-list">
      <h2 style="margin-bottom: 16px; color: #2d3748;">Recent Test Results</h2>
      <div id="testResults">
        <div class="test-item">
          <div class="test-status passed"></div>
          <div class="test-name">No tests run yet</div>
          <div class="test-duration">-</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Dashboard JavaScript
    let isRunning = false;

    async function fetchData(endpoint) {
      try {
        const response = await fetch(\`http://localhost:3001\${endpoint}\`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    }

    async function refreshData() {
      // Fetch results
      const results = await fetchData('/api/results');
      if (results) {
        updateMetrics(results);
        updateTestList(results.results);
      }

      // Fetch coverage
      const coverage = await fetchData('/api/coverage');
      if (coverage) {
        updateCoverage(coverage);
      }

      // Fetch status
      const status = await fetchData('/api/status');
      if (status) {
        updateStatus(status);
      }
    }

    function updateMetrics(data) {
      if (!data.summary) return;

      document.getElementById('passedCount').textContent = data.summary.passed;
      document.getElementById('failedCount').textContent = data.summary.failed;

      if (data.duration) {
        const seconds = (data.duration / 1000).toFixed(1);
        document.getElementById('duration').textContent = seconds;
      }
    }

    function updateCoverage(data) {
      if (!data.total) return;

      const percent = Math.round(data.total.lines.pct);
      document.getElementById('coveragePercent').textContent = percent;
      document.getElementById('coverageFill').style.width = percent + '%';
      document.getElementById('coverageText').textContent = percent + '%';
    }

    function updateTestList(results) {
      if (!results || results.length === 0) return;

      const container = document.getElementById('testResults');
      container.innerHTML = '';

      results.slice(0, 20).forEach(test => {
        const item = document.createElement('div');
        item.className = 'test-item';

        const status = document.createElement('div');
        status.className = \`test-status \${test.status}\`;

        const name = document.createElement('div');
        name.className = 'test-name';
        name.textContent = \`\${test.suite} › \${test.name}\`;

        const duration = document.createElement('div');
        duration.className = 'test-duration';
        duration.textContent = test.duration ? \`\${test.duration}ms\` : '-';

        item.appendChild(status);
        item.appendChild(name);
        item.appendChild(duration);
        container.appendChild(item);
      });
    }

    function updateStatus(status) {
      const indicator = document.getElementById('statusIndicator');

      if (status.running) {
        indicator.className = 'status-indicator running';
        indicator.innerHTML = '<div class="spinner"></div><span>Running</span>';
      } else {
        indicator.className = 'status-indicator idle';
        indicator.innerHTML = '<span>Idle</span>';
      }
    }

    async function runTests(suites = null) {
      if (isRunning) return;

      isRunning = true;
      updateStatus({ running: true });

      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suites: suites,
          coverage: true,
          parallel: true
        })
      };

      try {
        await fetch('http://localhost:3001/api/run', options);

        // Poll for results
        const pollInterval = setInterval(async () => {
          const status = await fetchData('/api/status');
          if (!status.running) {
            clearInterval(pollInterval);
            isRunning = false;
            await refreshData();
          }
        }, 1000);
      } catch (error) {
        console.error('Error running tests:', error);
        isRunning = false;
        updateStatus({ running: false });
      }
    }

    // Initial load
    refreshData();

    // Auto-refresh every 5 seconds
    setInterval(refreshData, 5000);
  </script>
</body>
</html>
  `;
}

/**
 * Start dashboard server
 */
export function startDashboard(port = 3001) {
  serve({
    fetch: app.fetch,
    port
  });

  console.log(`Test dashboard running at http://localhost:${port}`);
}