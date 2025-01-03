# Test Suite

A parallel-first, TypeScript-native test runner with granular test grouping and comprehensive state management for frontend, backend, and self-test scenarios.

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

## Integration with External Projects

### Quick Start

```bash
# Install the package
npm install @cursor/test-suite

# Run tests with auto-detection
npx cursor-test --integration

# Watch mode
npx cursor-test --integration --watch
```

### Project Auto-Detection

The test suite automatically detects your project type and configures itself accordingly:

- React projects: Detects React and sets up for component testing
- Node.js projects: Configures for backend testing
- TypeScript projects: Uses your tsconfig.json
- JavaScript projects: Works out of the box

### Configuration

Create a `cursor-test.config.js` in your project root (optional):

```typescript
module.exports = {
  // Override auto-detected settings
  testPattern: /\.spec\.(ts|js)$/,
  targetDirs: ['tests'],
  
  // Performance settings
  parallelization: {
    enabled: true,
    maxWorkers: 4,
    testTimeout: 5000
  },
  
  // Output settings
  outputFormat: 'junit',
  outputFile: 'test-results.xml'
};
```

### Supported Test Types

- Unit tests: `*.test.ts`, `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`
- Frontend tests: `*.frontend.test.ts`
- Backend tests: `*.backend.test.ts` 

## Usage

### As a Package Dependency

1. Install the package:
```bash
yarn add @cursor/test-suite
```

2. Add scripts to your package.json:
```json
{
  "scripts": {
    "test": "test-suite test",
    "test:watch": "test-suite test --watch",
    "test:auto": "test-suite test --auto",
    "test:auto:watch": "test-suite test --auto --watch"
  }
}
```

### Using npx (without installation)

```bash
# Run with auto-detection
npx @cursor/test-suite test --auto

# Watch mode
npx @cursor/test-suite test --auto --watch
```

### Auto-Detection

The `--auto` flag enables automatic detection of:
- Project type (React/Node.js/TypeScript/JavaScript)
- Test directories
- File patterns
- TypeScript configuration

The test suite will configure itself based on your project structure:
- React projects: Sets up for component testing
- Node.js projects: Configures for backend testing
- TypeScript projects: Uses your tsconfig.json
- JavaScript projects: Works out of the box

### Configuration

Create a `test-suite.config.js` in your project root (optional):

```typescript
module.exports = {
  // Override auto-detected settings
  testPattern: /\.spec\.(ts|js)$/,
  targetDirs: ['tests'],
  
  // Performance settings
  parallelization: {
    enabled: true,
    maxWorkers: 4,
    testTimeout: 5000
  },
  
  // Output settings
  outputFormat: 'junit',
  outputFile: 'test-results.xml'
}; 

### Example Configurations

#### React Project
```typescript
// test-suite.config.js
module.exports = {
  testPattern: {
    test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    unit: /\.unit\.(test|spec)\.(ts|tsx|js|jsx)$/,
    integration: /\.integration\.(test|spec)\.(ts|tsx|js|jsx)$/
  },
  targetDirs: [
    'src/**/__tests__',
    'src/**/*.test.*',
    'tests'
  ],
  parallelization: {
    enabled: true,
    maxWorkers: 4,
    testTimeout: 10000
  }
};
```

#### Node.js Project
```typescript
// test-suite.config.js
module.exports = {
  testPattern: {
    test: /\.(test|spec)\.(ts|js)$/,
    unit: /\.unit\.(test|spec)\.(ts|js)$/,
    integration: /\.integration\.(test|spec)\.(ts|js)$/
  },
  targetDirs: [
    'src/**/__tests__',
    'tests',
    'api/**/*.test.*'
  ],
  parallelization: {
    enabled: true,
    maxWorkers: 2,
    testTimeout: 30000
  },
  outputFormat: 'junit'
};
```

### Supported Config Formats
- `test-suite.config.js`
- `test-suite.config.ts`
- `.test-suiterc.js`
- `.test-suiterc.json` 
