/**
 * Example Test Suite with Formatted Messages
 * Demonstrates the test message design system in action
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  TestMessageFormatter,
  UnitTestFormatter,
  VisualTestFormatter,
  TestReportGenerator,
  Language,
  MessageType,
  TestPhase,
  createBuilder
} from '../messages/index.js';
import { UnitTestMessages } from '../messages/unit-test-messages.js';

/**
 * Example: Session Management Tests with Rich Messages
 */
describe('Session Management - Formatted Messages Example', () => {
  // Initialize formatters
  const formatter = new TestMessageFormatter({
    language: Language.EN,
    showTimestamp: true,
    verbose: true
  });

  const unitFormatter = new UnitTestFormatter({
    language: Language.EN
  });

  const visualFormatter = new VisualTestFormatter();

  let testSession: any;
  let testResults: any[] = [];

  beforeAll(() => {
    // Log setup phase with formatted message
    console.log(formatter.format('setup_started', {}, {
      type: MessageType.INFO,
      phase: TestPhase.SETUP
    }));

    // Create test data
    testSession = {
      sessionId: 'test-001',
      status: 'active',
      agents: []
    };

    console.log(formatter.success('setup_completed', {}));
  });

  beforeEach(() => {
    // Reset unit test formatter for each test
    unitFormatter.reset();
  });

  afterAll(() => {
    // Log teardown phase
    console.log(formatter.format('teardown_started', {}, {
      type: MessageType.INFO,
      phase: TestPhase.TEARDOWN
    }));

    // Generate final report
    generateFinalReport();

    console.log(formatter.success('teardown_completed', {}));
  });

  it('should create a session with proper formatting', () => {
    // Arrange phase
    console.log(unitFormatter.startArrange('Create Session Test'));
    console.log(unitFormatter.formatWithContext('fixture_load', { name: 'sessionData' }));
    console.log(unitFormatter.formatWithContext('mock_created', { name: 'sessionManager' }));

    const sessionData = {
      sessionId: 'session-123',
      metadata: { createdBy: 'test' }
    };

    // Act phase
    console.log(unitFormatter.startAct('createSession'));
    console.log(unitFormatter.formatWithContext('action_call', {
      method: 'sessionManager.create',
      args: JSON.stringify(sessionData)
    }));

    // Simulate session creation
    const createdSession = { ...sessionData, status: 'active' };

    // Assert phase
    console.log(unitFormatter.startAssert());
    const assertion = unitFormatter.formatAssertion(
      'session.status',
      createdSession.status,
      'active',
      true
    );
    console.log(assertion);

    expect(createdSession.status).toBe('active');

    // Record result
    testResults.push({
      name: 'Create Session',
      status: 'passed',
      duration: 15
    });
  });

  it('should handle session errors with detailed messages', () => {
    // Arrange
    console.log(unitFormatter.startArrange('Session Error Test'));
    console.log(unitFormatter.formatWithContext('mock_created', { name: 'errorSession' }));
    console.log(unitFormatter.formatWithContext('mock_throw', {
      error: 'SessionNotFoundError'
    }));

    // Act
    console.log(unitFormatter.startAct('getInvalidSession'));

    let error: any;
    try {
      // Simulate error
      throw new Error('Session not found');
    } catch (e) {
      error = e;
      console.log(formatter.error('error_exception', {
        message: error.message
      }));
    }

    // Assert
    console.log(unitFormatter.startAssert());
    const assertion = unitFormatter.formatAssertion(
      'error.message',
      error.message,
      'Session not found',
      true
    );
    console.log(assertion);

    expect(error.message).toBe('Session not found');

    testResults.push({
      name: 'Session Error Handling',
      status: 'passed',
      duration: 8
    });
  });

  it('should validate session state transitions', () => {
    // Using the message builder for complex messages
    const builder = createBuilder(formatter);

    builder
      .addSection('Test Setup')
      .addMessage('test_started', { name: 'Session State Transitions' })
      .addEmptyLine()
      .addSection('State Transitions')
      .addLine('Initial → Active: ✓')
      .addLine('Active → Stopped: ✓')
      .addLine('Stopped → Active: ✗ (Invalid)')
      .addEmptyLine()
      .addSeparator();

    console.log(builder.build());

    // Test implementation
    const states = ['initial', 'active', 'stopped'];
    states.forEach(state => {
      console.log(formatter.info('assertion_passed', {
        description: `State ${state} is valid`
      }));
    });

    testResults.push({
      name: 'Session State Validation',
      status: 'passed',
      duration: 12
    });
  });

  /**
   * Generate final test report
   */
  function generateFinalReport() {
    const reportGenerator = new TestReportGenerator(Language.EN);

    const reportData = {
      suites: [{
        name: 'Session Management',
        tests: testResults
      }],
      summary: {
        total: testResults.length,
        passed: testResults.filter(t => t.status === 'passed').length,
        failed: testResults.filter(t => t.status === 'failed').length,
        skipped: 0,
        duration: testResults.reduce((sum, t) => sum + (t.duration || 0), 0)
      },
      coverage: {
        lines: 85,
        branches: 78,
        functions: 92,
        statements: 87
      }
    };

    const report = reportGenerator.generateReport(reportData);
    console.log(report);

    // Also create visual representations
    console.log('\n' + visualFormatter.createTestTree(reportData.suites[0]));

    // Coverage heatmap
    const coverageFiles = [
      { name: 'sessionManager.ts', coverage: 92 },
      { name: 'sessionValidator.ts', coverage: 85 },
      { name: 'sessionStore.ts', coverage: 78 },
      { name: 'sessionUtils.ts', coverage: 95 }
    ];

    console.log('\n' + visualFormatter.createCoverageHeatmap(coverageFiles));
  }
});

/**
 * Example: Japanese Language Test Messages
 */
describe('日本語テストメッセージの例', () => {
  const formatter = new TestMessageFormatter({
    language: Language.JA,
    showTimestamp: false
  });

  const unitFormatter = new UnitTestFormatter({
    language: Language.JA
  });

  it('セッション作成テスト（日本語メッセージ）', () => {
    console.log(formatter.format('test_started', { name: 'セッション作成' }, {
      type: MessageType.INFO
    }));

    // アレンジフェーズ
    console.log(formatter.info('setup_started', {}));

    const testData = {
      sessionId: 'ja-test-001',
      status: 'active'
    };

    // アクトフェーズ
    console.log(formatter.format('action_start', {
      actionName: 'セッション作成処理'
    }, { type: MessageType.INFO }));

    // アサートフェーズ
    console.log(formatter.success('assertion_passed', {
      description: 'セッションIDが正しく設定されている'
    }));

    expect(testData.sessionId).toBe('ja-test-001');

    console.log(formatter.success('test_passed', {
      name: 'セッション作成',
      duration: 10
    }));
  });

  it('エラーハンドリングテスト（日本語）', () => {
    console.log(formatter.format('test_started', {
      name: 'エラーハンドリング'
    }, { type: MessageType.INFO }));

    try {
      throw new Error('セッションが見つかりません');
    } catch (error: any) {
      console.log(formatter.error('error_exception', {
        message: error.message
      }));

      expect(error.message).toContain('セッション');
    }

    console.log(formatter.success('test_passed', {
      name: 'エラーハンドリング',
      duration: 5
    }));
  });

  afterAll(() => {
    // 日本語サマリー
    const summary = formatter.formatSummary({
      total: 2,
      passed: 2,
      failed: 0,
      skipped: 0,
      duration: 15
    });

    console.log(summary);
  });
});

/**
 * Example: Mock and Spy Message Formatting
 */
describe('Mock and Spy Messages Example', () => {
  const unitFormatter = new UnitTestFormatter();

  it('should format mock expectations correctly', () => {
    // Create mock
    console.log(unitFormatter.formatWithContext('mock_created', {
      name: 'apiClient'
    }));

    // Set expectations
    console.log(unitFormatter.formatWithContext('mock_expectation', {
      method: 'apiClient.get',
      times: 2
    }));

    // Mock returns
    console.log(unitFormatter.formatWithContext('mock_return', {
      value: '{ status: 200, data: [...] }'
    }));

    // Verify mock
    console.log(unitFormatter.formatMockExpectation(
      'apiClient',
      'get',
      2,
      2
    ));

    expect(true).toBe(true);
  });

  it('should format spy reports', () => {
    // Create spy
    console.log(unitFormatter.formatWithContext('spy_created', {
      target: 'console.log'
    }));

    // Spy detections
    console.log(unitFormatter.formatWithContext('spy_called', {
      method: 'console.log',
      args: '["Hello", "World"]'
    }));

    console.log(unitFormatter.formatWithContext('spy_call_count', {
      count: 3
    }));

    console.log(unitFormatter.formatWithContext('spy_arguments', {
      args: '["arg1", "arg2", { key: "value" }]'
    }));

    expect(true).toBe(true);
  });
});

/**
 * Example: Progress and Performance Messages
 */
describe('Progress and Performance Reporting', () => {
  const formatter = new TestMessageFormatter();

  it('should show progress bars', () => {
    console.log('\nTest Progress:');

    // Show progress at different stages
    [0, 25, 50, 75, 100].forEach(percent => {
      const current = percent;
      const total = 100;
      console.log(formatter.createProgressBar(current, total, 40));
    });

    expect(true).toBe(true);
  });

  it('should format performance metrics', () => {
    console.log('\nPerformance Metrics:');

    // Baseline
    console.log(formatter.format('performance_baseline', {
      metric: 'API Response Time',
      value: 150
    }, { type: MessageType.INFO }));

    // Improvement
    console.log(formatter.success('performance_improved', {
      metric: 'Database Query',
      improvement: 25
    }));

    // Degradation
    console.log(formatter.warning('performance_degraded', {
      metric: 'Memory Usage',
      degradation: 15
    }));

    expect(true).toBe(true);
  });
});

/**
 * Example: Test Matrix Visualization
 */
describe('Visual Test Matrix', () => {
  const visualFormatter = new VisualTestFormatter();

  it('should create test matrix', () => {
    const matrixData = [
      {
        suite: 'API Tests',
        tests: [
          { name: 'GET /sessions', passed: true },
          { name: 'POST /sessions', passed: true },
          { name: 'DELETE /sessions', passed: false }
        ]
      },
      {
        suite: 'Integration',
        tests: [
          { name: 'Database', passed: true },
          { name: 'Cache', passed: true },
          { name: 'Queue', passed: true }
        ]
      },
      {
        suite: 'E2E Tests',
        tests: [
          { name: 'User Flow', passed: true },
          { name: 'Admin Flow', passed: false },
          { name: 'API Flow', passed: true }
        ]
      }
    ];

    console.log('\n' + visualFormatter.createTestMatrix(matrixData));

    expect(true).toBe(true);
  });
});

// Export for reuse
export { formatter, unitFormatter, visualFormatter };