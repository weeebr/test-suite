import { TestResult, TestState } from '../../../core/state';

export async function runTest(): Promise<TestResult> {
  try {
    const state = new TestState();

    // Test result tracking
    const testResult: TestResult = {
      file: 'test.ts',
      type: 'runtime',
      severity: 'error',
      message: 'Test error'
    };

    state.addResult(testResult);
    const results = state.getResults();

    if (results.length !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Result count mismatch',
        line: 1
      };
    }

    // Test summary
    const summary = state.getSummary();
    if (summary.totalFiles !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Total files count mismatch',
        line: 1
      };
    }

    if (summary.failedFiles !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Failed files count mismatch',
        line: 1
      };
    }

    // Test clear
    state.clear();
    if (state.getResults().length !== 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Clear failed',
        line: 1
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'State tests passed',
      line: 1
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      line: 1
    };
  }
} 
