import { Worker } from 'worker_threads';
import { join } from 'path';
import { TestSuiteConfig } from '../config';
import { TestResult } from '../state';
import { WorkerMetricsManager } from './metrics';
import { WorkerMessageHandler } from './messageHandler';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';

type ResultCallback = (result: TestResult) => void;
type CompleteCallback = () => void;

const MAX_MEMORY_PER_WORKER = 512 * 1024 * 1024; // 512MB
const WORKER_HEALTH_CHECK_INTERVAL = 5000; // 5 seconds

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: string[] = [];
  private activeWorkers = 0;
  private metricsManager: WorkerMetricsManager;
  private errorInterceptor: ErrorInterceptor;
  private healthCheckInterval?: NodeJS.Timeout;

  public constructor(
    private config: TestSuiteConfig,
    private onResult: ResultCallback,
    private onComplete: CompleteCallback
  ) {
    this.metricsManager = new WorkerMetricsManager();
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.setupHealthCheck();
  }

  private setupHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.workers.forEach(worker => {
        const metrics = this.metricsManager.getMetrics(worker);
        if (!metrics) return;

        if (metrics.memoryUsage > MAX_MEMORY_PER_WORKER) {
          this.errorInterceptor.trackError('runtime', new Error(`Worker exceeded memory limit: ${metrics.file}`));
          this.restartWorker(worker);
        }

        if (Date.now() - metrics.lastActivity > this.config.testTimeout!) {
          this.errorInterceptor.trackError('runtime', new Error(`Worker timed out: ${metrics.file}`));
          this.restartWorker(worker);
        }
      });
    }, WORKER_HEALTH_CHECK_INTERVAL);
  }

  private async restartWorker(worker: Worker): Promise<void> {
    const metrics = this.metricsManager.getMetrics(worker);
    if (!metrics?.file) return;

    this.queue.unshift(metrics.file);
    await worker.terminate();
    
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
      this.activeWorkers--;
    }

    this.metricsManager.deleteMetrics(worker);
    await this.createWorker();
  }

  public async start(files: string[]): Promise<void> {
    this.queue = [...files];
    const workerCount = Math.min(
      this.config.workers || Math.max(1, require('os').cpus().length - 1),
      files.length
    );

    try {
      const promises = Array(workerCount).fill(0).map(() => this.createWorker());
      await Promise.all(promises);

      const maxWaitTime = this.config.testTimeout || 30000;
      const startTime = Date.now();

      while (this.activeWorkers > 0 || this.queue.length > 0) {
        if (Date.now() - startTime > maxWaitTime) {
          this.errorInterceptor.trackError('runtime', new Error('Test suite global timeout'));
          this.stop();
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.cleanup();
      this.onComplete();
    }
  }

  private cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.stop();
  }

  private async createWorker(): Promise<void> {
    if (this.queue.length === 0) return;

    const file = this.queue.shift();
    if (!file) return;

    try {
      const worker = new Worker(join(__dirname, 'worker.js'), {
        workerData: {
          file,
          config: {
            ...this.config,
            compilerOptions: {
              ...this.config.compilerOptions,
              allowJs: true,
              module: 'commonjs',
              esModuleInterop: true,
              moduleResolution: 'node'
            }
          },
          memoryLimit: MAX_MEMORY_PER_WORKER
        },
        resourceLimits: {
          maxOldGenerationSizeMb: MAX_MEMORY_PER_WORKER / (1024 * 1024)
        }
      });

      this.activeWorkers++;
      this.workers.push(worker);
      this.metricsManager.setMetrics(worker, {
        memoryUsage: 0,
        cpuUsage: 0,
        startTime: Date.now(),
        lastActivity: Date.now(),
        file
      });

      const messageHandler = new WorkerMessageHandler(
        worker,
        this.metricsManager,
        this.onResult,
        () => {
          this.activeWorkers--;
          const index = this.workers.indexOf(worker);
          if (index !== -1) {
            this.workers.splice(index, 1);
          }
          this.metricsManager.deleteMetrics(worker);

          if (this.queue.length > 0) {
            this.createWorker();
          }
        }
      );

      messageHandler.setupMessageHandling(this.config.testTimeout || 30000);
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error instanceof Error ? error : new Error(String(error)));
      if (this.queue.length > 0) {
        await this.createWorker();
      }
    }
  }

  public stop(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
    this.activeWorkers = 0;
    this.metricsManager.clear();
  }

  public getMetrics(): { totalMemory: number; averageMemory: number; peakMemory: number } {
    return this.metricsManager.getAggregateMetrics();
  }
}
