/**
 * MAS Test Manager
 * Unified test orchestration for TypeScript and Shell tests
 */

import { exec, ExecOptions } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

const execAsync = promisify(exec);

export interface TestResult {
  name: string;
  suite: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  error?: string;
  output?: string;
  coverage?: CoverageReport;
}

export interface TestSuite {
  name: string;
  type: 'vitest' | 'bash' | 'integration';
  path: string;
  pattern?: string;
  config?: any;
}

export interface CoverageReport {
  lines: { total: number; covered: number; percentage: number };
  branches?: { total: number; covered: number; percentage: number };
  functions?: { total: number; covered: number; percentage: number };
  statements?: { total: number; covered: number; percentage: number };
}

export interface TestRunOptions {
  suites?: string[];
  pattern?: string;
  watch?: boolean;
  coverage?: boolean;
  parallel?: boolean;
  verbose?: boolean;
  bail?: boolean;
  timeout?: number;
  reporter?: 'console' | 'json' | 'html' | 'markdown';
}

export class TestManager {
  private projectRoot: string;
  private testSuites: Map<string, TestSuite> = new Map();
  private results: TestResult[] = [];
  private startTime?: number;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.discoverTestSuites();
  }

  /**
   * Discover all test suites in the project
   */
  private async discoverTestSuites(): Promise<void> {
    // TypeScript/Vitest tests
    this.testSuites.set('api-unit', {
      name: 'API Unit Tests',
      type: 'vitest',
      path: path.join(this.projectRoot, 'api'),
      pattern: '**/*.test.ts'
    });

    this.testSuites.set('api-integration', {
      name: 'API Integration Tests',
      type: 'vitest',
      path: path.join(this.projectRoot, 'api/tests'),
      pattern: '*.test.ts'
    });

    // Shell script tests
    this.testSuites.set('shell-unit', {
      name: 'Shell Unit Tests',
      type: 'bash',
      path: path.join(this.projectRoot, 'tests'),
      pattern: 'test_simple.sh'
    });

    this.testSuites.set('shell-e2e', {
      name: 'Shell E2E Tests',
      type: 'bash',
      path: path.join(this.projectRoot, 'tests'),
      pattern: 'test_e2e.sh'
    });

    this.testSuites.set('shell-http', {
      name: 'HTTP Server Tests',
      type: 'bash',
      path: path.join(this.projectRoot, 'tests'),
      pattern: 'test_http_server.sh'
    });

    this.testSuites.set('shell-performance', {
      name: 'Performance Tests',
      type: 'bash',
      path: path.join(this.projectRoot, 'tests'),
      pattern: 'test_performance.sh'
    });
  }

  /**
   * Run all or selected test suites
   */
  async run(options: TestRunOptions = {}): Promise<TestResult[]> {
    this.results = [];
    this.startTime = performance.now();

    const suitesToRun = options.suites
      ? Array.from(this.testSuites.entries()).filter(([key]) => options.suites!.includes(key))
      : Array.from(this.testSuites.entries());

    if (options.parallel) {
      await Promise.all(suitesToRun.map(([key, suite]) => this.runSuite(suite, options)));
    } else {
      for (const [key, suite] of suitesToRun) {
        await this.runSuite(suite, options);
        if (options.bail && this.results.some(r => r.status === 'failed')) {
          break;
        }
      }
    }

    return this.generateReport(options.reporter || 'console');
  }

  /**
   * Run a single test suite
   */
  private async runSuite(suite: TestSuite, options: TestRunOptions): Promise<void> {
    const suiteStartTime = performance.now();

    try {
      switch (suite.type) {
        case 'vitest':
          await this.runVitestSuite(suite, options);
          break;
        case 'bash':
          await this.runBashSuite(suite, options);
          break;
        default:
          throw new Error(`Unknown test type: ${suite.type}`);
      }
    } catch (error) {
      this.results.push({
        name: suite.name,
        suite: suite.name,
        status: 'error',
        duration: performance.now() - suiteStartTime,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Run Vitest test suite
   */
  private async runVitestSuite(suite: TestSuite, options: TestRunOptions): Promise<void> {
    const args = ['vitest', 'run'];

    if (options.coverage) {
      args.push('--coverage');
    }

    if (options.watch) {
      args.push('--watch');
    }

    if (suite.pattern) {
      args.push(suite.pattern);
    }

    const command = `npx ${args.join(' ')}`;
    const execOptions: ExecOptions = {
      cwd: suite.path,
      env: { ...process.env, CI: 'true' }
    };

    try {
      const { stdout, stderr } = await execAsync(command, execOptions);

      // Parse Vitest output
      const results = this.parseVitestOutput(stdout);
      const coverage = options.coverage ? await this.parseVitestCoverage(suite.path) : undefined;

      results.forEach(result => {
        this.results.push({
          ...result,
          suite: suite.name,
          coverage
        });
      });
    } catch (error: any) {
      this.results.push({
        name: suite.name,
        suite: suite.name,
        status: 'failed',
        duration: 0,
        error: error.message,
        output: error.stdout + error.stderr
      });
    }
  }

  /**
   * Run Bash test suite
   */
  private async runBashSuite(suite: TestSuite, options: TestRunOptions): Promise<void> {
    const scriptPath = path.join(suite.path, suite.pattern || '');

    try {
      const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
        cwd: suite.path,
        env: { ...process.env, VERBOSE: options.verbose ? '1' : '0' }
      });

      const results = this.parseBashOutput(stdout);

      results.forEach(result => {
        this.results.push({
          ...result,
          suite: suite.name
        });
      });
    } catch (error: any) {
      this.results.push({
        name: suite.name,
        suite: suite.name,
        status: 'failed',
        duration: 0,
        error: error.message,
        output: error.stdout + error.stderr
      });
    }
  }

  /**
   * Parse Vitest output to extract test results
   */
  private parseVitestOutput(output: string): TestResult[] {
    const results: TestResult[] = [];
    const lines = output.split('\n');

    // Simple parsing - in production, you'd want to use Vitest's JSON reporter
    lines.forEach(line => {
      if (line.includes('✓')) {
        const match = line.match(/✓ (.+) \((\d+)ms\)/);
        if (match) {
          results.push({
            name: match[1].trim(),
            suite: '',
            status: 'passed',
            duration: parseInt(match[2])
          });
        }
      } else if (line.includes('✗')) {
        const match = line.match(/✗ (.+)/);
        if (match) {
          results.push({
            name: match[1].trim(),
            suite: '',
            status: 'failed',
            duration: 0
          });
        }
      }
    });

    return results.length > 0 ? results : [{
      name: 'All tests',
      suite: '',
      status: output.includes('failed') ? 'failed' : 'passed',
      duration: 0,
      output
    }];
  }

  /**
   * Parse Bash test output
   */
  private parseBashOutput(output: string): TestResult[] {
    const results: TestResult[] = [];
    const lines = output.split('\n');

    lines.forEach(line => {
      if (line.includes('[PASS]')) {
        const match = line.match(/\[PASS\] (.+)/);
        if (match) {
          results.push({
            name: match[1].trim(),
            suite: '',
            status: 'passed',
            duration: 0
          });
        }
      } else if (line.includes('[FAIL]')) {
        const match = line.match(/\[FAIL\] (.+)/);
        if (match) {
          results.push({
            name: match[1].trim(),
            suite: '',
            status: 'failed',
            duration: 0
          });
        }
      }
    });

    return results.length > 0 ? results : [{
      name: 'All tests',
      suite: '',
      status: output.toLowerCase().includes('fail') ? 'failed' : 'passed',
      duration: 0,
      output
    }];
  }

  /**
   * Parse Vitest coverage report
   */
  private async parseVitestCoverage(projectPath: string): Promise<CoverageReport | undefined> {
    try {
      const coveragePath = path.join(projectPath, 'coverage', 'coverage-summary.json');
      const data = await fs.readFile(coveragePath, 'utf-8');
      const coverage = JSON.parse(data);

      return {
        lines: coverage.total.lines,
        branches: coverage.total.branches,
        functions: coverage.total.functions,
        statements: coverage.total.statements
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Generate test report in various formats
   */
  private generateReport(format: 'console' | 'json' | 'html' | 'markdown'): TestResult[] {
    const duration = this.startTime ? performance.now() - this.startTime : 0;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    switch (format) {
      case 'console':
        this.printConsoleReport(passed, failed, skipped, errors, duration);
        break;
      case 'json':
        this.saveJsonReport();
        break;
      case 'html':
        this.generateHtmlReport();
        break;
      case 'markdown':
        this.generateMarkdownReport();
        break;
    }

    return this.results;
  }

  /**
   * Print console report
   */
  private printConsoleReport(passed: number, failed: number, skipped: number, errors: number, duration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`  ✓ Passed:  ${passed}`);
    console.log(`  ✗ Failed:  ${failed}`);
    console.log(`  ⊘ Skipped: ${skipped}`);
    console.log(`  ⚠ Errors:  ${errors}`);
    console.log(`  ⏱ Duration: ${(duration / 1000).toFixed(2)}s`);

    // Details by suite
    const suites = new Map<string, TestResult[]>();
    this.results.forEach(result => {
      if (!suites.has(result.suite)) {
        suites.set(result.suite, []);
      }
      suites.get(result.suite)!.push(result);
    });

    console.log('\n📋 Details by Suite:');
    suites.forEach((results, suite) => {
      const suitePassed = results.filter(r => r.status === 'passed').length;
      const suiteFailed = results.filter(r => r.status === 'failed').length;

      console.log(`\n  ${suite}:`);
      console.log(`    Tests: ${results.length} (✓ ${suitePassed}, ✗ ${suiteFailed})`);

      if (suiteFailed > 0) {
        results.filter(r => r.status === 'failed').forEach(result => {
          console.log(`    ✗ ${result.name}`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        });
      }
    });

    // Coverage summary if available
    const withCoverage = this.results.find(r => r.coverage);
    if (withCoverage?.coverage) {
      console.log('\n📈 Coverage:');
      const cov = withCoverage.coverage;
      console.log(`  Lines:      ${cov.lines.percentage.toFixed(1)}%`);
      if (cov.branches) console.log(`  Branches:   ${cov.branches.percentage.toFixed(1)}%`);
      if (cov.functions) console.log(`  Functions:  ${cov.functions.percentage.toFixed(1)}%`);
      if (cov.statements) console.log(`  Statements: ${cov.statements.percentage.toFixed(1)}%`);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Save JSON report
   */
  private async saveJsonReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      duration: this.startTime ? performance.now() - this.startTime : 0,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
        errors: this.results.filter(r => r.status === 'error').length
      }
    };

    await fs.writeFile(
      path.join(this.projectRoot, 'test-results.json'),
      JSON.stringify(report, null, 2)
    );
  }

  /**
   * Generate HTML report
   */
  private async generateHtmlReport(): Promise<void> {
    // Implementation would generate a nice HTML report
    // For now, just a placeholder
    console.log('HTML report generation not yet implemented');
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport(): Promise<void> {
    const duration = this.startTime ? performance.now() - this.startTime : 0;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;

    let markdown = `# Test Report\n\n`;
    markdown += `Generated: ${new Date().toISOString()}\n\n`;
    markdown += `## Summary\n\n`;
    markdown += `| Status | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| ✅ Passed | ${passed} |\n`;
    markdown += `| ❌ Failed | ${failed} |\n`;
    markdown += `| Total | ${this.results.length} |\n`;
    markdown += `| Duration | ${(duration / 1000).toFixed(2)}s |\n\n`;

    markdown += `## Details\n\n`;

    const suites = new Map<string, TestResult[]>();
    this.results.forEach(result => {
      if (!suites.has(result.suite)) {
        suites.set(result.suite, []);
      }
      suites.get(result.suite)!.push(result);
    });

    suites.forEach((results, suite) => {
      markdown += `### ${suite}\n\n`;
      markdown += `| Test | Status | Duration |\n`;
      markdown += `|------|--------|----------|\n`;

      results.forEach(result => {
        const status = result.status === 'passed' ? '✅' : '❌';
        markdown += `| ${result.name} | ${status} | ${result.duration}ms |\n`;
      });
      markdown += '\n';
    });

    await fs.writeFile(
      path.join(this.projectRoot, 'test-report.md'),
      markdown
    );
  }

  /**
   * Watch mode - continuously run tests on file changes
   */
  async watch(options: TestRunOptions = {}): Promise<void> {
    console.log('Starting test watch mode...');
    // Would implement file watching here
    // For now, just run tests with watch flag
    await this.run({ ...options, watch: true });
  }

  /**
   * Get test statistics
   */
  getStats(): any {
    const suiteStats = new Map<string, any>();

    this.testSuites.forEach((suite, key) => {
      const results = this.results.filter(r => r.suite === suite.name);
      suiteStats.set(key, {
        name: suite.name,
        type: suite.type,
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        avgDuration: results.reduce((acc, r) => acc + r.duration, 0) / (results.length || 1)
      });
    });

    return {
      suites: Object.fromEntries(suiteStats),
      totals: {
        tests: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
        errors: this.results.filter(r => r.status === 'error').length
      }
    };
  }
}

// Export singleton instance
export const testManager = new TestManager();