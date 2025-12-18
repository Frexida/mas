#!/usr/bin/env node

/**
 * Development startup script for MAS monorepo
 *
 * This script orchestrates the startup of:
 * 1. MAS session (if not already running)
 * 2. API server on port 8765
 * 3. Web development server on port 5173
 */

import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`═══ ${title} ═══`, colors.bright + colors.cyan);
}

// Check if MAS session is running
function checkMASSession() {
  try {
    const result = execSync('tmux ls 2>/dev/null || echo ""', { encoding: 'utf8' });
    return result.includes('mas-');
  } catch {
    return false;
  }
}

// Start MAS session if not running
function startMASSession() {
  logSection('MAS Session');

  if (checkMASSession()) {
    log('✓ MAS session already running', colors.green);
    return;
  }

  log('Starting MAS session...', colors.yellow);
  try {
    execSync('./mas start --no-attach', {
      cwd: ROOT_DIR,
      stdio: 'inherit'
    });
    log('✓ MAS session started', colors.green);
  } catch (error) {
    log('✗ Failed to start MAS session', colors.red);
    log(`  Error: ${error.message}`, colors.red);
    log('  You can start it manually with: ./mas start', colors.yellow);
  }
}

// Start development servers
async function startServers() {
  logSection('Development Servers');

  const { default: concurrently } = await import('concurrently');

  log('Starting development servers...', colors.yellow);
  log('  API Server: http://localhost:8765', colors.blue);
  log('  Web UI:     http://localhost:5173', colors.blue);
  console.log('');

  const { result } = concurrently([
    {
      command: 'npm run start',
      name: 'API',
      cwd: join(ROOT_DIR, 'api'),
      prefixColor: 'green'
    },
    {
      command: 'npm run dev',
      name: 'WEB',
      cwd: join(ROOT_DIR, 'web'),
      prefixColor: 'blue'
    }
  ], {
    prefix: 'name',
    killOthers: ['failure', 'success'],
    restartTries: 3
  });

  result.then(
    () => {
      log('All servers stopped', colors.green);
    },
    (error) => {
      log('Server error:', colors.red);
      console.error(error);
    }
  );
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  log('Shutting down...', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Main execution
async function main() {
  log('═══════════════════════════════════════', colors.bright + colors.cyan);
  log('    MAS Development Environment', colors.bright + colors.cyan);
  log('═══════════════════════════════════════', colors.bright + colors.cyan);

  // Start MAS session
  startMASSession();

  // Start development servers
  await startServers();
}

main().catch(error => {
  log('Fatal error:', colors.red);
  console.error(error);
  process.exit(1);
});