import { TestResult } from '../../core/state';

function add(a: number, b: number): number {
  return a + b;
}

function subtract(a: number, b: number): number {
  return a - b;
}

export async function runTest(): Promise<TestResult> {
  try {
    // Test addition
    if (add(2, 3) !== 5) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Addition test failed',
        line: 1
      };
    }

    // Test subtraction
    if (subtract(5, 3) !== 2) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Subtraction test failed',
        line: 1
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Calculator tests passed',
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
