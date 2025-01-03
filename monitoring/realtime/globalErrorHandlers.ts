import { NodeJSError } from './errorTypes';
import { ErrorInterceptor } from './errorInterceptor';

export class GlobalErrorHandlers {
  public static setupNodeHandlers(errorInterceptor: ErrorInterceptor): void {
    process.on('uncaughtException', (error: Error) => {
      if (!errorInterceptor.isHandlingError()) {
        if (error.message.includes('Cannot find module')) {
          errorInterceptor.trackError('module', error);
        } else {
          errorInterceptor.trackError('runtime', error);
        }
      }
    });

    process.on('unhandledRejection', (error: Error) => {
      if (!errorInterceptor.isHandlingError()) {
        if (error.message.includes('Cannot find module')) {
          errorInterceptor.trackError('module', error);
        } else {
          errorInterceptor.trackError('runtime', error);
        }
      }
    });

    process.on('warning', (warning: Error) => {
      if (warning.name === 'NetworkError' && !errorInterceptor.isHandlingError()) {
        errorInterceptor.trackError('network', warning);
      }
    });

    const originalExit = process.exit;
    process.exit = ((code?: number): never => {
      if (code !== 0 && !errorInterceptor.isHandlingError()) {
        const error = new Error(`Process exited with code ${code}`);
        errorInterceptor.trackError('runtime', error);
      }
      return originalExit(code) as never;
    }) as (code?: number) => never;

    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function(path: string) {
      try {
        return originalRequire.call(this, path);
      } catch (error: unknown) {
        if (error instanceof Error && (error as NodeJSError).code === 'MODULE_NOT_FOUND') {
          errorInterceptor.trackError('module', error);
          return {};
        }
        throw error;
      }
    };
  }

  public static setupBrowserHandlers(errorInterceptor: ErrorInterceptor): void {
    window.onerror = (_message: string | Event, _source?: string, _line?: number, _column?: number, error?: Error) => {
      if (!errorInterceptor.isHandlingError() && error) {
        errorInterceptor.trackError('runtime', error);
      }
      return false;
    };

    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      if (!errorInterceptor.isHandlingError()) {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        errorInterceptor.trackError('runtime', error);
      }
    };
  }
} 
