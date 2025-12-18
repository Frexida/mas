#!/usr/bin/env node

/**
 * Post-install script for MAS
 * Sets up the initial MAS configuration directory in user's home
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';

const MAS_DIR = join(homedir(), '.mas');
const CONFIG_FILE = join(MAS_DIR, 'config.json');

// Configuration template
const defaultConfig = {
  version: process.env.npm_package_version || '2.1.0',
  installedAt: new Date().toISOString(),
  dataDir: MAS_DIR,
  defaultSessionTimeout: 3600,
  autoAttach: true,
  colorScheme: 'default'
};

function setupMasDirectory() {
  // Create main MAS directory
  if (!existsSync(MAS_DIR)) {
    console.log(chalk.blue('🚀 Setting up MAS for first time use...'));

    try {
      // Create directory structure
      mkdirSync(MAS_DIR, { recursive: true });
      mkdirSync(join(MAS_DIR, 'sessions'), { recursive: true });
      mkdirSync(join(MAS_DIR, 'workflows'), { recursive: true });
      mkdirSync(join(MAS_DIR, 'templates'), { recursive: true });
      mkdirSync(join(MAS_DIR, 'logs'), { recursive: true });

      // Create default config file
      if (!existsSync(CONFIG_FILE)) {
        writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      }

      console.log(chalk.green('✅ MAS setup complete!'));
      console.log(chalk.cyan(`   Configuration directory: ${MAS_DIR}`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to create MAS directories:'), error.message);
      console.error(chalk.yellow('   You may need to run the setup manually.'));
      process.exit(1);
    }
  } else {
    console.log(chalk.gray('ℹ️  MAS is already configured at:'), MAS_DIR);

    // Update config file with new version if needed
    try {
      if (existsSync(CONFIG_FILE)) {
        const config = JSON.parse(require('fs').readFileSync(CONFIG_FILE, 'utf8'));
        if (config.version !== defaultConfig.version) {
          config.version = defaultConfig.version;
          config.updatedAt = new Date().toISOString();
          writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
          console.log(chalk.green('✅ Updated MAS configuration to version'), defaultConfig.version);
        }
      }
    } catch (error) {
      // Silently ignore config update errors
    }
  }
}

function printPostInstallMessage() {
  console.log();
  console.log(chalk.bold.cyan('='.repeat(50)));
  console.log(chalk.bold.white('  MAS - Multi-Agent System Manager'));
  console.log(chalk.cyan('='.repeat(50)));
  console.log();
  console.log('📚 Quick Start:');
  console.log(chalk.gray('   Create a new project:'), chalk.white('mas init my-project'));
  console.log(chalk.gray('   Start MAS session:   '), chalk.white('mas start'));
  console.log(chalk.gray('   Send message:        '), chalk.white('mas send <agent> "message"'));
  console.log();
  console.log('📖 Documentation:', chalk.blue('https://github.com/frexida/mas'));
  console.log('🐛 Report issues: ', chalk.blue('https://github.com/frexida/mas/issues'));
  console.log();
  console.log(chalk.green('Thank you for installing MAS! 🎉'));
  console.log();
}

// Check if running as post-install script
if (process.env.npm_lifecycle_event === 'postinstall' || process.argv[2] === '--setup') {
  setupMasDirectory();

  // Only show the welcome message on fresh install, not on updates
  if (process.env.npm_config_global && !process.env.npm_config_save) {
    printPostInstallMessage();
  }
}