import { EventEmitter } from 'events';
import { ErrorEvent, ErrorCategory, BaseErrorContext } from './types';

export class ErrorInterceptor extends EventEmitter {
  private static instance: ErrorInterceptor;
  private errors: ErrorEvent[] = [];
  private _isHandlingError = false;
  private errorHandlers = new Map<ErrorCategory, (error: Error) => void>();
  private recursionCount = 0;
  private readonly MAX_RECURSION = 3;

  private constructor() {
    super();
    this.setupErrorHandlers();
    this.setupErrorEventHandler();
  }

  public static getInstance(): ErrorInterceptor {
    if (!ErrorInterceptor.instance) {
      ErrorInterceptor.instance = new ErrorInterceptor();
    }
    return ErrorInterceptor.instance;
  }

  private createErrorEvent(type: ErrorCategory, error: Error, context?: BaseErrorContext): ErrorEvent {
    const source = error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[1] || 'unknown';
    const timestamp = Date.now();

    return {
      type,
      error,
      context: {
        severity: context?.severity || 'error',
        source: context?.source || source,
        details: {
          stack: error.stack,
          ...context?.details
        },
        ...context
      },
      timestamp,
      source,
      stack: error.stack,
      line: parseInt(error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[2] || '0'),
      column: parseInt(error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[3] || '0')
    };
  }

  private logInternalError(type: ErrorCategory, error: Error, context?: BaseErrorContext): void {
    const errorEvent = this.createErrorEvent(type, error, context);
    console.error('❌ [ErrorInterceptor]', {
      type: errorEvent.type,
      message: errorEvent.error.message,
      source: errorEvent.source,
      context: errorEvent.context
    });
  }

  private setupErrorEventHandler(): void {
    this.on('error', (errorEvent: ErrorEvent) => {
      if (this.recursionCount >= this.MAX_RECURSION) {
        this.logInternalError('internal', new Error('Max error recursion reached'), {
          severity: 'error',
          details: { originalError: errorEvent }
        });
        return;
      }

      this.recursionCount++;
      try {
        this.handleErrorEvent(errorEvent);
      } finally {
        this.recursionCount--;
      }
    });
  }

  private handleErrorEvent(errorEvent: ErrorEvent): void {
    if (this._isHandlingError) return;

    this._isHandlingError = true;
    try {
      this.errors.push(errorEvent);
      
      const handler = this.errorHandlers.get(errorEvent.type);
      if (handler) {
        handler(errorEvent.error);
      } else {
        this.logInternalError(errorEvent.type, errorEvent.error, errorEvent.context);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logInternalError('internal', err, {
        severity: 'error',
        details: { phase: 'error_handling' }
      });
    } finally {
      this._isHandlingError = false;
    }
  }

  public trackError(type: ErrorCategory, error: Error, context?: BaseErrorContext): void {
    const errorEvent = this.createErrorEvent(type, error, context);
    this.emit('error', errorEvent);
  }

  private setupErrorHandlers(): void {
    process.on('uncaughtException', (error: Error) => {
      if (!this._isHandlingError) {
        this.trackError('uncaught', error, {
          severity: 'error',
          details: { phase: 'process' }
        });
      }
    });
  }

  public registerErrorHandler(type: ErrorCategory, handler: (error: Error) => void): void {
    this.errorHandlers.set(type, handler);
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

  public getErrorsByType(type: ErrorCategory): ErrorEvent[] {
    return this.errors.filter(e => e.type === type);
  }

  public getErrorsBySeverity(severity: string): ErrorEvent[] {
    return this.errors.filter(e => e.context.severity === severity);
  }
} 
