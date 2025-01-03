import { TestResult } from '@/core/state';
import { TestStateManager } from '@/core/state';

export async function runTest(): Promise<TestResult> {
  try {
    const state = new TestStateManager();

    // Test result tracking
    const testResult: TestResult = {
      file: 'test.ts',
      type: 'runtime',
      severity: 'info',
      message: 'Test passed'
    };

    state.addGroup({ name: 'test', pattern: '*.test.ts' });
    state.startTest('test', 'test.ts');
    state.completeTest('test', 'test.ts', testResult);
    const results = state.getAllResults();

    if (results.length !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Expected 1 test result'
      };
    }

    state.finalize();
    const finalResults = state.getAllResults();
    if (finalResults.length !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Expected 1 test result after finalize'
      };
    }

    // Create a new state manager to test cleanup
    const newState = new TestStateManager();
    const cleanResults = newState.getAllResults();
    if (cleanResults.length !== 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Expected no results in new state'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Test state management passed'
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
