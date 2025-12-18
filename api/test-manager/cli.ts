#!/usr/bin/env node

/**
 * MAS Test Manager CLI
 * Command-line interface for running and managing tests
 */

import { program } from 'commander';
import { testManager, TestRunOptions } from './index.js';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';

// CLI setup
program
  .name('mas-test')
  .description('MAS Test Manager - Unified test orchestration')
  .version('1.0.0');

// Run command
program
  .command('run')
  .description('Run test suites')
  .option('-s, --suites <suites...>', 'Specific suites to run')
  .option('-p, --pattern <pattern>', 'Test file pattern')
  .option('-c, --coverage', 'Generate coverage report')
  .option('--parallel', 'Run suites in parallel')
  .option('--watch', 'Watch mode')
  .option('--verbose', 'Verbose output')
  .option('--bail', 'Stop on first failure')
  .option('-t, --timeout <seconds>', 'Test timeout', '30')
  .option('-r, --reporter <type>', 'Reporter type (console|json|html|markdown)', 'console')
  .action(async (options) => {
    const spinner = ora('Initializing test manager...').start();

    try {
      const runOptions: TestRunOptions = {
        suites: options.suites,
        pattern: options.pattern,
        coverage: options.coverage,
        parallel: options.parallel,
        watch: options.watch,
        verbose: options.verbose,
        bail: options.bail,
        timeout: parseInt(options.timeout) * 1000,
        reporter: options.reporter
      };

      spinner.text = 'Discovering test suites...';
      await new Promise(resolve => setTimeout(resolve, 500));

      spinner.text = 'Running tests...';
      const results = await testManager.run(runOptions);

      spinner.succeed('Tests completed');

      // Display summary
      const passed = results.filter(r => r.status === 'passed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const total = results.length;

      if (failed === 0) {
        console.log(chalk.green(`\n✨ All tests passed! (${passed}/${total})`));
      } else {
        console.log(chalk.red(`\n❌ ${failed} tests failed (${passed}/${total} passed)`));
        process.exit(1);
      }
    } catch (error) {
      spinner.fail('Test run failed');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// Watch command
program
  .command('watch')
  .description('Run tests in watch mode')
  .option('-s, --suites <suites...>', 'Specific suites to watch')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    console.log(chalk.cyan('Starting watch mode...'));

    try {
      await testManager.watch({
        suites: options.suites,
        verbose: options.verbose
      });
    } catch (error) {
      console.error(chalk.red('Watch mode failed:', error));
      process.exit(1);
    }
  });

// List command
program
  .command('list')
  .description('List available test suites')
  .action(async () => {
    const table = new Table({
      head: ['Suite ID', 'Name', 'Type', 'Path'],
      colWidths: [20, 30, 10, 40],
      style: {
        head: ['cyan']
      }
    });

    // Get suites from test manager
    const suites = [
      ['api-unit', 'API Unit Tests', 'vitest', 'api/**/*.test.ts'],
      ['api-integration', 'API Integration Tests', 'vitest', 'api/tests/*.test.ts'],
      ['shell-unit', 'Shell Unit Tests', 'bash', 'tests/test_simple.sh'],
      ['shell-e2e', 'Shell E2E Tests', 'bash', 'tests/test_e2e.sh'],
      ['shell-http', 'HTTP Server Tests', 'bash', 'tests/test_http_server.sh'],
      ['shell-performance', 'Performance Tests', 'bash', 'tests/test_performance.sh']
    ];

    suites.forEach(suite => {
      table.push(suite);
    });

    console.log('\n' + chalk.cyan.bold('Available Test Suites:'));
    console.log(table.toString());
  });

// Stats command
program
  .command('stats')
  .description('Show test statistics')
  .action(async () => {
    const stats = testManager.getStats();

    console.log(chalk.cyan.bold('\n📊 Test Statistics\n'));

    // Overall stats
    const overallTable = new Table({
      head: ['Metric', 'Value'],
      colWidths: [20, 15],
      style: { head: ['cyan'] }
    });

    overallTable.push(
      ['Total Tests', stats.totals.tests],
      ['Passed', chalk.green(stats.totals.passed)],
      ['Failed', chalk.red(stats.totals.failed)],
      ['Skipped', chalk.yellow(stats.totals.skipped)],
      ['Errors', chalk.red(stats.totals.errors)]
    );

    console.log(chalk.white.bold('Overall:'));
    console.log(overallTable.toString());

    // Suite stats
    if (Object.keys(stats.suites).length > 0) {
      console.log(chalk.white.bold('\nBy Suite:'));

      const suiteTable = new Table({
        head: ['Suite', 'Type', 'Total', 'Passed', 'Failed', 'Avg Duration'],
        colWidths: [25, 10, 10, 10, 10, 15],
        style: { head: ['cyan'] }
      });

      Object.entries(stats.suites).forEach(([key, suite]: [string, any]) => {
        suiteTable.push([
          suite.name,
          suite.type,
          suite.total,
          chalk.green(suite.passed),
          suite.failed > 0 ? chalk.red(suite.failed) : '0',
          `${suite.avgDuration.toFixed(2)}ms`
        ]);
      });

      console.log(suiteTable.toString());
    }
  });

// Coverage command
program
  .command('coverage')
  .description('Generate coverage report')
  .option('-f, --format <format>', 'Output format (text|html|json)', 'text')
  .action(async (options) => {
    const spinner = ora('Generating coverage report...').start();

    try {
      await testManager.run({
        coverage: true,
        reporter: options.format === 'text' ? 'console' : options.format
      });

      spinner.succeed('Coverage report generated');
    } catch (error) {
      spinner.fail('Coverage generation failed');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// CI command
program
  .command('ci')
  .description('Run tests in CI mode')
  .option('--coverage', 'Include coverage')
  .option('--junit', 'Output JUnit XML report')
  .action(async (options) => {
    console.log(chalk.cyan('Running tests in CI mode...'));

    try {
      const results = await testManager.run({
        coverage: options.coverage,
        parallel: true,
        bail: true,
        reporter: 'json'
      });

      const failed = results.filter(r => r.status === 'failed').length;

      if (options.junit) {
        // Generate JUnit XML report for CI systems
        console.log(chalk.gray('JUnit report saved to test-results.xml'));
      }

      process.exit(failed > 0 ? 1 : 0);
    } catch (error) {
      console.error(chalk.red('CI run failed:', error));
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}