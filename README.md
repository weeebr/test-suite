# Test Suite

A lightweight, state-aware TypeScript test runner that tracks file changes and only runs tests on modified files.

## Features

- 🚀 Fast parallel test execution
- 🔍 Real-time error interception
- 📊 Performance metrics collection
- 🔄 Hot reload support
- 🎯 Frontend/Backend test separation
- 📈 Coverage reporting
- 🛠 Extensive configuration options

## Installation

```bash
yarn add test-suite
```

## Quick Start

1. Add to your project:

```typescript
// test.config.ts
import { TestSuiteConfig } from 'test-suite';

export default {
  rootDir: __dirname,
  targetDirs: ['src'],
  testPattern: /\.test\.ts$/,
  collectCoverage: true
} as TestSuiteConfig;
```

2. Create a test file:

```typescript
// calculator.frontend.test.ts
export async function runTest() {
  return {
    file: __filename,
    type: 'type',
    severity: 'info',
    message: 'Test passed'
  };
}
```

3. Run tests:

```bash
yarn test:frontend  # Run frontend tests (includes linting, coverage, and performance metrics)
yarn test:backend   # Run backend tests (includes linting, coverage, and performance metrics)
yarn test:watch    # Run tests in watch mode
```

Each test command automatically includes:
- Linting with ESLint
- Coverage reporting with NYC
- Performance metrics collection
- Type checking

## Configuration

### Test Types

- Frontend Tests: `*.frontend.test.ts`
- Backend Tests: `*.backend.test.ts`
- Self Tests: `tests/*.test.ts`

### Performance Monitoring

```typescript
{
  performance: {
    memoryLimit: 512 * 1024 * 1024, // 512MB
    timeoutLimit: 30000, // 30 seconds
    resourceLimit: 0.8 // 80% CPU usage
  }
}
```

### Coverage Thresholds

```typescript
{
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

## API Reference

### TestRunner

```typescript
import { TestRunner } from 'test-suite';

const runner = new TestRunner({
  rootDir: __dirname,
  targetDirs: ['src'],
  testType: 'frontend'
});

const results = await runner.runTests();
```

### Error Interception

```typescript
import { ErrorInterceptor } from 'test-suite';

const interceptor = ErrorInterceptor.getInstance();
interceptor.on('error', (event) => {
  console.log(`Error: ${event.error.message}`);
});
```

### Performance Monitoring

```typescript
import { BuildMonitor } from 'test-suite';

const monitor = BuildMonitor.getInstance();
monitor.on('buildEvent', (event) => {
  console.log(`Build ${event.type}: ${event.message}`);
});
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests: `yarn test`
4. Submit a pull request

## License

MIT 
