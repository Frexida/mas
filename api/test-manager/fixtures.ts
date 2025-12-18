/**
 * Test Fixtures
 * Pre-configured test data and scenarios
 */

import { z } from 'zod';

/**
 * Session Fixtures
 */
export const SessionFixtures = {
  // Active session with running agents
  activeSession: {
    sessionId: 'session-active-001',
    status: 'active',
    startedAt: '2024-01-01T00:00:00Z',
    tmuxSession: 'mas-session-active-001',
    agents: [
      {
        agentId: 'agent-001',
        status: 'running',
        pid: 1234,
        startedAt: '2024-01-01T00:00:00Z'
      },
      {
        agentId: 'agent-002',
        status: 'running',
        pid: 1235,
        startedAt: '2024-01-01T00:01:00Z'
      }
    ],
    metadata: {
      created_by: 'test-user',
      environment: 'test'
    }
  },

  // Stopped session
  stoppedSession: {
    sessionId: 'session-stopped-001',
    status: 'stopped',
    startedAt: '2024-01-01T00:00:00Z',
    stoppedAt: '2024-01-01T01:00:00Z',
    tmuxSession: 'mas-session-stopped-001',
    agents: [],
    metadata: {
      created_by: 'test-user',
      environment: 'test'
    }
  },

  // Failed session
  failedSession: {
    sessionId: 'session-failed-001',
    status: 'failed',
    startedAt: '2024-01-01T00:00:00Z',
    error: 'Session initialization failed',
    tmuxSession: 'mas-session-failed-001',
    agents: [],
    metadata: {
      created_by: 'test-user',
      environment: 'test'
    }
  },

  // Session with many agents
  largeSession: {
    sessionId: 'session-large-001',
    status: 'active',
    startedAt: '2024-01-01T00:00:00Z',
    tmuxSession: 'mas-session-large-001',
    agents: Array.from({ length: 10 }, (_, i) => ({
      agentId: \`agent-\${i.toString().padStart(3, '0')}\`,
      status: i % 3 === 0 ? 'stopped' : 'running',
      pid: 2000 + i,
      startedAt: new Date(Date.now() - i * 60000).toISOString()
    })),
    metadata: {
      created_by: 'test-user',
      environment: 'test'
    }
  }
};

/**
 * Run Fixtures
 */
export const RunFixtures = {
  // Pending run
  pendingRun: {
    runId: 'run-pending-001',
    sessionId: 'session-active-001',
    command: 'echo "test"',
    status: 'pending',
    createdAt: '2024-01-01T00:00:00Z'
  },

  // Running command
  runningRun: {
    runId: 'run-running-001',
    sessionId: 'session-active-001',
    command: 'sleep 10',
    status: 'running',
    createdAt: '2024-01-01T00:00:00Z',
    startedAt: '2024-01-01T00:00:01Z',
    pid: 3000
  },

  // Completed run
  completedRun: {
    runId: 'run-completed-001',
    sessionId: 'session-active-001',
    command: 'echo "success"',
    status: 'completed',
    createdAt: '2024-01-01T00:00:00Z',
    startedAt: '2024-01-01T00:00:01Z',
    completedAt: '2024-01-01T00:00:02Z',
    output: 'success\\n',
    exitCode: 0
  },

  // Failed run
  failedRun: {
    runId: 'run-failed-001',
    sessionId: 'session-active-001',
    command: 'exit 1',
    status: 'failed',
    createdAt: '2024-01-01T00:00:00Z',
    startedAt: '2024-01-01T00:00:01Z',
    completedAt: '2024-01-01T00:00:02Z',
    error: 'Command failed with exit code 1',
    exitCode: 1
  }
};

/**
 * API Request Fixtures
 */
export const RequestFixtures = {
  // Valid session creation request
  validCreateSession: {
    sessionId: 'test-session-001',
    metadata: {
      created_by: 'test-user',
      purpose: 'testing'
    }
  },

  // Invalid session creation (missing ID)
  invalidCreateSession: {
    metadata: {
      created_by: 'test-user'
    }
  },

  // Valid run creation
  validCreateRun: {
    command: 'echo "test"',
    timeout: 5000,
    environment: {
      NODE_ENV: 'test'
    }
  },

  // Invalid run creation (missing command)
  invalidCreateRun: {
    timeout: 5000
  },

  // Pagination request
  paginationRequest: {
    page: 2,
    limit: 10,
    sort: 'createdAt:desc'
  }
};

/**
 * API Response Fixtures
 */
export const ResponseFixtures = {
  // Successful response
  successResponse: {
    success: true,
    data: {},
    timestamp: '2024-01-01T00:00:00Z'
  },

  // Error response
  errorResponse: {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: []
    },
    timestamp: '2024-01-01T00:00:00Z'
  },

  // Paginated response
  paginatedResponse: {
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 100,
      pages: 10
    },
    timestamp: '2024-01-01T00:00:00Z'
  }
};

/**
 * Error Fixtures
 */
export const ErrorFixtures = {
  // Common errors
  notFound: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
    statusCode: 404
  },

  validationError: {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    statusCode: 400,
    details: [
      { field: 'sessionId', message: 'Required field missing' }
    ]
  },

  unauthorized: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    statusCode: 401
  },

  serverError: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    statusCode: 500
  },

  timeout: {
    code: 'TIMEOUT',
    message: 'Operation timed out',
    statusCode: 408
  }
};

/**
 * Performance Test Fixtures
 */
export const PerformanceFixtures = {
  // Large dataset for stress testing
  largeDataset: {
    sessions: Array.from({ length: 1000 }, (_, i) => ({
      sessionId: \`session-perf-\${i.toString().padStart(4, '0')}\`,
      status: i % 3 === 0 ? 'stopped' : 'active',
      startedAt: new Date(Date.now() - i * 60000).toISOString(),
      agents: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
        agentId: \`agent-\${i}-\${j}\`,
        status: 'running',
        pid: 10000 + i * 10 + j
      }))
    })),

    runs: Array.from({ length: 5000 }, (_, i) => ({
      runId: \`run-perf-\${i.toString().padStart(5, '0')}\`,
      sessionId: \`session-perf-\${(i % 1000).toString().padStart(4, '0')}\`,
      command: \`command-\${i}\`,
      status: ['pending', 'running', 'completed', 'failed'][i % 4],
      createdAt: new Date(Date.now() - i * 1000).toISOString()
    }))
  },

  // Concurrent requests
  concurrentRequests: Array.from({ length: 100 }, (_, i) => ({
    method: 'GET',
    path: \`/sessions/session-\${i.toString().padStart(3, '0')}\`,
    headers: {
      'X-Request-ID': \`req-\${i}\`
    }
  }))
};

/**
 * Shell Script Fixtures
 */
export const ShellFixtures = {
  // Tmux commands
  tmuxCommands: {
    createSession: 'tmux new-session -d -s test-session',
    killSession: 'tmux kill-session -t test-session',
    sendKeys: 'tmux send-keys -t test-session "echo test" Enter',
    capturePane: 'tmux capture-pane -t test-session -p',
    listSessions: 'tmux ls'
  },

  // Process commands
  processCommands: {
    listProcesses: 'ps aux | grep node',
    killProcess: 'kill -TERM 1234',
    checkProcess: 'ps -p 1234'
  },

  // File operations
  fileOperations: {
    createFile: 'touch test.txt',
    writeFile: 'echo "test" > test.txt',
    readFile: 'cat test.txt',
    deleteFile: 'rm test.txt'
  }
};

/**
 * Environment Fixtures
 */
export const EnvironmentFixtures = {
  // Test environment variables
  testEnv: {
    NODE_ENV: 'test',
    API_PORT: '3000',
    LOG_LEVEL: 'debug',
    DB_CONNECTION: 'memory',
    TMUX_TMPDIR: '/tmp/tmux-test',
    SESSION_TIMEOUT: '3600',
    MAX_AGENTS: '10',
    ENABLE_METRICS: 'true'
  },

  // Production-like environment
  prodLikeEnv: {
    NODE_ENV: 'production',
    API_PORT: '8080',
    LOG_LEVEL: 'info',
    DB_CONNECTION: 'postgresql://localhost/mas',
    SESSION_TIMEOUT: '86400',
    MAX_AGENTS: '100',
    ENABLE_METRICS: 'true',
    ENABLE_TRACING: 'true'
  },

  // CI environment
  ciEnv: {
    CI: 'true',
    NODE_ENV: 'test',
    API_PORT: '0', // Random port
    LOG_LEVEL: 'error',
    HEADLESS: 'true',
    COVERAGE: 'true'
  }
};

/**
 * Mock Data Generators
 */
export class MockDataGenerator {
  /**
   * Generate random session
   */
  static generateSession(overrides = {}): any {
    const id = \`session-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    return {
      sessionId: id,
      status: ['active', 'stopped', 'failed'][Math.floor(Math.random() * 3)],
      startedAt: new Date().toISOString(),
      tmuxSession: \`mas-\${id}\`,
      agents: [],
      metadata: {},
      ...overrides
    };
  }

  /**
   * Generate random agent
   */
  static generateAgent(sessionId: string, overrides = {}): any {
    return {
      agentId: \`agent-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
      sessionId,
      status: 'running',
      pid: Math.floor(Math.random() * 100000),
      startedAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate random run
   */
  static generateRun(sessionId: string, overrides = {}): any {
    return {
      runId: \`run-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,
      sessionId,
      command: \`echo "test-\${Date.now()}"\`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Generate batch of test data
   */
  static generateBatch(counts: {
    sessions?: number;
    agentsPerSession?: number;
    runsPerSession?: number;
  } = {}): any {
    const {
      sessions = 10,
      agentsPerSession = 2,
      runsPerSession = 5
    } = counts;

    const data: any = {
      sessions: [],
      agents: [],
      runs: []
    };

    for (let i = 0; i < sessions; i++) {
      const session = this.generateSession();
      data.sessions.push(session);

      for (let j = 0; j < agentsPerSession; j++) {
        const agent = this.generateAgent(session.sessionId);
        data.agents.push(agent);
        session.agents.push(agent);
      }

      for (let k = 0; k < runsPerSession; k++) {
        data.runs.push(this.generateRun(session.sessionId));
      }
    }

    return data;
  }
}

/**
 * Fixture Loader
 */
export class FixtureLoader {
  private static fixtures = new Map<string, any>();

  /**
   * Load fixture by name
   */
  static load(name: string): any {
    if (this.fixtures.has(name)) {
      return JSON.parse(JSON.stringify(this.fixtures.get(name)));
    }

    // Try to load from predefined fixtures
    const allFixtures = {
      ...SessionFixtures,
      ...RunFixtures,
      ...RequestFixtures,
      ...ResponseFixtures,
      ...ErrorFixtures,
      ...ShellFixtures,
      ...EnvironmentFixtures
    };

    if (allFixtures[name]) {
      return JSON.parse(JSON.stringify(allFixtures[name]));
    }

    throw new Error(\`Fixture '\${name}' not found\`);
  }

  /**
   * Register custom fixture
   */
  static register(name: string, data: any): void {
    this.fixtures.set(name, data);
  }

  /**
   * Clear all custom fixtures
   */
  static clear(): void {
    this.fixtures.clear();
  }
}

// Export all fixtures
export default {
  SessionFixtures,
  RunFixtures,
  RequestFixtures,
  ResponseFixtures,
  ErrorFixtures,
  PerformanceFixtures,
  ShellFixtures,
  EnvironmentFixtures,
  MockDataGenerator,
  FixtureLoader
};