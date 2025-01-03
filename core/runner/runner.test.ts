import { TestResult } from '../state';
import { TestRunner } from './index';
import { defaultConfig } from '../config';
import { join } from 'path';

export async function runTest(): Promise<TestResult> {
  try {
    const runner = new TestRunner({
      ...defaultConfig,
      rootDir: join(__dirname, '../..'),
      targetDirs: ['examples/test-files'],
      testPattern: /\.test\.(ts|tsx)$/,
      testType: 'all'
    });

    // Test file collection
    const files = await runner.collectFiles();
    if (files.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No test files found',
        line: 1
      };
    }

    // Test execution
    const results = await runner.runTests();
    if (results.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No test results',
        line: 1
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Runner tests passed',
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
