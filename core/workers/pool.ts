import { ChildProcess } from 'child_process';
import { join } from 'path';
import { Config } from '../config';
import { TestResult } from '../state';
import { WorkerLifecycle } from './workerLifecycle';
import { WorkerMetricsManager, WorkerStatus } from './metrics';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';

export class WorkerPool {
  private workers: Map<string, ChildProcess> = new Map();
  private metricsManager: WorkerMetricsManager;
  private lifecycle: WorkerLifecycle;
  private errorInterceptor: ErrorInterceptor;
  private isShuttingDown: boolean = false;

  constructor(
    private config: Config,
    private onResult: (result: TestResult) => void,
    private onMetrics: (metrics: { totalMemory: number; averageMemory: number }) => void
  ) {
    this.metricsManager = new WorkerMetricsManager();
    this.lifecycle = new WorkerLifecycle(
      this.handleResult.bind(this),
      this.handleMetricsUpdate.bind(this)
    );
    this.errorInterceptor = ErrorInterceptor.getInstance();

    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
    process.on('exit', () => this.cleanup());
  }

  private handleResult(result: TestResult): void {
    try {
      this.onResult(result);
      this.updateMetrics();
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        phase: 'result_handling',
        result
      });
    }
  }

  private handleMetricsUpdate(metrics: { pid: number; memory: number; startTime: number; status: WorkerStatus }): void {
    try {
      this.metricsManager.updateMetrics(metrics.pid, metrics);
      this.updateMetrics();
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        phase: 'metrics_update',
        metrics
      });
    }
  }

  async start(files: string[]): Promise<void> {
    try {
      const maxWorkers = this.config.parallelization?.maxWorkers || 1;
      const chunks = this.chunkArray(files, maxWorkers);

      for (const chunk of chunks) {
        if (this.isShuttingDown) break;
        const promises = chunk.map(file => this.startWorker(file));
        await Promise.all(promises);
      }
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        phase: 'pool_start',
        fileCount: files.length
      });
      throw error; // Re-throw to notify caller
    }
  }

  private async startWorker(file: string): Promise<void> {
    if (this.isShuttingDown) return;

    try {
      const env = { 
        ...process.env, 
        TS_NODE_PROJECT: join(process.cwd(), 'tsconfig.json'),
        TEST_TIMEOUT: String(this.config.parallelization?.testTimeout || 30000)
      };

      const { worker } = await this.lifecycle.startWorker(
        file,
        this.config.parallelization?.testTimeout || 30000,
        env
      );

      this.workers.set(file, worker);
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        phase: 'worker_start',
        file
      });
      throw error;
    }
  }

  stop(): void {
    try {
      this.isShuttingDown = true;
      for (const worker of this.workers.values()) {
        this.lifecycle.stopWorker(worker);
      }
      this.cleanup();
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        phase: 'pool_stop'
      });
    }
  }

  private cleanup(): void {
    this.workers.clear();
    this.metricsManager.clear();
    this.lifecycle.cleanup();
  }

  private updateMetrics(): void {
    try {
      const { totalMemory, averageMemory } = this.metricsManager.getAggregateMetrics();
      this.onMetrics({ totalMemory, averageMemory });
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        phase: 'metrics_aggregation'
      });
    }
  }

  getMetrics(): { totalMemory: number; averageMemory: number; workerStatuses: Record<string, number> } {
    try {
      return this.metricsManager.getAggregateMetrics();
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        phase: 'metrics_retrieval'
      });
      return { totalMemory: 0, averageMemory: 0, workerStatuses: {} };
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
