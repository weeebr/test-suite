import { TestResult } from '../../core/state';
import { TestRunner } from '../../core/runner';
import { defaultConfig } from '../../core/config';

export async function runTest(): Promise<TestResult> {
  try {
    const runner = new TestRunner(defaultConfig);
    const files = await runner.collectFiles();
    const groups = runner.groupFiles(files);

    // Verify group structure
    const invalidGroups = groups.filter(g =>
      !g.name || !g.files || !Array.isArray(g.files)
    );

    if (invalidGroups.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Invalid group structure:\n${JSON.stringify(invalidGroups, null, 2)}`,
        code: 'ERR_RUNNER'
      };
    }

    // Run tests
    const results = await runner.runTests();
    if (results.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No test results returned',
        code: 'ERR_RUNNER'
      };
    }

    // Verify results
    const passed = results.filter(r => r.severity === 'info').length;
    const failed = results.filter(r => r.severity === 'error').length;
    if (passed === 0 && failed === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No test results with valid severity',
        code: 'ERR_RUNNER'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Runner test passed'
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
