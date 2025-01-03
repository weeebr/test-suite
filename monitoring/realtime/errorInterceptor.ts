import { EventEmitter } from 'events';
import { ErrorEvent, ErrorHandler } from './errorTypes';
import { ErrorInfoExtractor } from './errorInfoExtractor';
import { GlobalErrorHandlers } from './globalErrorHandlers';

const MAX_ERROR_HISTORY = 1000;
const ERROR_CLEANUP_INTERVAL = 60000; // 1 minute

export class ErrorInterceptor extends EventEmitter {
  private static instance: ErrorInterceptor;
  private errors: ErrorEvent[] = [];
  private _isHandlingError = false;
  private errorHandlers = new Map<string, ErrorHandler>();
  private cleanupInterval?: NodeJS.Timeout;

  private constructor() {
    super();
    this.setupGlobalHandlers();
    this.setupErrorCleanup();
  }

  public static getInstance(): ErrorInterceptor {
    if (!ErrorInterceptor.instance) {
      ErrorInterceptor.instance = new ErrorInterceptor();
    }
    return ErrorInterceptor.instance;
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') {
      GlobalErrorHandlers.setupNodeHandlers(this);
    } else {
      GlobalErrorHandlers.setupBrowserHandlers(this);
    }
  }

  private setupErrorCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      if (this.errors.length > MAX_ERROR_HISTORY) {
        this.errors = this.errors.slice(-MAX_ERROR_HISTORY);
      }
    }, ERROR_CLEANUP_INTERVAL);
  }

  public registerErrorHandler(type: ErrorEvent['type'], handler: ErrorHandler): void {
    this.errorHandlers.set(type, handler);
  }

  public trackError(type: ErrorEvent['type'], error: Error, additionalContext?: Record<string, unknown>): void {
    if (this._isHandlingError) {
      console.error('Nested error occurred while handling another error:', error);
      return;
    }

    this._isHandlingError = true;
    try {
      const context = { ...ErrorInfoExtractor.extractErrorInfo(error), ...additionalContext };
      const errorEvent: ErrorEvent = {
        type,
        error,
        timestamp: Date.now(),
        context,
        stack: error.stack,
        source: context.source as string,
        line: context.line as number,
        column: context.column as number
      };

      // Add severity based on error type
      const severity = this.calculateErrorSeverity(type);
      errorEvent.context = { ...errorEvent.context, severity };

      // Add impact assessment
      const impact = this.assessErrorImpact(type);
      errorEvent.context = { ...errorEvent.context, impact };

      this.errors.push(errorEvent);

      const handler = this.errorHandlers.get(type);
      if (handler) {
        try {
          handler(error);
        } catch (handlerError) {
          console.error('Error in error handler:', handlerError);
          // Don't rethrow to prevent cascading errors
        }
      } else {
        this.handleUnregisteredError(type, error, errorEvent);
      }

      try {
        this.emit('error', errorEvent);
      } catch (emitError) {
        console.error('Error while emitting error event:', emitError);
      }
    } finally {
      this._isHandlingError = false;
    }
  }

  private calculateErrorSeverity(type: ErrorEvent['type']): 'critical' | 'high' | 'medium' | 'low' {
    switch (type) {
      case 'runtime':
      case 'webpack':
        return 'critical';
      case 'network':
      case 'module':
        return 'high';
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
      case 'lint':
        return 'Code quality issues detected';
      default:
        return 'Unknown impact';
    }
  }

  private handleUnregisteredError(type: ErrorEvent['type'], error: Error, errorEvent: ErrorEvent): void {
    const errorMessage = `${type.toUpperCase()} Error: ${error.message}`;
    const locationInfo = errorEvent.source 
      ? `\nLocation: ${errorEvent.source}:${errorEvent.line}:${errorEvent.column}`
      : '';
    const stackTrace = error.stack 
      ? `\nStack Trace:\n${error.stack}`
      : '';

    console.error(`${errorMessage}${locationInfo}${stackTrace}`);
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

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.removeAllListeners();
    this.clearErrors();
  }
} 
