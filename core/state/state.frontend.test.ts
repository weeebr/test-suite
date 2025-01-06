import { TestResult, TestState } from './types';

export async function runTest(): Promise<TestResult> {
  try {
    const state: TestState = {
      groups: {},
      completedTests: 0,
      totalTests: 0,
      startTime: Date.now()
    };

    // Test initial state
    if (Object.keys(state.groups).length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Initial state should be empty'
      };
    }

    // Test group management
    state.groups['test-group'] = {
      name: 'test-group',
      files: ['test.ts'],
      results: []
    };

    if (Object.keys(state.groups).length !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Failed to add group'
      };
    }

    // Test result management
    const testResult: TestResult = {
      file: 'test.ts',
      type: 'runtime',
      severity: 'info',
      message: 'Test passed'
    };

    state.groups['test-group'].results.push(testResult);

    if (!state.groups['test-group']) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Failed to store test result'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'State management test passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
  }
} 
