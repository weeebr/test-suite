import { Worker } from 'worker_threads';
import { TestResult } from '../state';
import { WorkerMetricsManager } from './metrics';

const MAX_MEMORY_PER_WORKER = 512 * 1024 * 1024; // 512MB

export class WorkerMessageHandler {
  constructor(
    private worker: Worker,
    private metricsManager: WorkerMetricsManager,
    private onResult: (result: TestResult) => void,
    private onCleanup: () => void
  ) {
    // Initialize metrics for this worker
    this.metricsManager.updateMetrics(this.worker.threadId, {
      pid: this.worker.threadId,
      memory: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      startTime: Date.now(),
      lastActivity: Date.now(),
      status: 'starting',
      file: 'unknown'
    });
  }

  public setupMessageHandling(timeout: number): void {
    let isResolved = false;
    const cleanup = () => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        this.onCleanup();
      }
    };

    const timeoutId = setTimeout(() => {
      const metrics = this.metricsManager.getMetrics(this.worker.threadId);
      if (metrics) {
        this.onResult({
          file: metrics.file,
          type: 'runtime',
          severity: 'error',
          message: 'Test timed out'
        });
      }
      this.worker.terminate();
      cleanup();
    }, timeout);

    this.worker.on('message', (message: TestResult | { type: 'metrics'; memory: number; cpu: number }) => {
      if ('type' in message && message.type === 'metrics') {
        this.metricsManager.updateMetrics(this.worker.threadId, {
          ...this.metricsManager.getMetrics(this.worker.threadId)!,
          memoryUsage: message.memory,
          cpuUsage: message.cpu,
          lastActivity: Date.now()
        });
        const metrics = this.metricsManager.getMetrics(this.worker.threadId);

        if (metrics && message.memory > MAX_MEMORY_PER_WORKER) {
          this.onResult({
            file: metrics.file,
            type: 'runtime',
            severity: 'error',
            message: `Memory limit exceeded: ${Math.floor(message.memory / (1024 * 1024))}MB > ${MAX_MEMORY_PER_WORKER / (1024 * 1024)}MB`
          });
          this.worker.terminate();
          cleanup();
        }
      } else {
        this.onResult(message as TestResult);
        this.worker.terminate();
        cleanup();
      }
    });

    this.worker.on('error', (error) => {
      const metrics = this.metricsManager.getMetrics(this.worker.threadId);
      this.onResult({
        file: metrics?.file || 'unknown',
        type: 'runtime',
        severity: 'error',
        message: error.message,
        stack: error.stack
      });
      this.worker.terminate();
      cleanup();
    });

    this.worker.on('exit', cleanup);
  }
} 
