import { TestResult } from '../../core/state';
import { WorkerPool } from '../../core/workers/pool';
import { defaultConfig } from '../../core/config';

export async function runTest(): Promise<TestResult> {
  let pool: WorkerPool | undefined;
  
  try {
    pool = new WorkerPool(
      {
        ...defaultConfig,
        parallelization: {
          ...defaultConfig.parallelization,
          maxWorkers: 2
        }
      },
      (result) => console.log(result),
      (metrics) => console.log(metrics)
    );

    await pool.start(['tests/fixtures/self/samples/passing.self.test.ts']);
    const metrics = pool.getMetrics();

    if (metrics.totalMemory === 0 || metrics.averageMemory === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Worker metrics not collected'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Worker pool test passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  } finally {
    pool?.stop();
  }
} 
