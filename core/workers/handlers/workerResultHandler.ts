import { TestResult } from '../../state';
import { formatTestError } from '../../../monitoring/realtime/error/testErrorFormatter';

export class WorkerResultHandler {
  createErrorResult(file: string, error: Error, code: string): TestResult {
    const result: TestResult = {
      file,
      type: 'runtime',
      severity: 'error',
      message: error.message,
      code,
      stack: error.stack
    };
    console.error(formatTestError(result));
    return result;
  }

  createTimeoutResult(file: string): TestResult {
    const result: TestResult = {
      file,
      type: 'runtime',
      severity: 'error',
      message: 'Worker timed out',
      code: 'ERR_TIMEOUT'
    };
    console.error(formatTestError(result));
    return result;
  }

  createExitResult(file: string, code: number | null, signal: string | null): TestResult {
    const result: TestResult = {
      file,
      type: 'runtime',
      severity: 'error',
      message: `Worker exited with code ${code}, signal: ${signal}`,
      code: 'ERR_WORKER_EXIT'
    };
    console.error(formatTestError(result));
    return result;
  }
} 
