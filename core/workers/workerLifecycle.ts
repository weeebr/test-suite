import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import { TestResult } from '../state';
import { WorkerMetrics } from './metrics';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';
import { formatErrorMessage } from '../../monitoring/realtime/errorFormatter';

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
          memoryUsage: 0,
          cpuUsage: 0,
          startTime: Date.now(),
          lastActivity: Date.now(),
          status: 'completed',
          file: 'unknown'
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
            memoryUsage: 0,
            cpuUsage: 0,
            startTime: Date.now(),
            lastActivity: Date.now(),
            status: 'failed',
            file: file || 'unknown'
          });

          this.errorInterceptor.trackError('process', error, {
            message: formatErrorMessage(error, 'process', {
              phase: 'worker_error',
              file,
              workerPid: worker.pid
            })
          });
        }

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
            memoryUsage: 0,
            cpuUsage: 0,
            startTime: Date.now(),
            lastActivity: Date.now(),
            status: 'failed',
            file: file || 'unknown'
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

          finalize({
            file,
            type: 'runtime',
            severity: 'error',
            message: `Worker exited with code ${code}, signal: ${signal}`,
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
          const error = new Error('Worker failed to terminate gracefully');
          this.errorInterceptor.trackError('process', error, {
            message: formatErrorMessage(error, 'process', {
              phase: 'worker_termination',
              workerPid: worker.pid
            })
          });
          worker.kill('SIGKILL');
        }
      }, 1000);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('ESRCH'))) {
        this.errorInterceptor.trackError('process', error as Error, {
          message: formatErrorMessage(error as Error, 'process', {
            phase: 'worker_stop',
            workerPid: worker.pid
          })
        });
      }
    }
  }

  cleanup(): void {
    for (const handler of this.cleanupHandlers) {
      handler();
    }
    this.cleanupHandlers.clear();
  }
} 
