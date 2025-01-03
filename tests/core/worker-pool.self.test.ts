import { TestResult } from '../../core/state';
import { WorkerPool } from '../../core/workers/pool';
import { defaultConfig } from '../../core/config';

async function validateWorkerCreation(): Promise<TestResult> {
  const results: TestResult[] = [];
  const pool = new WorkerPool(
    {
      ...defaultConfig,
      parallelization: {
        ...defaultConfig.parallelization,
        maxWorkers: 2
      }
    },
    (result: TestResult) => results.push(result),
    () => {}
  );

  try {
    await pool.start(['tests/fixtures/passing.test.ts']);
    const metrics = pool.getMetrics();

    if (metrics.totalMemory === 0 || metrics.averageMemory === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Worker metrics not collected',
        code: 'SELF_TEST_WORKER_METRICS'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: `Worker pool successfully managed ${results.length} tests`,
      code: 'SELF_TEST_WORKER_POOL'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'SELF_TEST_WORKER_ERROR'
    };
  } finally {
    pool.stop();
  }
}

async function validateWorkerRecovery(): Promise<TestResult> {
  const results: TestResult[] = [];
  const pool = new WorkerPool(
    {
      ...defaultConfig,
      parallelization: {
        ...defaultConfig.parallelization,
        maxWorkers: 2,
        testTimeout: 1000
      }
    },
    (result) => results.push(result),
    () => {}
  );

  try {
    await pool.start(['tests/fixtures/hanging.test.ts']);
    
    const hasTimeoutError = results.some(r => 
      r.type === 'runtime' && r.code === 'ERR_TIMEOUT'
    );

    return {
      file: __filename,
      type: 'runtime',
      severity: hasTimeoutError ? 'info' : 'error',
      message: hasTimeoutError ? 
        'Worker pool successfully handled timeout' : 
        'Worker pool failed to handle timeout',
      code: 'SELF_TEST_WORKER_RECOVERY'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'SELF_TEST_WORKER_ERROR'
    };
  } finally {
    pool.stop();
  }
}

export async function runTest(): Promise<TestResult[]> {
  return [
    await validateWorkerCreation(),
    await validateWorkerRecovery()
  ];
} 
