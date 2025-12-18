#!/usr/bin/env node

/**
 * Production startup script for MAS monorepo
 *
 * This script:
 * 1. Builds the web assets
 * 2. Starts the API server which serves static files
 * 3. Ensures MAS session is running
 */

import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
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

// Build web assets
function buildWebAssets() {
  logSection('Building Web Assets');

  const distPath = join(ROOT_DIR, 'web', 'dist');

  // Check if build already exists
  if (existsSync(distPath)) {
    log('✓ Web assets already built', colors.green);
    log('  To rebuild, run: npm run build:web', colors.yellow);
    return;
  }

  log('Building web assets...', colors.yellow);
  try {
    execSync('npm run build', {
      cwd: join(ROOT_DIR, 'web'),
      stdio: 'inherit'
    });
    log('✓ Web assets built successfully', colors.green);
  } catch (error) {
    log('✗ Failed to build web assets', colors.red);
    throw error;
  }
}

// Start production server
function startProductionServer() {
  logSection('Production Server');

  // Check MAS session
  if (!checkMASSession()) {
    log('⚠ MAS session not running', colors.yellow);
    log('  Starting MAS session...', colors.yellow);
    try {
      execSync('./mas start --no-attach', {
        cwd: ROOT_DIR,
        stdio: 'inherit'
      });
      log('✓ MAS session started', colors.green);
    } catch (error) {
      log('✗ Failed to start MAS session', colors.red);
      log('  You can start it manually with: ./mas start', colors.yellow);
    }
  } else {
    log('✓ MAS session already running', colors.green);
  }

  // Set production environment
  process.env.NODE_ENV = 'production';
  process.env.SERVE_STATIC = 'true';
  process.env.STATIC_PATH = join(ROOT_DIR, 'web', 'dist');

  log('Starting production server...', colors.yellow);
  log('  Server URL: http://localhost:8765', colors.blue);
  console.log('');

  // Start the API server (which will serve static files in production)
  const server = spawn('npm', ['run', 'start'], {
    cwd: join(ROOT_DIR, 'api'),
    stdio: 'inherit',
    env: process.env
  });

  server.on('error', (error) => {
    log('✗ Failed to start server:', colors.red);
    console.error(error);
    process.exit(1);
  });

  server.on('exit', (code) => {
    if (code !== 0) {
      log(`✗ Server exited with code ${code}`, colors.red);
      process.exit(code);
    }
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  log('Shutting down production server...', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

// Main execution
async function main() {
  log('═══════════════════════════════════════', colors.bright + colors.cyan);
  log('    MAS Production Environment', colors.bright + colors.cyan);
  log('═══════════════════════════════════════', colors.bright + colors.cyan);

  try {
    // Build web assets
    buildWebAssets();

    // Start production server
    startProductionServer();
  } catch (error) {
    log('Fatal error:', colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();