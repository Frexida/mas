/**
 * Test Utilities and Helpers
 * Common utilities for testing across the MAS project
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

const execAsync = promisify(exec);

/**
 * Test Data Factories
 */
export class TestFactory {
  /**
   * Create a test session
   */
  static createSession(overrides = {}) {
    return {
      sessionId: `test-session-${Date.now()}`,
      status: 'active',
      startedAt: new Date().toISOString(),
      agents: [],
      tmuxSession: `test-${Date.now()}`,
      ...overrides
    };
  }

  /**
   * Create a test agent
   */
  static createAgent(overrides = {}) {
    return {
      agentId: `agent-${Date.now()}`,
      sessionId: `session-${Date.now()}`,
      status: 'running',
      startedAt: new Date().toISOString(),
      pid: Math.floor(Math.random() * 10000),
      ...overrides
    };
  }

  /**
   * Create a test run
   */
  static createRun(overrides = {}) {
    return {
      runId: `run-${Date.now()}`,
      sessionId: `session-${Date.now()}`,
      command: 'test command',
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create test message
   */
  static createMessage(overrides = {}) {
    return {
      messageId: `msg-${Date.now()}`,
      sessionId: `session-${Date.now()}`,
      content: 'test message',
      timestamp: new Date().toISOString(),
      ...overrides
    };
  }
}

/**
 * Test Helpers
 */
export class TestHelpers {
  /**
   * Wait for condition with timeout
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) return;
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }

  /**
   * Retry operation with backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    backoff = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, backoff * attempt));
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Create temporary test directory
   */
  static async createTempDir(prefix = 'test'): Promise<string> {
    const tmpDir = path.join(process.cwd(), '.tmp', `${prefix}-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    return tmpDir;
  }

  /**
   * Clean up test resources
   */
  static async cleanup(resources: {
    dirs?: string[];
    files?: string[];
    tmuxSessions?: string[];
    processes?: number[];
  }): Promise<void> {
    // Clean up directories
    if (resources.dirs) {
      for (const dir of resources.dirs) {
        try {
          await fs.rm(dir, { recursive: true, force: true });
        } catch { /* ignore */ }
      }
    }

    // Clean up files
    if (resources.files) {
      for (const file of resources.files) {
        try {
          await fs.unlink(file);
        } catch { /* ignore */ }
      }
    }

    // Clean up tmux sessions
    if (resources.tmuxSessions) {
      for (const session of resources.tmuxSessions) {
        try {
          await execAsync(`tmux kill-session -t ${session}`);
        } catch { /* ignore */ }
      }
    }

    // Kill processes
    if (resources.processes) {
      for (const pid of resources.processes) {
        try {
          process.kill(pid, 'SIGTERM');
        } catch { /* ignore */ }
      }
    }
  }

  /**
   * Mock HTTP request
   */
  static mockRequest(options: {
    method?: string;
    path?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}) {
    return {
      method: options.method || 'GET',
      path: options.path || '/',
      headers: options.headers || {},
      body: options.body,
      query: {},
      params: {}
    };
  }

  /**
   * Mock HTTP response
   */
  static mockResponse() {
    const response: any = {
      statusCode: 200,
      headers: {},
      body: null,
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.headers['Content-Type'] = 'application/json';
        this.body = JSON.stringify(data);
        return this;
      },
      send: function(data: any) {
        this.body = data;
        return this;
      },
      setHeader: function(name: string, value: string) {
        this.headers[name] = value;
        return this;
      }
    };

    return response;
  }
}

/**
 * Test Assertions
 */
export class TestAssertions {
  /**
   * Assert API response matches schema
   */
  static assertSchema<T>(data: unknown, schema: z.ZodType<T>): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(`Schema validation failed: ${JSON.stringify(result.error.errors, null, 2)}`);
    }
    return result.data;
  }

  /**
   * Assert tmux session exists
   */
  static async assertTmuxSession(sessionName: string): Promise<void> {
    try {
      await execAsync(`tmux has-session -t ${sessionName}`);
    } catch {
      throw new Error(`Tmux session '${sessionName}' does not exist`);
    }
  }

  /**
   * Assert process is running
   */
  static async assertProcessRunning(pid: number): Promise<void> {
    try {
      process.kill(pid, 0);
    } catch {
      throw new Error(`Process ${pid} is not running`);
    }
  }

  /**
   * Assert file exists
   */
  static async assertFileExists(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
    } catch {
      throw new Error(`File '${filePath}' does not exist`);
    }
  }

  /**
   * Assert file contains content
   */
  static async assertFileContains(filePath: string, content: string): Promise<void> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    if (!fileContent.includes(content)) {
      throw new Error(`File '${filePath}' does not contain '${content}'`);
    }
  }

  /**
   * Assert arrays are equal (order-independent)
   */
  static assertArraysEqual<T>(actual: T[], expected: T[]): void {
    if (actual.length !== expected.length) {
      throw new Error(`Array length mismatch: ${actual.length} !== ${expected.length}`);
    }

    const sortedActual = [...actual].sort();
    const sortedExpected = [...expected].sort();

    for (let i = 0; i < sortedActual.length; i++) {
      if (JSON.stringify(sortedActual[i]) !== JSON.stringify(sortedExpected[i])) {
        throw new Error(`Arrays are not equal at index ${i}`);
      }
    }
  }
}

/**
 * Performance Testing Utilities
 */
export class PerformanceUtils {
  private static marks = new Map<string, number>();

  /**
   * Start performance measurement
   */
  static mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * Measure duration since mark
   */
  static measure(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      throw new Error(`No mark found for '${name}'`);
    }
    return performance.now() - startTime;
  }

  /**
   * Assert performance threshold
   */
  static assertPerformance(name: string, maxDuration: number): void {
    const duration = this.measure(name);
    if (duration > maxDuration) {
      throw new Error(`Performance threshold exceeded for '${name}': ${duration}ms > ${maxDuration}ms`);
    }
  }

  /**
   * Benchmark function execution
   */
  static async benchmark<T>(
    fn: () => T | Promise<T>,
    iterations = 100
  ): Promise<{ mean: number; median: number; min: number; max: number }> {
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      durations.push(performance.now() - start);
    }

    durations.sort((a, b) => a - b);

    return {
      mean: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)],
      min: durations[0],
      max: durations[durations.length - 1]
    };
  }
}

/**
 * Mock Services
 */
export class MockServices {
  /**
   * Mock tmux service
   */
  static mockTmux() {
    return {
      sessions: new Map<string, any>(),

      createSession: async function(name: string) {
        this.sessions.set(name, {
          name,
          created: new Date(),
          windows: [],
          attached: false
        });
        return name;
      },

      hasSession: async function(name: string) {
        return this.sessions.has(name);
      },

      killSession: async function(name: string) {
        return this.sessions.delete(name);
      },

      sendKeys: async function(session: string, keys: string) {
        const s = this.sessions.get(session);
        if (s) {
          s.lastCommand = keys;
        }
      },

      capturePane: async function(session: string) {
        const s = this.sessions.get(session);
        return s?.lastCommand || '';
      }
    };
  }

  /**
   * Mock session manager
   */
  static mockSessionManager() {
    const sessions = new Map<string, any>();

    return {
      createSession: async (id: string) => {
        const session = TestFactory.createSession({ sessionId: id });
        sessions.set(id, session);
        return session;
      },

      getSession: async (id: string) => {
        return sessions.get(id);
      },

      listSessions: async () => {
        return Array.from(sessions.values());
      },

      deleteSession: async (id: string) => {
        return sessions.delete(id);
      }
    };
  }
}

/**
 * Test Environment Setup
 */
export class TestEnvironment {
  private static originalEnv: NodeJS.ProcessEnv;

  /**
   * Setup test environment
   */
  static setup(overrides: Record<string, string> = {}): void {
    this.originalEnv = { ...process.env };

    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.CI = 'true';
    process.env.LOG_LEVEL = 'error';

    // Apply overrides
    Object.assign(process.env, overrides);
  }

  /**
   * Restore original environment
   */
  static restore(): void {
    if (this.originalEnv) {
      process.env = this.originalEnv;
    }
  }

  /**
   * Setup test database
   */
  static async setupDatabase(): Promise<void> {
    // In a real app, this would set up a test database
    // For now, just a placeholder
    console.log('Setting up test database...');
  }

  /**
   * Teardown test database
   */
  static async teardownDatabase(): Promise<void> {
    console.log('Tearing down test database...');
  }
}

/**
 * Snapshot Testing
 */
export class SnapshotTesting {
  private static snapshotDir = path.join(process.cwd(), '__snapshots__');

  /**
   * Save snapshot
   */
  static async saveSnapshot(name: string, data: any): Promise<void> {
    await fs.mkdir(this.snapshotDir, { recursive: true });
    const filePath = path.join(this.snapshotDir, `${name}.snap`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Compare with snapshot
   */
  static async compareSnapshot(name: string, data: any): Promise<boolean> {
    const filePath = path.join(this.snapshotDir, `${name}.snap`);

    try {
      const snapshot = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      return JSON.stringify(snapshot) === JSON.stringify(data);
    } catch {
      // No snapshot exists, create one
      await this.saveSnapshot(name, data);
      return true;
    }
  }

  /**
   * Update snapshot
   */
  static async updateSnapshot(name: string, data: any): Promise<void> {
    await this.saveSnapshot(name, data);
  }
}

// Export all utilities
export default {
  TestFactory,
  TestHelpers,
  TestAssertions,
  PerformanceUtils,
  MockServices,
  TestEnvironment,
  SnapshotTesting
};