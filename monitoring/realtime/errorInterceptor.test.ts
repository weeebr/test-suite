import { ErrorInterceptor } from './errorInterceptor';
import { TestResult } from '../../core/state';

export async function runTest(): Promise<TestResult> {
  try {
    const errorInterceptor = ErrorInterceptor.getInstance();
    errorInterceptor.clearErrors();

    // Test 1: Runtime error tracking
    try {
      throw new Error('Test runtime error');
    } catch (error) {
      if (error instanceof Error) {
        errorInterceptor.trackError('runtime', error);
      }
    }

    const runtimeErrors = errorInterceptor.getErrorsByType('runtime');
    if (runtimeErrors.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Runtime error tracking failed'
      };
    }

    if (!runtimeErrors[0].stack || !runtimeErrors[0].source) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error stack trace extraction failed'
      };
    }

    // Test 2: Custom error handler
    let handlerCalled = false;
    errorInterceptor.registerErrorHandler('lint', () => {
      handlerCalled = true;
    });

    errorInterceptor.trackError('lint', new Error('Test lint error'));

    if (!handlerCalled) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Custom error handler not called'
      };
    }

    // Test 3: Error context
    const context = {
      source: 'test.ts',
      line: 42,
      column: 10
    };

    errorInterceptor.trackError('module', new Error('Test module error'), context);

    const moduleErrors = errorInterceptor.getErrorsByType('module');
    if (moduleErrors.length === 0 || !moduleErrors[0].source || moduleErrors[0].line !== 42) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error context tracking failed'
      };
    }

    // Test 4: Error event emission
    let eventEmitted = false;
    errorInterceptor.once('error', () => {
      eventEmitted = true;
    });

    errorInterceptor.trackError('network', new Error('Test network error'));

    if (!eventEmitted) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error event emission failed'
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
      message: error instanceof Error ? error.message : String(error)
    };
  }
} 
