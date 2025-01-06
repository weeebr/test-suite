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

    // Get results
    const results = state.getResults();
    if (results.length !== 2) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Invalid results count: ${results.length}`,
        code: 'ERR_STATE'
      };
    }

    // Verify results
    const passed = results.filter(r => r.severity === 'info').length;
    const failed = results.filter(r => r.severity === 'error').length;
    if (passed !== 1 || failed !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Invalid result counts - passed: ${passed}, failed: ${failed}`,
        code: 'ERR_STATE'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'State test passed'
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
