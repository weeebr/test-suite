import { ChildProcess } from 'child_process';
import { join } from 'path';
import { Config } from '../config';
import { TestResult } from '../state';
import { WorkerLifecycle } from './workerLifecycle';
import { WorkerMetricsManager, WorkerStatus } from './metrics';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';
import { formatErrorMessage } from '../../monitoring/realtime/errorFormatter';

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
    this.onResult(result);
    this.updateMetrics();
  }

  private handleMetricsUpdate(metrics: { pid: number; memory: number; startTime: number; status: WorkerStatus }): void {
    try {
      const enhancedMetrics = {
        ...metrics,
        memoryUsage: metrics.memory || 0,
        cpuUsage: 0,
        lastActivity: metrics.startTime || Date.now(),
        file: 'unknown'
      };
      this.metricsManager.updateMetrics(metrics.pid, enhancedMetrics);
      this.updateMetrics();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('ENOENT')) {
        this.errorInterceptor.trackError('memory', error, {
          message: formatErrorMessage(error, 'memory', {
            phase: 'metrics_update',
            metrics
          })
        });
      }
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
      this.errorInterceptor.trackError('process', error as Error, {
        message: formatErrorMessage(error as Error, 'process', {
          phase: 'pool_start',
          metrics: { fileCount: files.length }
        })
      });
      throw error;
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

      if (worker.pid) {
        const metrics = {
          pid: worker.pid,
          memory: process.memoryUsage().heapUsed,
          memoryUsage: process.memoryUsage().heapUsed,
          cpuUsage: 0,
          startTime: Date.now(),
          lastActivity: Date.now(),
          status: 'starting' as const,
          file: 'unknown'
        };
        this.metricsManager.updateMetrics(metrics.pid, metrics);
      }
    } catch (error) {
      if (error instanceof Error && !error.message.includes('ENOENT')) {
        this.errorInterceptor.trackError('process', error, {
          message: formatErrorMessage(error, 'process', {
            phase: 'worker_start',
            file
          })
        });
      }
      throw error;
    }
  }

  stop(): void {
    this.isShuttingDown = true;
    for (const worker of this.workers.values()) {
      this.lifecycle.stopWorker(worker);
    }
    this.cleanup();
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
      if (error instanceof Error && !error.message.includes('ENOENT')) {
        this.errorInterceptor.trackError('memory', error, {
          message: formatErrorMessage(error, 'memory', {
            phase: 'metrics_aggregation'
          })
        });
      }
    }
  }

  getMetrics(): { totalMemory: number; averageMemory: number; workerStatuses: Record<string, number> } {
    try {
      return this.metricsManager.getAggregateMetrics();
    } catch (error) {
      if (error instanceof Error && !error.message.includes('ENOENT')) {
        this.errorInterceptor.trackError('memory', error, {
          message: formatErrorMessage(error, 'memory', {
            phase: 'metrics_retrieval'
          })
        });
      }
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
