import { ChildProcess } from 'child_process';
import { TestResult } from '../../state';
import { ErrorInterceptor } from '../../../monitoring/realtime/errorInterceptor';
import { formatErrorMessage } from '../../../monitoring/realtime/errorFormatter';
import { WorkerMetrics } from '../metrics';

export class WorkerEventHandler {
  constructor(
    private errorInterceptor: ErrorInterceptor,
    private onResult: (result: TestResult) => void,
    private onMetricsUpdate: (metrics: WorkerMetrics) => void
  ) {}

  handleMessage(result: TestResult): void {
    this.onResult(result);
  }

  handleError(worker: ChildProcess, error: Error, file: string): void {
    if (worker.pid) {
      this.onMetricsUpdate({
        pid: worker.pid,
        memory: process.memoryUsage().heapUsed,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        startTime: Date.now(),
        lastActivity: Date.now(),
        status: 'failed',
        file: 'unknown'
      });

      this.errorInterceptor.trackError('process', error, {
        message: formatErrorMessage(error, 'process', {
          phase: 'worker_error',
          file,
          workerPid: worker.pid
        })
      });
    }
  }

  handleTimeout(worker: ChildProcess, file: string): void {
    if (worker.pid) {
      this.onMetricsUpdate({
        pid: worker.pid,
        memory: process.memoryUsage().heapUsed,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        startTime: Date.now(),
        lastActivity: Date.now(),
        status: 'failed',
        file: 'unknown'
      });

      this.errorInterceptor.trackError('process', new Error('Worker timed out'), {
        message: formatErrorMessage(new Error('Worker timed out'), 'process', {
          phase: 'worker_timeout',
          file,
          workerPid: worker.pid,
          code: 'ERR_TIMEOUT'
        })
      });
    }
  }

  handleExit(worker: ChildProcess, code: number | null, signal: string | null, file: string): void {
    if (code !== null && code > 128) {
      const error = new Error(`Worker terminated with signal ${signal}`);
      this.errorInterceptor.trackError('process', error, {
        message: formatErrorMessage(error, 'process', {
          phase: 'worker_exit',
          file,
          workerPid: worker.pid,
          code,
          signal: signal || undefined
        })
      });
    }
  }
} 
