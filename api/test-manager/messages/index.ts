/**
 * Test Message Design System
 * Comprehensive test messaging with localization support
 */

import chalk from 'chalk';

/**
 * Message types for different test scenarios
 */
export enum MessageType {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
  INFO = 'info',
  ERROR = 'error',
  SKIP = 'skip',
  PENDING = 'pending',
  DEBUG = 'debug'
}

/**
 * Test phase indicators
 */
export enum TestPhase {
  SETUP = 'setup',
  EXECUTION = 'execution',
  ASSERTION = 'assertion',
  TEARDOWN = 'teardown',
  COMPLETE = 'complete'
}

/**
 * Language support
 */
export enum Language {
  EN = 'en',
  JA = 'ja'
}

/**
 * Message format options
 */
export interface MessageOptions {
  type?: MessageType;
  phase?: TestPhase;
  language?: Language;
  timestamp?: boolean;
  context?: Record<string, any>;
  stackTrace?: boolean;
  verbose?: boolean;
}

/**
 * Test message templates
 */
export class TestMessageTemplates {
  private static messages = {
    en: {
      // Test execution messages
      test_started: 'Test started: {name}',
      test_passed: '✓ Test passed: {name} ({duration}ms)',
      test_failed: '✗ Test failed: {name}',
      test_skipped: '⊘ Test skipped: {name}',
      test_pending: '⋯ Test pending: {name}',

      // Suite messages
      suite_started: 'Test suite started: {suite}',
      suite_completed: 'Test suite completed: {suite} - {passed}/{total} passed ({duration}ms)',
      suite_failed: 'Test suite failed: {suite} - {failed} failures',

      // Assertion messages
      assertion_passed: 'Assertion passed: {description}',
      assertion_failed: 'Assertion failed: Expected {expected}, got {actual}',
      assertion_error: 'Assertion error: {error}',

      // Setup/Teardown messages
      setup_started: 'Setting up test environment...',
      setup_completed: 'Setup completed successfully',
      setup_failed: 'Setup failed: {error}',
      teardown_started: 'Cleaning up test environment...',
      teardown_completed: 'Cleanup completed',
      teardown_failed: 'Cleanup failed: {error}',

      // Coverage messages
      coverage_summary: 'Coverage: {lines}% lines, {branches}% branches, {functions}% functions',
      coverage_threshold_passed: 'Coverage threshold met: {threshold}%',
      coverage_threshold_failed: 'Coverage below threshold: {current}% < {threshold}%',

      // Performance messages
      performance_baseline: 'Performance baseline: {metric} = {value}ms',
      performance_improved: 'Performance improved: {metric} decreased by {improvement}%',
      performance_degraded: 'Performance degraded: {metric} increased by {degradation}%',

      // Error messages
      error_timeout: 'Test timed out after {timeout}ms',
      error_exception: 'Unexpected exception: {message}',
      error_validation: 'Validation error: {details}',
      error_connection: 'Connection error: {target}',

      // Progress messages
      progress_running: 'Running {current}/{total} tests...',
      progress_completed: 'Completed {total} tests in {duration}s',
      progress_remaining: '{remaining} tests remaining',

      // Mock/Stub messages
      mock_created: 'Mock created for: {target}',
      mock_called: 'Mock called: {method} with {args}',
      stub_activated: 'Stub activated: {function}',
      spy_report: 'Spy report: {function} called {count} times'
    },

    ja: {
      // テスト実行メッセージ
      test_started: 'テスト開始: {name}',
      test_passed: '✓ テスト成功: {name} ({duration}ms)',
      test_failed: '✗ テスト失敗: {name}',
      test_skipped: '⊘ テストスキップ: {name}',
      test_pending: '⋯ テスト保留: {name}',

      // スイートメッセージ
      suite_started: 'テストスイート開始: {suite}',
      suite_completed: 'テストスイート完了: {suite} - {passed}/{total} 成功 ({duration}ms)',
      suite_failed: 'テストスイート失敗: {suite} - {failed} 件の失敗',

      // アサーションメッセージ
      assertion_passed: 'アサーション成功: {description}',
      assertion_failed: 'アサーション失敗: 期待値 {expected}、実際値 {actual}',
      assertion_error: 'アサーションエラー: {error}',

      // セットアップ/ティアダウンメッセージ
      setup_started: 'テスト環境のセットアップ中...',
      setup_completed: 'セットアップ完了',
      setup_failed: 'セットアップ失敗: {error}',
      teardown_started: 'テスト環境のクリーンアップ中...',
      teardown_completed: 'クリーンアップ完了',
      teardown_failed: 'クリーンアップ失敗: {error}',

      // カバレッジメッセージ
      coverage_summary: 'カバレッジ: 行 {lines}%、分岐 {branches}%、関数 {functions}%',
      coverage_threshold_passed: 'カバレッジ閾値達成: {threshold}%',
      coverage_threshold_failed: 'カバレッジ閾値未達: {current}% < {threshold}%',

      // パフォーマンスメッセージ
      performance_baseline: 'パフォーマンス基準: {metric} = {value}ms',
      performance_improved: 'パフォーマンス改善: {metric} が {improvement}% 減少',
      performance_degraded: 'パフォーマンス劣化: {metric} が {degradation}% 増加',

      // エラーメッセージ
      error_timeout: 'テストタイムアウト: {timeout}ms',
      error_exception: '予期しない例外: {message}',
      error_validation: 'バリデーションエラー: {details}',
      error_connection: '接続エラー: {target}',

      // 進捗メッセージ
      progress_running: 'テスト実行中 {current}/{total}...',
      progress_completed: '{total} テストを {duration}秒で完了',
      progress_remaining: '残り {remaining} テスト',

      // モック/スタブメッセージ
      mock_created: 'モック作成: {target}',
      mock_called: 'モック呼び出し: {method} 引数: {args}',
      stub_activated: 'スタブ有効化: {function}',
      spy_report: 'スパイレポート: {function} が {count} 回呼ばれました'
    }
  };

  /**
   * Get message template
   */
  static getTemplate(key: string, language: Language = Language.EN): string {
    return this.messages[language][key] || this.messages.en[key] || key;
  }

  /**
   * Format message with context
   */
  static format(key: string, context: Record<string, any> = {}, language: Language = Language.EN): string {
    let message = this.getTemplate(key, language);

    // Replace placeholders with context values
    Object.keys(context).forEach(key => {
      const value = context[key];
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return message;
  }
}

/**
 * Message formatter with styling
 */
export class TestMessageFormatter {
  private language: Language;
  private useColor: boolean;
  private showTimestamp: boolean;
  private verbose: boolean;

  constructor(options: {
    language?: Language;
    useColor?: boolean;
    showTimestamp?: boolean;
    verbose?: boolean;
  } = {}) {
    this.language = options.language || Language.EN;
    this.useColor = options.useColor !== false;
    this.showTimestamp = options.showTimestamp || false;
    this.verbose = options.verbose || false;
  }

  /**
   * Format a test message
   */
  format(
    key: string,
    context: Record<string, any> = {},
    options: MessageOptions = {}
  ): string {
    const type = options.type || MessageType.INFO;
    const phase = options.phase;
    const showTimestamp = options.timestamp !== undefined ? options.timestamp : this.showTimestamp;

    // Get formatted message
    let message = TestMessageTemplates.format(
      key,
      { ...context, ...options.context },
      options.language || this.language
    );

    // Add phase prefix if specified
    if (phase) {
      message = `[${this.getPhaseLabel(phase)}] ${message}`;
    }

    // Add timestamp if enabled
    if (showTimestamp) {
      const timestamp = new Date().toISOString();
      message = `[${timestamp}] ${message}`;
    }

    // Apply color styling if enabled
    if (this.useColor) {
      message = this.applyColor(message, type);
    }

    // Add icon prefix
    message = `${this.getIcon(type)} ${message}`;

    return message;
  }

  /**
   * Format success message
   */
  success(key: string, context: Record<string, any> = {}): string {
    return this.format(key, context, { type: MessageType.SUCCESS });
  }

  /**
   * Format failure message
   */
  failure(key: string, context: Record<string, any> = {}): string {
    return this.format(key, context, { type: MessageType.FAILURE });
  }

  /**
   * Format warning message
   */
  warning(key: string, context: Record<string, any> = {}): string {
    return this.format(key, context, { type: MessageType.WARNING });
  }

  /**
   * Format info message
   */
  info(key: string, context: Record<string, any> = {}): string {
    return this.format(key, context, { type: MessageType.INFO });
  }

  /**
   * Format error message
   */
  error(key: string, context: Record<string, any> = {}): string {
    return this.format(key, context, { type: MessageType.ERROR });
  }

  /**
   * Apply color based on message type
   */
  private applyColor(message: string, type: MessageType): string {
    switch (type) {
      case MessageType.SUCCESS:
        return chalk.green(message);
      case MessageType.FAILURE:
        return chalk.red(message);
      case MessageType.WARNING:
        return chalk.yellow(message);
      case MessageType.INFO:
        return chalk.cyan(message);
      case MessageType.ERROR:
        return chalk.red.bold(message);
      case MessageType.SKIP:
        return chalk.gray(message);
      case MessageType.PENDING:
        return chalk.blue(message);
      case MessageType.DEBUG:
        return chalk.gray(message);
      default:
        return message;
    }
  }

  /**
   * Get icon for message type
   */
  private getIcon(type: MessageType): string {
    if (!this.useColor) return '';

    switch (type) {
      case MessageType.SUCCESS:
        return chalk.green('✓');
      case MessageType.FAILURE:
        return chalk.red('✗');
      case MessageType.WARNING:
        return chalk.yellow('⚠');
      case MessageType.INFO:
        return chalk.cyan('ℹ');
      case MessageType.ERROR:
        return chalk.red('⨯');
      case MessageType.SKIP:
        return chalk.gray('⊘');
      case MessageType.PENDING:
        return chalk.blue('⋯');
      case MessageType.DEBUG:
        return chalk.gray('⚙');
      default:
        return '';
    }
  }

  /**
   * Get phase label
   */
  private getPhaseLabel(phase: TestPhase): string {
    const labels = {
      [TestPhase.SETUP]: this.language === Language.JA ? 'セットアップ' : 'SETUP',
      [TestPhase.EXECUTION]: this.language === Language.JA ? '実行' : 'EXEC',
      [TestPhase.ASSERTION]: this.language === Language.JA ? 'アサート' : 'ASSERT',
      [TestPhase.TEARDOWN]: this.language === Language.JA ? 'クリーンアップ' : 'CLEANUP',
      [TestPhase.COMPLETE]: this.language === Language.JA ? '完了' : 'DONE'
    };

    return labels[phase] || phase;
  }

  /**
   * Create a progress bar
   */
  createProgressBar(current: number, total: number, width: number = 30): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const label = `${current}/${total} (${percentage}%)`;

    if (this.useColor) {
      const color = percentage === 100 ? chalk.green :
                   percentage >= 80 ? chalk.yellow :
                   chalk.red;
      return color(`[${bar}] ${label}`);
    }

    return `[${bar}] ${label}`;
  }

  /**
   * Format a test result summary
   */
  formatSummary(results: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  }): string {
    const lines: string[] = [];
    const passRate = Math.round((results.passed / results.total) * 100);

    // Header
    lines.push('');
    lines.push('═'.repeat(60));
    lines.push(this.language === Language.JA ? 'テスト結果サマリー' : 'TEST RESULTS SUMMARY');
    lines.push('═'.repeat(60));

    // Results
    const labels = this.language === Language.JA ? {
      total: '合計',
      passed: '成功',
      failed: '失敗',
      skipped: 'スキップ',
      duration: '実行時間',
      passRate: '成功率'
    } : {
      total: 'Total',
      passed: 'Passed',
      failed: 'Failed',
      skipped: 'Skipped',
      duration: 'Duration',
      passRate: 'Pass Rate'
    };

    lines.push('');
    lines.push(`${labels.total}:    ${results.total}`);
    lines.push(this.success(`${labels.passed}:   ${results.passed}`, {}));
    if (results.failed > 0) {
      lines.push(this.failure(`${labels.failed}:   ${results.failed}`, {}));
    }
    if (results.skipped > 0) {
      lines.push(this.warning(`${labels.skipped}: ${results.skipped}`, {}));
    }
    lines.push(`${labels.duration}: ${(results.duration / 1000).toFixed(2)}s`);
    lines.push('');

    // Pass rate bar
    lines.push(`${labels.passRate}: ${this.createProgressBar(results.passed, results.total)}`);

    // Status
    lines.push('');
    if (results.failed === 0) {
      lines.push(this.success(
        this.language === Language.JA ? '✨ すべてのテストが成功しました！' : '✨ All tests passed!',
        {}
      ));
    } else {
      lines.push(this.failure(
        this.language === Language.JA ?
          `❌ ${results.failed} 件のテストが失敗しました` :
          `❌ ${results.failed} tests failed`,
        {}
      ));
    }

    lines.push('═'.repeat(60));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Format a detailed error report
   */
  formatError(error: {
    test: string;
    message: string;
    stack?: string;
    expected?: any;
    actual?: any;
  }): string {
    const lines: string[] = [];

    lines.push(this.failure('test_failed', { name: error.test }));
    lines.push('');

    // Error message
    lines.push(chalk.red.bold(this.language === Language.JA ? 'エラー:' : 'Error:'));
    lines.push(chalk.red(error.message));
    lines.push('');

    // Expected vs Actual
    if (error.expected !== undefined && error.actual !== undefined) {
      lines.push(chalk.bold(this.language === Language.JA ? '期待値:' : 'Expected:'));
      lines.push(chalk.green(JSON.stringify(error.expected, null, 2)));
      lines.push('');
      lines.push(chalk.bold(this.language === Language.JA ? '実際値:' : 'Actual:'));
      lines.push(chalk.red(JSON.stringify(error.actual, null, 2)));
      lines.push('');
    }

    // Stack trace
    if (error.stack && this.verbose) {
      lines.push(chalk.gray.bold(this.language === Language.JA ? 'スタックトレース:' : 'Stack Trace:'));
      lines.push(chalk.gray(error.stack));
      lines.push('');
    }

    lines.push('─'.repeat(60));

    return lines.join('\n');
  }
}

/**
 * Test message builder for complex messages
 */
export class TestMessageBuilder {
  private sections: Array<{ title?: string; content: string[] }> = [];
  private formatter: TestMessageFormatter;

  constructor(formatter?: TestMessageFormatter) {
    this.formatter = formatter || new TestMessageFormatter();
  }

  /**
   * Add a section to the message
   */
  addSection(title?: string): this {
    this.sections.push({ title, content: [] });
    return this;
  }

  /**
   * Add content to the current section
   */
  addLine(line: string): this {
    if (this.sections.length === 0) {
      this.addSection();
    }

    const currentSection = this.sections[this.sections.length - 1];
    currentSection.content.push(line);

    return this;
  }

  /**
   * Add a formatted message
   */
  addMessage(key: string, context: Record<string, any> = {}, options: MessageOptions = {}): this {
    const message = this.formatter.format(key, context, options);
    return this.addLine(message);
  }

  /**
   * Add a separator
   */
  addSeparator(char: string = '─', length: number = 60): this {
    return this.addLine(char.repeat(length));
  }

  /**
   * Add empty line
   */
  addEmptyLine(): this {
    return this.addLine('');
  }

  /**
   * Build the final message
   */
  build(): string {
    const lines: string[] = [];

    for (const section of this.sections) {
      if (section.title) {
        lines.push(chalk.bold.underline(section.title));
        lines.push('');
      }

      lines.push(...section.content);
    }

    return lines.join('\n');
  }
}

/**
 * Export convenience functions
 */
export const createFormatter = (options?: any) => new TestMessageFormatter(options);
export const createBuilder = (formatter?: TestMessageFormatter) => new TestMessageBuilder(formatter);

// Default formatter instances
export const defaultFormatter = new TestMessageFormatter();
export const jaFormatter = new TestMessageFormatter({ language: Language.JA });

// Export all components
export default {
  MessageType,
  TestPhase,
  Language,
  TestMessageTemplates,
  TestMessageFormatter,
  TestMessageBuilder,
  createFormatter,
  createBuilder,
  defaultFormatter,
  jaFormatter
};