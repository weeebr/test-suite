import { ErrorInterceptor } from './errorInterceptor';
import { ConsoleError } from './errorTypes';

export function interceptConsoleError(error: ConsoleError): void {
  const errorInterceptor = ErrorInterceptor.getInstance();
  
  const context: Record<string, unknown> = {
    level: error.level,
    args: error.args,
    timestamp: error.timestamp
  };

  errorInterceptor.trackError('console', error, {
    context,
    source: error.source,
    line: error.line,
    column: error.column
  });
}

export function setupConsoleErrorHandling(): void {
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  function createConsoleProxy(level: ConsoleError['level']): (...args: unknown[]) => void {
    return function(...args: unknown[]): void {
      const error = new Error(args.map(arg => String(arg)).join(' ')) as ConsoleError;
      error.name = 'ConsoleError';
      error.level = level;
      error.timestamp = Date.now();
      error.args = args;

      const stackLines = error.stack?.split('\n') || [];
      const callerLine = stackLines[2] || ''; // Skip Error and proxy function frames
      const match = callerLine.match(/at\s+.*\s+\(?(.*):(\d+):(\d+)\)?/);
      
      if (match) {
        error.source = match[1];
        error.line = parseInt(match[2], 10);
        error.column = parseInt(match[3], 10);
      }

      interceptConsoleError(error);
      originalConsole[level].apply(console, args);
    };
  }

  console.error = createConsoleProxy('error');
  console.warn = createConsoleProxy('warn');
  console.info = createConsoleProxy('info');
  console.debug = createConsoleProxy('debug');
}

export function restoreConsole(): void {
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };

  Object.assign(console, originalConsole);
} 
