import { TestResult } from '../../core/state';

function add(a: number, b: number): number {
  return a + b;
}

export async function runTest(): Promise<TestResult> {
  try {
    const result = add(2, 3);
    const passed = result === 5;

    return {
      file: __filename,
      type: 'runtime',
      severity: passed ? 'info' : 'error',
      message: passed ? 'Frontend example test passed' : 'Frontend example test failed',
      line: 1,
      column: 1
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      line: 1,
      column: 1
    };
  }
} 
