import { EventEmitter } from 'events';
import { ErrorEvent } from './errorTypes';

export class ErrorInterceptor extends EventEmitter {
  private static instance: ErrorInterceptor;
  private errors: ErrorEvent[] = [];
  private _isHandlingError = false;
  private errorHandlers = new Map<ErrorEvent['type'], (error: Error) => void>();

  private constructor() {
    super();
    this.setupErrorHandlers();
  }

  public static getInstance(): ErrorInterceptor {
    if (!ErrorInterceptor.instance) {
      ErrorInterceptor.instance = new ErrorInterceptor();
    }
    return ErrorInterceptor.instance;
  }

  private setupErrorHandlers(): void {
    process.on('uncaughtException', (error: Error) => {
      this.trackError('runtime', error);
    });

    process.on('unhandledRejection', (reason: any) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.trackError('runtime', error);
    });

    process.on('warning', (warning: Error) => {
      this.trackError('console', warning);
    });

    process.on('exit', (code: number) => {
      if (code !== 0) {
        const error = new Error(`Process exited with code ${code}`);
        this.trackError('runtime', error);
      }
    });
  }

  public registerErrorHandler(type: ErrorEvent['type'], handler: (error: Error) => void): void {
    this.errorHandlers.set(type, handler);
  }

  public trackError(type: ErrorEvent['type'], error: Error, context?: Record<string, any>): void {
    this._isHandlingError = true;

    const handler = this.errorHandlers.get(type);
    if (handler) {
      handler(error);
    }

    const severity = this.calculateErrorSeverity(type);
    const impact = this.assessErrorImpact(type);

    const errorEvent: ErrorEvent = {
      type,
      error,
      timestamp: Date.now(),
      context: {
        ...context,
        stack: error.stack,
        source: error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[1] || 'unknown',
        line: parseInt(error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[2] || '0'),
        column: parseInt(error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[3] || '0'),
        severity,
        impact
      },
      stack: error.stack,
      source: error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[1] || 'unknown',
      line: parseInt(error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[2] || '0'),
      column: parseInt(error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[3] || '0')
    };

    this.errors.push(errorEvent);
    this.emit('error', errorEvent);
    this._isHandlingError = false;
  }

  private calculateErrorSeverity(type: ErrorEvent['type']): 'critical' | 'high' | 'medium' | 'low' {
    switch (type) {
      case 'runtime':
      case 'webpack':
        return 'critical';
      case 'network':
      case 'module':
      case 'typescript':
        return 'high';
      case 'console':
      case 'lint':
        return 'medium';
      default:
        return 'low';
    }
  }

  private assessErrorImpact(type: ErrorEvent['type']): string {
    switch (type) {
      case 'runtime':
        return 'Application execution halted';
      case 'webpack':
        return 'Build process failed';
      case 'network':
        return 'Network communication disrupted';
      case 'module':
        return 'Module functionality unavailable';
      case 'typescript':
        return 'Type checking failed';
      case 'console':
        return 'Console error detected';
      case 'lint':
        return 'Code quality issues detected';
      default:
        return 'Unknown impact';
    }
  }

  public isHandlingError(): boolean {
    return this._isHandlingError;
  }

  public getErrors(): ErrorEvent[] {
    return this.errors;
  }

  public clearErrors(): void {
    this.errors = [];
  }

  public getErrorCount(): number {
    return this.errors.length;
  }

  public getErrorsByType(type: ErrorEvent['type']): ErrorEvent[] {
    return this.errors.filter(e => e.type === type);
  }

  public getErrorsBySeverity(severity: string): ErrorEvent[] {
    return this.errors.filter(e => e.context?.severity === severity);
  }
} 
