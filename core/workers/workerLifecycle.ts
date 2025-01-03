import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import { TestResult } from '../state';
import { WorkerMetrics } from './metrics';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';

export class WorkerLifecycle {
  private errorInterceptor: ErrorInterceptor;
  private cleanupHandlers = new Set<() => void>();

  constructor(
    private onResult: (result: TestResult) => void,
    private onMetricsUpdate: (metrics: WorkerMetrics) => void
  ) {
    this.errorInterceptor = ErrorInterceptor.getInstance();
  }

  async startWorker(
    file: string,
    timeout: number,
    env: Record<string, string>
  ): Promise<{ worker: ChildProcess }> {
    const worker = fork(join(__dirname, 'worker.js'), [], { env });
    let isResolved = false;

    const cleanup = () => {
      if (worker.pid) {
        this.onMetricsUpdate({
          pid: worker.pid,
          memory: 0,
          startTime: Date.now(),
          status: 'completed'
        });
      }
      this.cleanupHandlers.delete(cleanup);
    };

    this.cleanupHandlers.add(cleanup);

    return new Promise<{ worker: ChildProcess }>(resolve => {
      const finalize = (result: TestResult) => {
        if (isResolved) return;
        isResolved = true;
        cleanup();
        this.onResult(result);
      };

      worker.on('message', (result: TestResult) => {
        finalize(result);
        resolve({ worker });
      });

      worker.on('error', (error) => {
        if (worker.pid) {
          this.onMetricsUpdate({
            pid: worker.pid,
            memory: 0,
            startTime: Date.now(),
            status: 'failed'
          });
        }

        this.errorInterceptor.trackError('runtime', error, {
          file,
          workerPid: worker.pid,
          phase: 'worker_execution'
        });

        finalize({
          file,
          type: 'runtime',
          severity: 'error',
          message: error.message,
          code: 'ERR_WORKER',
          stack: error.stack
        });
        resolve({ worker });
      });

      const timeoutId = setTimeout(() => {
        if (worker.pid) {
          this.onMetricsUpdate({
            pid: worker.pid,
            memory: 0,
            startTime: Date.now(),
            status: 'failed'
          });
        }

        const timeoutError = new Error('Worker timed out');
        this.errorInterceptor.trackError('runtime', timeoutError, {
          file,
          workerPid: worker.pid,
          phase: 'worker_timeout',
          timeout
        });

        worker.kill('SIGKILL');
        finalize({
          file,
          type: 'runtime',
          severity: 'error',
          message: 'Worker timed out',
          code: 'ERR_TIMEOUT'
        });
        resolve({ worker });
      }, timeout);

      worker.on('exit', (code, signal) => {
        clearTimeout(timeoutId);
        if (code !== 0 && !isResolved) {
          const exitError = new Error(`Worker exited with code ${code}, signal: ${signal}`);
          this.errorInterceptor.trackError('runtime', exitError, {
            file,
            workerPid: worker.pid,
            phase: 'worker_exit',
            code,
            signal
          });

          finalize({
            file,
            type: 'runtime',
            severity: 'error',
            message: exitError.message,
            code: 'ERR_WORKER_EXIT'
          });
        }
        cleanup();
      });

      worker.send(file);
    });
  }

  stopWorker(worker: ChildProcess): void {
    try {
      worker.kill('SIGTERM');
      setTimeout(() => {
        if (worker.connected) {
          this.errorInterceptor.trackError('runtime', new Error('Worker failed to terminate gracefully'), {
            workerPid: worker.pid,
            phase: 'worker_termination'
          });
          worker.kill('SIGKILL');
        }
      }, 1000);
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        workerPid: worker.pid,
        phase: 'worker_stop'
      });
    }
  }

  cleanup(): void {
    for (const handler of this.cleanupHandlers) {
      handler();
    }
    this.cleanupHandlers.clear();
  }
} 
