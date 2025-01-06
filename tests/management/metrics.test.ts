import { TestResult } from '../../core/state';
import { TestStateManager } from '../../core/state';

export async function runTest(): Promise<TestResult> {
  try {
    const state = new TestStateManager();

    // Initialize test groups
    state.initializeGroup('test-group', ['test1.ts', 'test2.ts']);

    // Complete some tests
    state.completeTest('test-group', 'test1.ts', {
      file: 'test1.ts',
      type: 'runtime',
      severity: 'info',
      message: 'Test passed'
    });

    state.completeTest('test-group', 'test2.ts', {
      file: 'test2.ts',
      type: 'runtime',
      severity: 'error',
      message: 'Test failed'
    });

    // Get progress
    const progress = state.getProgress();
    if (progress.completed !== 2 || progress.total !== 2) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Invalid progress metrics: ${JSON.stringify(progress)}`,
        code: 'ERR_METRICS'
      };
    }

    // Get results
    const results = state.getResults();
    if (results.length !== 2) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Invalid results count: ${results.length}`,
        code: 'ERR_METRICS'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Metrics test passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'ERR_TEST_FAILED'
    };
  }
} 
