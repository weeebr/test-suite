import { TestResult } from '../../core/state';
import { TestRunner } from '../../core/runner';
import { defaultConfig } from '../../core/config';
import { join } from 'path';

export async function runTest(): Promise<TestResult> {
  try {
    const runner = new TestRunner({
      ...defaultConfig,
      rootDir: join(__dirname, '../..'),
      targetDirs: ['core'],
      testPattern: /\.test\.ts$/,
      testType: 'frontend'
    });

    // Test file collection and execution
    const results = await runner.runTests();
    
    // Verify we have results
    if (results.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No test results found',
        line: 1
      };
    }

    // Verify all results have a valid group
    const hasInvalidGroup = results.some(r => !r.group || !['core', 'management', 'monitoring', 'validation'].includes(r.group));
    if (hasInvalidGroup) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Found results with invalid group',
        line: 1
      };
    }

    // Verify all results have duration
    const hasMissingDuration = results.some(r => typeof r.duration !== 'number');
    if (hasMissingDuration) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Found results without duration',
        line: 1
      };
    }

    // Verify all core tests are included
    const coreFiles = results.filter(r => r.group === 'core').map(r => r.file);
    const expectedFiles = [
      'runner.test.ts',
      'config.test.ts',
      'state.test.ts'
    ];
    const missingFiles = expectedFiles.filter(f => !coreFiles.some(cf => cf.endsWith(f)));
    if (missingFiles.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Missing core test files: ${missingFiles.join(', ')}`,
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
