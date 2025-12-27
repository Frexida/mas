#!/usr/bin/env node

import chalk from 'chalk';
import http from 'http';

const services = [
  { name: 'API v1', port: 3001, path: '/health' },
  { name: 'API v2', port: 3002, path: '/health' },
  { name: 'API v3', port: 3003, path: '/health' },
  { name: 'Frontend v1', port: 5173, path: '/' },
  { name: 'Frontend v2', port: 5174, path: '/' },
  { name: 'Frontend v3', port: 5175, path: '/' }
];

async function checkService(service) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: service.port,
      path: service.path,
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve({
        ...service,
        status: 'running',
        statusCode: res.statusCode
      });
    });

    req.on('error', () => {
      resolve({
        ...service,
        status: 'stopped',
        statusCode: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ...service,
        status: 'timeout',
        statusCode: null
      });
    });

    req.end();
  });
}

async function main() {
  console.log(chalk.bold.blue('\n🔍 MAS Multi-Version Health Check\n'));
  console.log(chalk.gray('Checking all services...\n'));

  const results = await Promise.all(services.map(checkService));

  const maxNameLength = Math.max(...services.map(s => s.name.length));

  results.forEach(result => {
    const name = result.name.padEnd(maxNameLength);
    const port = `Port ${result.port}`.padEnd(10);

    if (result.status === 'running') {
      console.log(
        chalk.green('✓'),
        chalk.bold(name),
        chalk.gray(port),
        chalk.green('Running'),
        chalk.gray(`(HTTP ${result.statusCode})`)
      );
    } else if (result.status === 'timeout') {
      console.log(
        chalk.yellow('⚠'),
        chalk.bold(name),
        chalk.gray(port),
        chalk.yellow('Timeout')
      );
    } else {
      console.log(
        chalk.red('✗'),
        chalk.bold(name),
        chalk.gray(port),
        chalk.red('Stopped')
      );
    }
  });

  const running = results.filter(r => r.status === 'running').length;
  const total = results.length;

  console.log('\n' + chalk.gray('─'.repeat(50)));
  console.log(chalk.bold(`Summary: ${running}/${total} services running`));

  if (running === 0) {
    console.log(chalk.yellow('\n💡 Tip: Start services with:'));
    console.log(chalk.gray('  pnpm dev:all    # Start all versions'));
    console.log(chalk.gray('  pnpm dev:v1     # Start v1 only'));
    console.log(chalk.gray('  pnpm dev:v2     # Start v2 only'));
    console.log(chalk.gray('  pnpm dev:v3     # Start v3 only'));
  } else if (running < total) {
    console.log(chalk.yellow('\n⚠️  Some services are not running'));
    const stopped = results.filter(r => r.status !== 'running');
    stopped.forEach(s => {
      const cmd = s.name.includes('API')
        ? `pnpm dev:api:v${s.port - 3000}`
        : `pnpm dev:web:v${s.port - 5172}`;
      console.log(chalk.gray(`  ${cmd} # Start ${s.name}`));
    });
  } else {
    console.log(chalk.green('\n✨ All services are running!'));
  }

  // Watch mode
  if (process.argv.includes('--watch')) {
    console.log(chalk.gray('\nWatching... (Ctrl+C to stop)'));
    setTimeout(() => {
      console.clear();
      main();
    }, 5000);
  }
}

main().catch(console.error);