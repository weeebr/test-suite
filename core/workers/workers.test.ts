import { TestResult } from '../state';
import { WorkerPool } from './pool';
import { defaultConfig } from '../config';
import { join } from 'path';

export async function runTest(): Promise<TestResult> {
  try {
    const results: TestResult[] = [];
    const pool = new WorkerPool(
      {
        ...defaultConfig,
        rootDir: join(__dirname, '../..')
      },
      (result: TestResult) => {
        results.push(result);
      },
      () => {
        // Completion callback
      }
    );

    // Test worker pool initialization
    if (!pool) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Failed to initialize worker pool',
        line: 1
      };
    }

    // Test file processing
    await pool.start(['examples/test-files/calculator.test.ts']);

    if (results.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No test results from worker pool',
        line: 1
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Worker pool tests passed',
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
