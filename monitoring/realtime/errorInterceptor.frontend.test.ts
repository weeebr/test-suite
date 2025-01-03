import { TestResult } from '../../core/state';
import { ErrorInterceptor } from './errorInterceptor';

export async function runTest(): Promise<TestResult> {
  try {
    const interceptor = ErrorInterceptor.getInstance();
    interceptor.clearErrors();

    // Test error tracking
    const testError = new Error('Test error');
    interceptor.trackError('runtime', testError);

    const errors = interceptor.getErrors();
    if (errors.length !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error tracking failed',
        code: 'ERR_TRACKING'
      };
    }

    // Test error handler
    let handlerCalled = false;
    interceptor.registerErrorHandler('module', () => {
      handlerCalled = true;
    });

    interceptor.trackError('module', new Error('Test handler'));
    if (!handlerCalled) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error handler not called',
        code: 'ERR_HANDLER'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Error interceptor tests passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'ERR_UNEXPECTED'
    };
  }
} 
