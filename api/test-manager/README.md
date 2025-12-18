# MAS Test Manager

A unified test orchestration and management system for the MAS (Multi-Agent System) project, providing seamless integration between TypeScript/Vitest tests and Bash script tests.

## Features

### Core Capabilities
- **Unified Test Runner**: Single interface for running all test types (unit, integration, E2E, performance)
- **Multi-Language Support**: Handles both TypeScript/Vitest and Bash script tests
- **Real-time Dashboard**: Web-based dashboard for monitoring test execution and results
- **Comprehensive Utilities**: Test helpers, assertions, fixtures, and mock services
- **CI/CD Integration**: GitHub Actions workflows with automated reporting
- **Performance Testing**: Built-in benchmarking and performance regression detection
- **Coverage Reporting**: Code coverage with multiple output formats

### Test Types Supported
- **API Unit Tests**: TypeScript unit tests using Vitest
- **API Integration Tests**: HTTP endpoint and service integration tests
- **Shell Script Tests**: Bash-based system and integration tests
- **E2E Tests**: Full end-to-end workflow validation
- **Performance Tests**: Load testing and performance benchmarking

## Installation

```bash
# Install in the API directory
cd api
npm install

# Link the test manager globally (optional)
npm link ./test-manager

# Or use directly with npx
npx mas-test --help
```

## Usage

### CLI Commands

```bash
# Run all tests
mas-test run

# Run specific test suites
mas-test run -s api-unit api-integration

# Run tests in parallel
mas-test run --parallel

# Generate coverage report
mas-test run --coverage

# Watch mode
mas-test watch

# List available test suites
mas-test list

# Show test statistics
mas-test stats

# Run tests in CI mode
mas-test ci --coverage
```

### Programmatic Usage

```typescript
import { testManager, TestRunOptions } from '@mas/test-manager';

// Run tests programmatically
const options: TestRunOptions = {
  suites: ['api-unit', 'api-integration'],
  coverage: true,
  parallel: true,
  reporter: 'json'
};

const results = await testManager.run(options);
console.log(`Passed: ${results.filter(r => r.status === 'passed').length}`);
```

### Test Utilities

```typescript
import {
  TestFactory,
  TestHelpers,
  TestAssertions,
  MockServices
} from '@mas/test-manager/utils';

// Create test data
const session = TestFactory.createSession({
  sessionId: 'test-001',
  status: 'active'
});

// Use test helpers
await TestHelpers.waitFor(() => isReady, 5000);
await TestHelpers.retry(() => fetchData(), 3);

// Assert conditions
TestAssertions.assertSchema(data, SessionSchema);
await TestAssertions.assertTmuxSession('test-session');

// Use mock services
const tmux = MockServices.mockTmux();
await tmux.createSession('test');
```

### Test Fixtures

```typescript
import {
  SessionFixtures,
  MockDataGenerator,
  FixtureLoader
} from '@mas/test-manager/fixtures';

// Use predefined fixtures
const activeSession = SessionFixtures.activeSession;
const failedRun = RunFixtures.failedRun;

// Generate random test data
const session = MockDataGenerator.generateSession();
const batch = MockDataGenerator.generateBatch({
  sessions: 10,
  agentsPerSession: 3,
  runsPerSession: 5
});

// Load fixtures by name
const fixture = FixtureLoader.load('activeSession');
```

## Test Dashboard

Start the web dashboard for real-time test monitoring:

```bash
# Start dashboard server
npm run dashboard

# Open in browser
open http://localhost:3001
```

### Dashboard Features
- Real-time test execution monitoring
- Test results visualization
- Coverage metrics
- Historical test trends
- Performance benchmarks
- Failure analysis

## Test Organization

```
mas/
├── api/
│   ├── tests/                 # API integration tests
│   │   └── sessions.test.ts
│   ├── **/*.test.ts          # Unit tests (colocated)
│   └── test-manager/          # Test management system
│       ├── index.ts          # Core test manager
│       ├── cli.ts            # CLI interface
│       ├── utils.ts          # Test utilities
│       ├── fixtures.ts       # Test fixtures
│       └── dashboard.ts      # Web dashboard
├── tests/                     # Shell script tests
│   ├── test_simple.sh
│   ├── test_e2e.sh
│   ├── test_http_server.sh
│   └── test_performance.sh
└── .github/
    └── workflows/
        └── ci.yml            # CI/CD configuration
```

## Writing Tests

### TypeScript/Vitest Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestFactory, TestHelpers } from '@mas/test-manager/utils';

describe('Session Management', () => {
  let testSession: any;

  beforeAll(async () => {
    testSession = TestFactory.createSession();
  });

  afterAll(async () => {
    await TestHelpers.cleanup({
      tmuxSessions: [testSession.tmuxSession]
    });
  });

  it('should create a new session', async () => {
    const response = await fetch('/sessions', {
      method: 'POST',
      body: JSON.stringify(testSession)
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.sessionId).toBe(testSession.sessionId);
  });
});
```

### Shell Script Tests

```bash
#!/bin/bash

# Source test utilities
source ./test_utils.sh

# Test function
test_session_creation() {
    local session_id="test-$$"

    # Create session
    output=$(create_session "$session_id")

    # Assert session exists
    assert_tmux_session_exists "$session_id"

    # Cleanup
    cleanup_session "$session_id"
}

# Run test
run_test "Session Creation" test_session_creation
```

## CI/CD Integration

The test manager includes comprehensive GitHub Actions workflows:

1. **Unit Tests**: Run on multiple Node.js versions
2. **Integration Tests**: Run with real services (PostgreSQL, tmux)
3. **E2E Tests**: Full system validation
4. **Performance Tests**: Scheduled nightly runs
5. **Coverage Reports**: Automated coverage tracking with Codecov
6. **PR Comments**: Automatic test result comments on pull requests

### Example GitHub Action

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd api && npm ci
      - run: npx mas-test ci --coverage
      - uses: codecov/codecov-action@v3
```

## Configuration

### Test Manager Configuration

Create `test-manager.config.json` in your project root:

```json
{
  "suites": {
    "custom-suite": {
      "name": "Custom Test Suite",
      "type": "vitest",
      "path": "./custom-tests",
      "pattern": "**/*.spec.ts"
    }
  },
  "coverage": {
    "threshold": {
      "lines": 80,
      "branches": 75,
      "functions": 80,
      "statements": 80
    }
  },
  "reporters": ["console", "json", "html"],
  "parallel": true,
  "timeout": 30000
}
```

### Environment Variables

```bash
# Test environment
export NODE_ENV=test
export API_PORT=3000
export LOG_LEVEL=debug

# Coverage settings
export COVERAGE=true
export COVERAGE_REPORTER=html

# CI settings
export CI=true
export GITHUB_TOKEN=xxx
```

## Performance Testing

The test manager includes built-in performance testing capabilities:

```typescript
import { PerformanceUtils } from '@mas/test-manager/utils';

// Benchmark a function
const results = await PerformanceUtils.benchmark(
  () => processData(),
  100 // iterations
);

console.log(`Mean: ${results.mean}ms`);
console.log(`P95: ${results.median}ms`);

// Assert performance thresholds
PerformanceUtils.mark('operation-start');
await heavyOperation();
PerformanceUtils.assertPerformance('operation-start', 1000); // max 1s
```

## Troubleshooting

### Common Issues

1. **Tmux sessions not cleaning up**
   ```bash
   # Manual cleanup
   tmux kill-server
   ```

2. **Port conflicts in tests**
   ```bash
   # Use dynamic ports
   export API_PORT=0  # Random available port
   ```

3. **Coverage not generating**
   ```bash
   # Ensure coverage dependencies are installed
   npm install -D @vitest/coverage-v8
   ```

## Contributing

1. Write tests for new features
2. Ensure all tests pass: `mas-test run`
3. Maintain coverage above 80%
4. Update fixtures for new data structures
5. Document test utilities and helpers

## License

MIT