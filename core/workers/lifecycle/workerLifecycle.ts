import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import { TestResult } from '../../state';
import { WorkerMetrics } from '../metrics';
import { ErrorInterceptor } from '../../../monitoring/realtime/errorInterceptor';
import { formatErrorMessage } from '../../../monitoring/realtime/errorFormatter';
import { WorkerEventHandler } from '../handlers/workerEventHandler';
import { WorkerResultHandler } from '../handlers/workerResultHandler';

export class WorkerLifecycle {
  private errorInterceptor: ErrorInterceptor;
  private eventHandler: WorkerEventHandler;
  private resultHandler: WorkerResultHandler;
  private cleanupHandlers = new Set<() => void>();

  constructor(
    private onResult: (result: TestResult) => void,
    private onMetricsUpdate: (metrics: WorkerMetrics) => void
  ) {
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.eventHandler = new WorkerEventHandler(
      this.errorInterceptor,
      this.onResult,
      this.onMetricsUpdate
    );
    this.resultHandler = new WorkerResultHandler();
  }

  async startWorker(
    file: string,
    timeout: number,
    env: Record<string, string>
  ): Promise<{ worker: ChildProcess }> {
    const worker = fork(join(__dirname, '../../worker.js'), [], { env });
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
        this.eventHandler.handleMessage(result);
        finalize(result);
        resolve({ worker });
      });

      worker.on('error', (error) => {
        this.eventHandler.handleError(worker, error, file);
        finalize(this.resultHandler.createErrorResult(file, error, 'ERR_WORKER'));
        resolve({ worker });
      });

      const timeoutId = setTimeout(() => {
        this.eventHandler.handleTimeout(worker, file);
        worker.kill('SIGKILL');
        finalize(this.resultHandler.createTimeoutResult(file));
        resolve({ worker });
      }, timeout);

      worker.on('exit', (code, signal) => {
        clearTimeout(timeoutId);
        if (code !== 0 && !isResolved) {
          this.eventHandler.handleExit(worker, code, signal, file);
          finalize(this.resultHandler.createExitResult(file, code, signal));
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
