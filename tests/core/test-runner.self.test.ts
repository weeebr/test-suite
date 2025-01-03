import { TestResult } from '../../core/state';
import { FileValidator } from '../../core/runner/fileValidator';
import { Config, defaultConfig } from '../../core/config';
import { TestRunner } from '../../core/runner';

async function validateFilePatternMatching(): Promise<TestResult> {
  const testCases = [
    { file: 'test.self.test.ts', expected: true },
    { file: 'test.frontend.test.ts', expected: false },
    { file: 'test.backend.test.ts', expected: false }
  ];

  const validator = new FileValidator(defaultConfig);
  const failures = testCases.filter(({ file, expected }) =>
    validator.isValidFile(file) !== expected);

  return {
    file: __filename,
    type: 'runtime',
    severity: failures.length ? 'error' : 'info',
    message: failures.length ? 
      `Pattern matching failed for: ${failures.map(f => f.file).join(', ')}` :
      'Pattern matching validation passed',
    code: 'SELF_TEST_PATTERN_MATCHING'
  };
}

async function validateParallelization(): Promise<TestResult> {
  const config: Config = {
    ...defaultConfig,
    parallelization: {
      ...defaultConfig.parallelization,
      maxWorkers: 2
    }
  };

  const runner = new TestRunner(config);
  const startTime = Date.now();
  await runner.runTests();
  const duration = Date.now() - startTime;

  return {
    file: __filename,
    type: 'runtime',
    severity: 'info',
    message: `Parallelization test completed in ${duration}ms`,
    code: 'SELF_TEST_PARALLELIZATION'
  };
}

export async function runTest(): Promise<TestResult[]> {
  return [
    await validateFilePatternMatching(),
    await validateParallelization()
  ];
} 
