/**
 * Unit Test Message Components
 * Specialized message formatters for unit testing scenarios
 */

import chalk from 'chalk';
import { TestMessageFormatter, Language, MessageType, TestPhase } from './index.js';

/**
 * Unit test message categories
 */
export enum UnitTestCategory {
  ARRANGEMENT = 'arrangement',
  ACTION = 'action',
  ASSERTION = 'assertion',
  MOCK = 'mock',
  STUB = 'stub',
  SPY = 'spy',
  FIXTURE = 'fixture',
  SNAPSHOT = 'snapshot'
}

/**
 * Unit test message patterns
 */
export class UnitTestMessages {
  private static patterns = {
    en: {
      // Arrangement messages
      arrange_start: 'Arranging test data for: {testName}',
      arrange_fixture: 'Loading fixture: {fixtureName}',
      arrange_mock: 'Setting up mock: {mockName}',
      arrange_complete: 'Test arrangement complete',

      // Action messages
      action_start: 'Executing action: {actionName}',
      action_call: 'Calling {method} with {args}',
      action_trigger: 'Triggering event: {eventName}',
      action_complete: 'Action completed',

      // Assertion messages
      assert_equal: 'Assert equal: {actual} === {expected}',
      assert_not_equal: 'Assert not equal: {actual} !== {expected}',
      assert_truthy: 'Assert truthy: {value}',
      assert_falsy: 'Assert falsy: {value}',
      assert_contains: 'Assert contains: {haystack} includes {needle}',
      assert_throws: 'Assert throws: {function} throws {error}',
      assert_async: 'Assert async: {promise} resolves to {value}',
      assert_deep_equal: 'Assert deep equal: objects match',
      assert_type: 'Assert type: {value} is {type}',
      assert_instance: 'Assert instance: {object} instanceof {class}',

      // Mock messages
      mock_created: 'Mock created: {name}',
      mock_expectation: 'Mock expectation: {method} called {times} times',
      mock_return: 'Mock returns: {value}',
      mock_throw: 'Mock throws: {error}',
      mock_verify: 'Verifying mock expectations',
      mock_reset: 'Resetting mock: {name}',

      // Stub messages
      stub_created: 'Stub created: {method}',
      stub_behavior: 'Stub behavior: {method} → {return}',
      stub_called: 'Stub called: {method}({args})',
      stub_reset: 'Stub reset: {method}',

      // Spy messages
      spy_created: 'Spy created: {target}',
      spy_called: 'Spy detected call: {method}({args})',
      spy_call_count: 'Spy call count: {count}',
      spy_arguments: 'Spy captured arguments: {args}',
      spy_return: 'Spy captured return: {value}',

      // Fixture messages
      fixture_load: 'Loading fixture: {name}',
      fixture_create: 'Creating fixture: {type}',
      fixture_reset: 'Resetting fixtures',
      fixture_save: 'Saving fixture: {name}',

      // Snapshot messages
      snapshot_create: 'Creating snapshot: {name}',
      snapshot_match: 'Snapshot matches: {name}',
      snapshot_mismatch: 'Snapshot mismatch: {name}',
      snapshot_update: 'Updating snapshot: {name}',
      snapshot_obsolete: 'Obsolete snapshot: {name}'
    },

    ja: {
      // アレンジメッセージ
      arrange_start: 'テストデータを準備中: {testName}',
      arrange_fixture: 'フィクスチャ読み込み: {fixtureName}',
      arrange_mock: 'モック設定: {mockName}',
      arrange_complete: 'テスト準備完了',

      // アクションメッセージ
      action_start: 'アクション実行: {actionName}',
      action_call: '{method} を {args} で呼び出し',
      action_trigger: 'イベント発火: {eventName}',
      action_complete: 'アクション完了',

      // アサーションメッセージ
      assert_equal: 'アサート等価: {actual} === {expected}',
      assert_not_equal: 'アサート非等価: {actual} !== {expected}',
      assert_truthy: 'アサート真値: {value}',
      assert_falsy: 'アサート偽値: {value}',
      assert_contains: 'アサート含有: {haystack} が {needle} を含む',
      assert_throws: 'アサート例外: {function} が {error} をスロー',
      assert_async: 'アサート非同期: {promise} が {value} に解決',
      assert_deep_equal: 'アサート深い等価: オブジェクトが一致',
      assert_type: 'アサート型: {value} は {type} 型',
      assert_instance: 'アサートインスタンス: {object} が {class} のインスタンス',

      // モックメッセージ
      mock_created: 'モック作成: {name}',
      mock_expectation: 'モック期待値: {method} が {times} 回呼ばれる',
      mock_return: 'モック戻り値: {value}',
      mock_throw: 'モック例外: {error}',
      mock_verify: 'モック期待値を検証中',
      mock_reset: 'モックリセット: {name}',

      // スタブメッセージ
      stub_created: 'スタブ作成: {method}',
      stub_behavior: 'スタブ動作: {method} → {return}',
      stub_called: 'スタブ呼び出し: {method}({args})',
      stub_reset: 'スタブリセット: {method}',

      // スパイメッセージ
      spy_created: 'スパイ作成: {target}',
      spy_called: 'スパイ検出: {method}({args})',
      spy_call_count: 'スパイ呼び出し回数: {count}',
      spy_arguments: 'スパイ捕獲引数: {args}',
      spy_return: 'スパイ捕獲戻り値: {value}',

      // フィクスチャメッセージ
      fixture_load: 'フィクスチャ読み込み: {name}',
      fixture_create: 'フィクスチャ作成: {type}',
      fixture_reset: 'フィクスチャリセット',
      fixture_save: 'フィクスチャ保存: {name}',

      // スナップショットメッセージ
      snapshot_create: 'スナップショット作成: {name}',
      snapshot_match: 'スナップショット一致: {name}',
      snapshot_mismatch: 'スナップショット不一致: {name}',
      snapshot_update: 'スナップショット更新: {name}',
      snapshot_obsolete: '古いスナップショット: {name}'
    }
  };

  /**
   * Get unit test message
   */
  static getMessage(
    key: string,
    context: Record<string, any> = {},
    language: Language = Language.EN
  ): string {
    const template = this.patterns[language][key] || this.patterns.en[key] || key;
    let message = template;

    Object.keys(context).forEach(k => {
      message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), context[k]);
    });

    return message;
  }
}

/**
 * Unit test formatter with AAA pattern support
 */
export class UnitTestFormatter extends TestMessageFormatter {
  private currentPhase: 'arrange' | 'act' | 'assert' | null = null;
  private indentLevel: number = 0;

  /**
   * Start Arrange phase
   */
  startArrange(testName: string): string {
    this.currentPhase = 'arrange';
    this.indentLevel = 1;

    return this.format('arrange_start', { testName }, {
      type: MessageType.INFO,
      phase: TestPhase.SETUP
    });
  }

  /**
   * Start Act phase
   */
  startAct(actionName: string): string {
    this.currentPhase = 'act';
    this.indentLevel = 1;

    return this.format('action_start', { actionName }, {
      type: MessageType.INFO,
      phase: TestPhase.EXECUTION
    });
  }

  /**
   * Start Assert phase
   */
  startAssert(): string {
    this.currentPhase = 'assert';
    this.indentLevel = 1;

    return this.format('assertion_started', {}, {
      type: MessageType.INFO,
      phase: TestPhase.ASSERTION
    });
  }

  /**
   * Format with current phase context
   */
  formatWithContext(
    key: string,
    context: Record<string, any> = {},
    success: boolean = true
  ): string {
    const indent = '  '.repeat(this.indentLevel);
    const type = success ? MessageType.SUCCESS : MessageType.FAILURE;

    const message = UnitTestMessages.getMessage(key, context);
    return indent + this.format(message, {}, { type });
  }

  /**
   * Format assertion result
   */
  formatAssertion(
    assertion: string,
    actual: any,
    expected: any,
    passed: boolean
  ): string {
    const context = {
      assertion,
      actual: JSON.stringify(actual),
      expected: JSON.stringify(expected)
    };

    if (passed) {
      return this.formatWithContext('assert_equal', context, true);
    } else {
      return this.formatWithContext('assertion_failed', context, false);
    }
  }

  /**
   * Format mock expectation
   */
  formatMockExpectation(
    mockName: string,
    method: string,
    expectedCalls: number,
    actualCalls: number
  ): string {
    const passed = expectedCalls === actualCalls;
    const context = {
      name: mockName,
      method,
      expected: expectedCalls,
      actual: actualCalls
    };

    if (passed) {
      return this.formatWithContext('mock_expectation', { ...context, times: expectedCalls }, true);
    } else {
      return this.formatWithContext('mock_expectation_failed', context, false);
    }
  }

  /**
   * Reset formatter state
   */
  reset(): void {
    this.currentPhase = null;
    this.indentLevel = 0;
  }
}

/**
 * Visual test result formatter
 */
export class VisualTestFormatter {
  private language: Language;
  private useEmoji: boolean;

  constructor(language: Language = Language.EN, useEmoji: boolean = true) {
    this.language = language;
    this.useEmoji = useEmoji;
  }

  /**
   * Create a visual test tree
   */
  createTestTree(suite: {
    name: string;
    tests: Array<{
      name: string;
      status: 'passed' | 'failed' | 'skipped' | 'pending';
      duration?: number;
      error?: string;
    }>;
  }): string {
    const lines: string[] = [];

    // Suite header
    lines.push(chalk.bold.cyan(`📦 ${suite.name}`));
    lines.push('');

    // Test results
    suite.tests.forEach((test, index) => {
      const isLast = index === suite.tests.length - 1;
      const prefix = isLast ? '└──' : '├──';
      const icon = this.getStatusIcon(test.status);
      const color = this.getStatusColor(test.status);

      let line = `${chalk.gray(prefix)} ${icon} `;
      line += color(test.name);

      if (test.duration !== undefined) {
        line += chalk.gray(` (${test.duration}ms)`);
      }

      lines.push(line);

      // Show error details if failed
      if (test.error && test.status === 'failed') {
        const errorPrefix = isLast ? '    ' : '│   ';
        const errorLines = test.error.split('\n');

        errorLines.forEach(errorLine => {
          lines.push(chalk.red(`${errorPrefix}  ${errorLine}`));
        });
      }
    });

    return lines.join('\n');
  }

  /**
   * Create a test matrix visualization
   */
  createTestMatrix(results: Array<{
    suite: string;
    tests: Array<{ name: string; passed: boolean }>;
  }>): string {
    const lines: string[] = [];

    // Find max test count
    const maxTests = Math.max(...results.map(r => r.tests.length));

    // Header
    lines.push(chalk.bold('Test Matrix'));
    lines.push('');

    // Matrix
    results.forEach(suite => {
      let line = chalk.cyan(suite.suite.padEnd(20));

      suite.tests.forEach(test => {
        line += test.passed ? chalk.green('■') : chalk.red('□');
        line += ' ';
      });

      // Fill remaining space
      for (let i = suite.tests.length; i < maxTests; i++) {
        line += chalk.gray('·') + ' ';
      }

      lines.push(line);
    });

    return lines.join('\n');
  }

  /**
   * Create a coverage heatmap
   */
  createCoverageHeatmap(files: Array<{
    name: string;
    coverage: number;
  }>): string {
    const lines: string[] = [];

    lines.push(chalk.bold('Coverage Heatmap'));
    lines.push('');

    files.forEach(file => {
      const blocks = 20;
      const filled = Math.round((file.coverage / 100) * blocks);

      let heatmap = '';
      for (let i = 0; i < blocks; i++) {
        if (i < filled) {
          const intensity = i / blocks;
          if (intensity < 0.33) {
            heatmap += chalk.red('▓');
          } else if (intensity < 0.66) {
            heatmap += chalk.yellow('▓');
          } else {
            heatmap += chalk.green('▓');
          }
        } else {
          heatmap += chalk.gray('░');
        }
      }

      const coverageStr = `${file.coverage}%`.padStart(4);
      const fileName = file.name.padEnd(30);

      lines.push(`${fileName} ${heatmap} ${coverageStr}`);
    });

    return lines.join('\n');
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    if (!this.useEmoji) {
      switch (status) {
        case 'passed': return '[✓]';
        case 'failed': return '[✗]';
        case 'skipped': return '[⊘]';
        case 'pending': return '[⋯]';
        default: return '[ ]';
      }
    }

    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      case 'pending': return '⏸️';
      default: return '❓';
    }
  }

  /**
   * Get status color function
   */
  private getStatusColor(status: string): (text: string) => string {
    switch (status) {
      case 'passed': return chalk.green;
      case 'failed': return chalk.red;
      case 'skipped': return chalk.gray;
      case 'pending': return chalk.yellow;
      default: return (text: string) => text;
    }
  }
}

/**
 * Test report generator
 */
export class TestReportGenerator {
  private formatter: TestMessageFormatter;
  private visualFormatter: VisualTestFormatter;

  constructor(language: Language = Language.EN) {
    this.formatter = new TestMessageFormatter({ language });
    this.visualFormatter = new VisualTestFormatter(language);
  }

  /**
   * Generate a complete test report
   */
  generateReport(data: {
    suites: Array<{
      name: string;
      tests: Array<{
        name: string;
        status: 'passed' | 'failed' | 'skipped' | 'pending';
        duration?: number;
        error?: string;
      }>;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      skipped: number;
      duration: number;
    };
    coverage?: {
      lines: number;
      branches: number;
      functions: number;
      statements: number;
    };
  }): string {
    const sections: string[] = [];

    // Title
    sections.push(chalk.bold.blue('╔══════════════════════════════════════╗'));
    sections.push(chalk.bold.blue('║      TEST EXECUTION REPORT           ║'));
    sections.push(chalk.bold.blue('╚══════════════════════════════════════╝'));
    sections.push('');

    // Timestamp
    sections.push(chalk.gray(`Generated: ${new Date().toISOString()}`));
    sections.push('');

    // Summary
    sections.push(this.formatter.formatSummary(data.summary));

    // Coverage
    if (data.coverage) {
      sections.push('');
      sections.push(chalk.bold('📊 Coverage Report'));
      sections.push('');
      sections.push(this.formatter.format('coverage_summary', data.coverage));
    }

    // Test trees
    sections.push('');
    sections.push(chalk.bold('🧪 Test Results'));
    sections.push('');

    data.suites.forEach(suite => {
      sections.push(this.visualFormatter.createTestTree(suite));
      sections.push('');
    });

    // Failed tests details
    const failedTests = data.suites.flatMap(s =>
      s.tests.filter(t => t.status === 'failed').map(t => ({ ...t, suite: s.name }))
    );

    if (failedTests.length > 0) {
      sections.push('');
      sections.push(chalk.bold.red('❌ Failed Tests Details'));
      sections.push('');

      failedTests.forEach(test => {
        sections.push(this.formatter.formatError({
          test: `${test.suite} › ${test.name}`,
          message: test.error || 'Unknown error',
          stack: undefined,
          expected: undefined,
          actual: undefined
        }));
      });
    }

    // Footer
    sections.push('');
    sections.push(chalk.gray('─'.repeat(60)));
    sections.push(chalk.gray.italic('End of report'));

    return sections.join('\n');
  }
}

// Export components
export default {
  UnitTestCategory,
  UnitTestMessages,
  UnitTestFormatter,
  VisualTestFormatter,
  TestReportGenerator
};