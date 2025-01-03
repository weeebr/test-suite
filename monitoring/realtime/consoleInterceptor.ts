import { ErrorInterceptor } from './errorInterceptor';
import { ErrorCategory, ErrorContext } from './types';

export class ConsoleInterceptor {
  private static instance: ConsoleInterceptor;
  private errorInterceptor: ErrorInterceptor;
  private originalConsole: Record<string, (...args: any[]) => void>;

  private constructor() {
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.originalConsole = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
    this.setupInterceptors();
  }

  public static getInstance(): ConsoleInterceptor {
    if (!ConsoleInterceptor.instance) {
      ConsoleInterceptor.instance = new ConsoleInterceptor();
    }
    return ConsoleInterceptor.instance;
  }

  private setupInterceptors(): void {
    console.error = (...args: any[]) => {
      if (
        (typeof args[0] === 'string' && args[0] === '❌ [ErrorInterceptor]') ||
        (typeof args[0] === 'object' && args[0]?.type === 'console')
      ) {
        return;
      }

      if (
        typeof args[0] === 'string' && (
          args[0].startsWith('❌ ') ||
          args[0].startsWith('✅ ') ||
          args[0].startsWith('🧪 ')
        )
      ) {
        this.originalConsole.error(...args);
        return;
      }

      this.trackConsoleMessage('error', args);
      this.originalConsole.error(...args);
    };

    console.warn = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('test')) {
        this.originalConsole.warn(...args);
        return;
      }
      this.trackConsoleMessage('warning', args);
      this.originalConsole.warn(...args);
    };

    console.info = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('test')) {
        this.originalConsole.info(...args);
        return;
      }
      this.trackConsoleMessage('info', args);
      this.originalConsole.info(...args);
    };

    console.debug = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('test')) {
        this.originalConsole.debug(...args);
        return;
      }
      this.trackConsoleMessage('info', args);
      this.originalConsole.debug(...args);
    };
  }

  private trackConsoleMessage(severity: 'info' | 'warning' | 'error', args: any[]): void {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg :
      arg instanceof Error ? arg.message :
      JSON.stringify(arg)
    ).join(' ');

    const error = args.find(arg => arg instanceof Error) as Error | undefined;
    const context: ErrorContext = {
      category: 'console' as ErrorCategory,
      severity,
      source: 'console',
      timestamp: Date.now(),
      details: {
        originalArgs: args,
        hasError: !!error,
        stack: error?.stack
      }
    };

    this.errorInterceptor.trackError('console', new Error(message), context);
  }

  public restore(): void {
    Object.entries(this.originalConsole).forEach(([key, fn]) => {
      (console as any)[key] = fn;
    });
  }
} 
