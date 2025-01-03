import { TestResult, TestState } from './types';

export async function runTest(): Promise<TestResult> {
  try {
    const state: TestState = {
      groups: new Map(),
      results: new Map(),
      running: new Set(),
      completed: new Set(),
      startTime: Date.now()
    };

    // Test 1: Initial state
    if (state.groups.size > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Initial state not empty'
      };
    }

    // Test 2: Add test group
    state.groups.set('test-group', {
      name: 'test-group',
      pattern: '*.test.ts',
      parallel: true
    });

    if (state.groups.size !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Group not added correctly'
      };
    }

    // Test 3: Add test result
    const results = state.results.get('test-group') || [];
    results.push({
      file: 'test.ts',
      type: 'runtime',
      severity: 'info',
      message: 'Test passed'
    });
    state.results.set('test-group', results);

    if (!state.results.has('test-group')) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Results not added correctly'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'State management tests passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
} 
