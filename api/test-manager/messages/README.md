# Test Message Design System

A comprehensive, multilingual test messaging system for the MAS project, providing beautiful, informative, and consistent test output across all test suites.

## 🎨 Features

### Core Capabilities
- **Multilingual Support**: Full support for English and Japanese (日本語)
- **Rich Formatting**: Colorized output with icons and visual indicators
- **AAA Pattern Support**: Specialized formatters for Arrange-Act-Assert pattern
- **Visual Components**: Test trees, matrices, heatmaps, and progress bars
- **Flexible Templates**: Customizable message templates with context injection
- **Type-Safe**: Full TypeScript support with enums and interfaces

### Message Types
- ✅ **Success Messages**: Green-colored positive outcomes
- ❌ **Failure Messages**: Red-colored test failures
- ⚠️ **Warning Messages**: Yellow-colored warnings
- ℹ️ **Info Messages**: Cyan-colored information
- ⏭️ **Skip Messages**: Gray-colored skipped tests
- ⏸️ **Pending Messages**: Blue-colored pending tests
- 🐛 **Debug Messages**: Gray-colored debug information

## 📦 Installation

```bash
# Install dependencies
npm install chalk

# Import the message system
import {
  TestMessageFormatter,
  UnitTestFormatter,
  VisualTestFormatter,
  TestReportGenerator,
  Language
} from '@mas/test-manager/messages';
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { TestMessageFormatter, Language } from '@mas/test-manager/messages';

// Create a formatter
const formatter = new TestMessageFormatter({
  language: Language.EN,
  useColor: true,
  showTimestamp: true,
  verbose: false
});

// Format messages
console.log(formatter.success('test_passed', {
  name: 'User Login Test',
  duration: 125
}));
// Output: ✓ [2024-01-01T12:00:00.000Z] Test passed: User Login Test (125ms)

console.log(formatter.failure('assertion_failed', {
  expected: 'success',
  actual: 'error'
}));
// Output: ✗ [2024-01-01T12:00:01.000Z] Assertion failed: Expected success, got error
```

### Japanese Language Support

```typescript
const jaFormatter = new TestMessageFormatter({
  language: Language.JA
});

console.log(jaFormatter.success('test_passed', {
  name: 'ユーザーログインテスト',
  duration: 125
}));
// Output: ✓ テスト成功: ユーザーログインテスト (125ms)

console.log(jaFormatter.failure('assertion_failed', {
  expected: '成功',
  actual: 'エラー'
}));
// Output: ✗ アサーション失敗: 期待値 成功、実際値 エラー
```

## 🎯 Unit Test Formatting

### AAA Pattern Support

```typescript
import { UnitTestFormatter } from '@mas/test-manager/messages';

const unitFormatter = new UnitTestFormatter();

// Arrange phase
console.log(unitFormatter.startArrange('Create User Test'));
console.log(unitFormatter.formatWithContext('fixture_load', {
  fixtureName: 'userData'
}));
console.log(unitFormatter.formatWithContext('mock_created', {
  name: 'userRepository'
}));

// Act phase
console.log(unitFormatter.startAct('createUser'));
console.log(unitFormatter.formatWithContext('action_call', {
  method: 'userRepository.create',
  args: '{ name: "John", email: "john@example.com" }'
}));

// Assert phase
console.log(unitFormatter.startAssert());
console.log(unitFormatter.formatAssertion(
  'user.id',
  '12345',
  '12345',
  true
));
```

### Mock and Spy Messages

```typescript
// Mock expectations
console.log(unitFormatter.formatMockExpectation(
  'apiClient',
  'get',
  2,  // expected calls
  2   // actual calls
));
// Output: ✓ Mock expectation: apiClient.get called 2 times

// Spy reports
console.log(unitFormatter.formatWithContext('spy_called', {
  method: 'console.log',
  args: '["Debug message"]'
}));
// Output: ✓ Spy detected call: console.log(["Debug message"])
```

## 📊 Visual Components

### Test Tree Visualization

```typescript
import { VisualTestFormatter } from '@mas/test-manager/messages';

const visualFormatter = new VisualTestFormatter();

const suite = {
  name: 'Authentication Suite',
  tests: [
    { name: 'Login with valid credentials', status: 'passed', duration: 45 },
    { name: 'Login with invalid password', status: 'passed', duration: 32 },
    { name: 'Login with expired token', status: 'failed', duration: 128,
      error: 'Token validation failed' },
    { name: 'Password reset flow', status: 'skipped' }
  ]
};

console.log(visualFormatter.createTestTree(suite));
```

Output:
```
📦 Authentication Suite

├── ✅ Login with valid credentials (45ms)
├── ✅ Login with invalid password (32ms)
├── ❌ Login with expired token (128ms)
│     Token validation failed
└── ⏭️ Password reset flow
```

### Test Matrix

```typescript
const matrixData = [
  {
    suite: 'API Tests',
    tests: [
      { name: 'GET', passed: true },
      { name: 'POST', passed: true },
      { name: 'DELETE', passed: false }
    ]
  },
  {
    suite: 'Integration',
    tests: [
      { name: 'DB', passed: true },
      { name: 'Cache', passed: true },
      { name: 'Queue', passed: true }
    ]
  }
];

console.log(visualFormatter.createTestMatrix(matrixData));
```

Output:
```
Test Matrix

API Tests           ■ ■ □
Integration         ■ ■ ■
```

### Coverage Heatmap

```typescript
const coverageFiles = [
  { name: 'userController.ts', coverage: 92 },
  { name: 'authService.ts', coverage: 85 },
  { name: 'database.ts', coverage: 78 },
  { name: 'utils.ts', coverage: 65 }
];

console.log(visualFormatter.createCoverageHeatmap(coverageFiles));
```

Output:
```
Coverage Heatmap

userController.ts              ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░  92%
authService.ts                 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░  85%
database.ts                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░  78%
utils.ts                       ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░  65%
```

## 📈 Progress Tracking

```typescript
// Create progress bars
const formatter = new TestMessageFormatter();

console.log(formatter.createProgressBar(25, 100, 30));
// Output: [███████░░░░░░░░░░░░░░░░░░░░░░] 25/100 (25%)

console.log(formatter.createProgressBar(75, 100, 30));
// Output: [██████████████████████░░░░░░░] 75/100 (75%)

// Format progress messages
console.log(formatter.format('progress_running', {
  current: 45,
  total: 100
}));
// Output: ℹ Running 45/100 tests...
```

## 📝 Test Reports

### Generate Complete Reports

```typescript
import { TestReportGenerator } from '@mas/test-manager/messages';

const reportGenerator = new TestReportGenerator(Language.EN);

const reportData = {
  suites: [{
    name: 'User Management',
    tests: [
      { name: 'Create user', status: 'passed', duration: 45 },
      { name: 'Update user', status: 'passed', duration: 32 },
      { name: 'Delete user', status: 'failed', duration: 128,
        error: 'Permission denied' }
    ]
  }],
  summary: {
    total: 3,
    passed: 2,
    failed: 1,
    skipped: 0,
    duration: 205
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
```

### Summary Formatting

```typescript
const formatter = new TestMessageFormatter();

const summary = formatter.formatSummary({
  total: 100,
  passed: 85,
  failed: 10,
  skipped: 5,
  duration: 12500
});

console.log(summary);
```

Output:
```
═══════════════════════════════════════════════════════════
TEST RESULTS SUMMARY
═══════════════════════════════════════════════════════════

Total:    100
✓ Passed:   85
✗ Failed:   10
⚠ Skipped: 5
Duration: 12.50s

Pass Rate: [█████████████████████████░░░░░] 85/100 (85%)

❌ 10 tests failed
═══════════════════════════════════════════════════════════
```

## 🔧 Message Builder

For complex, multi-section messages:

```typescript
import { createBuilder, createFormatter } from '@mas/test-manager/messages';

const formatter = createFormatter({ language: Language.EN });
const builder = createBuilder(formatter);

const message = builder
  .addSection('Test Configuration')
  .addLine('Environment: Test')
  .addLine('Parallel: Enabled')
  .addLine('Coverage: Enabled')
  .addEmptyLine()
  .addSection('Test Execution')
  .addMessage('test_started', { name: 'Integration Suite' })
  .addMessage('progress_running', { current: 10, total: 50 })
  .addEmptyLine()
  .addSeparator('=', 40)
  .addSection('Results')
  .addMessage('test_passed', { name: 'All tests', duration: 1250 })
  .build();

console.log(message);
```

## 🎨 Customization

### Custom Message Templates

```typescript
import { TestMessageTemplates, Language } from '@mas/test-manager/messages';

// Add custom messages
const customMessages = {
  custom_start: 'Starting custom process: {process}',
  custom_complete: 'Process {process} completed in {time}ms'
};

// Use custom messages
const message = TestMessageTemplates.format('custom_start', {
  process: 'Data Migration'
}, Language.EN);
```

### Theme Configuration

```typescript
const formatter = new TestMessageFormatter({
  language: Language.EN,
  useColor: true,        // Enable/disable colors
  showTimestamp: true,   // Show timestamps
  verbose: true         // Verbose output with stack traces
});
```

## 📚 Message Categories

### Test Execution
- `test_started`: Test execution began
- `test_passed`: Test completed successfully
- `test_failed`: Test failed
- `test_skipped`: Test was skipped
- `test_pending`: Test is pending

### Assertions
- `assertion_passed`: Assertion succeeded
- `assertion_failed`: Assertion failed
- `assert_equal`: Equality assertion
- `assert_truthy`: Truthy assertion
- `assert_throws`: Exception assertion

### Setup/Teardown
- `setup_started`: Setup phase began
- `setup_completed`: Setup completed
- `teardown_started`: Cleanup began
- `teardown_completed`: Cleanup finished

### Coverage
- `coverage_summary`: Coverage statistics
- `coverage_threshold_passed`: Threshold met
- `coverage_threshold_failed`: Below threshold

### Performance
- `performance_baseline`: Baseline measurement
- `performance_improved`: Performance gain
- `performance_degraded`: Performance loss

## 🌐 Localization

The system supports full localization for all messages:

```typescript
// Switch between languages dynamically
const formatter = new TestMessageFormatter();

// English
formatter.format('test_passed', { name: 'Test', duration: 100 }, {
  language: Language.EN
});

// Japanese
formatter.format('test_passed', { name: 'テスト', duration: 100 }, {
  language: Language.JA
});
```

## 📖 Examples

See the `examples/formatted-test.example.ts` file for comprehensive examples including:
- Session management tests with rich messages
- Japanese language test messages
- Mock and spy message formatting
- Progress and performance reporting
- Visual test matrices

## 🤝 Contributing

To add new message types or languages:

1. Add message templates to `TestMessageTemplates`
2. Update the `Language` enum for new languages
3. Add corresponding translations
4. Update visual components as needed
5. Add examples demonstrating usage

## 📄 License

MIT