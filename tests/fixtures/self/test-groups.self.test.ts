import { TestResult } from '../../../core/state';
import { TestRunner } from '../../../core/runner';
import { Config, defaultConfig } from '../../../core/config';

async function validateGroupCreation(): Promise<TestResult> {
  const runner = new TestRunner({
    ...defaultConfig,
    targetDirs: ['tests/fixtures/self/samples'],
    testPattern: /\.self\.test\.ts$/,
    testType: 'self'
  });

  try {
    const files = await runner.collectFiles();
    const groups = runner['createTestGroups'](files);

    if (groups.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No test groups created',
        code: 'SELF_TEST_GROUP_CREATION'
      };
    }

    // Verify group properties
    const invalidGroups = groups.filter(g => 
      !g.name || !g.pattern || typeof g.parallel === 'undefined'
    );

    if (invalidGroups.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Invalid group properties detected',
        code: 'SELF_TEST_GROUP_PROPERTIES'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: `Successfully created ${groups.length} test groups`,
      code: 'SELF_TEST_GROUP_SUCCESS'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'SELF_TEST_GROUP_ERROR'
    };
  }
}

async function validateGroupExecution(): Promise<TestResult> {
  const runner = new TestRunner({
    ...defaultConfig,
    targetDirs: ['tests/fixtures/self/samples'],
    testPattern: /\.self\.test\.ts$/,
    testType: 'self',
    parallelization: {
      ...defaultConfig.parallelization,
      maxWorkers: 2
    }
  });

  try {
    const startTime = Date.now();
    const results = await runner.runTests();
    const duration = Date.now() - startTime;

    // Check if tests ran in parallel by comparing duration
    const expectedParallelTime = results.length * 100; // Assuming each test takes ~100ms
    const isParallel = duration < expectedParallelTime;

    if (!isParallel) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Tests did not execute in parallel as expected',
        code: 'SELF_TEST_GROUP_PARALLEL'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: `Successfully executed ${results.length} tests in parallel`,
      code: 'SELF_TEST_GROUP_EXECUTION'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'SELF_TEST_GROUP_ERROR'
    };
  }
}

export async function runTest(): Promise<TestResult[]> {
  return [
    await validateGroupCreation(),
    await validateGroupExecution()
  ];
} 
