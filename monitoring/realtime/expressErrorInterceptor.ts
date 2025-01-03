import { ErrorInterceptor } from './errorInterceptor';
import { ExpressError } from './errorTypes';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export function interceptExpressError(error: ExpressError, req?: Request): void {
  const errorInterceptor = ErrorInterceptor.getInstance();
  
  const context: Record<string, unknown> = {
    status: error.status || error.statusCode,
    path: error.path || req?.path,
    method: error.method || req?.method,
    headers: error.headers || req?.headers,
    route: error.route || req?.route?.path,
    type: error.type,
    syscall: error.syscall
  };

  errorInterceptor.trackError('express', error, {
    context,
    source: req?.url,
    statusCode: error.status || error.statusCode
  });
}

export function expressErrorHandler(): ErrorRequestHandler {
  return (error: Error, req: Request, _res: Response, next: NextFunction): void => {
    const expressError = error as ExpressError;
    interceptExpressError(expressError, req);
    next(error);
  };
}

export function setupExpressErrorHandling(app: any): void {
  app.use(expressErrorHandler());
  
  // Catch unhandled errors
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const expressError = error as ExpressError;
    const statusCode = expressError.status || expressError.statusCode || 500;
    
    res.status(statusCode).json({
      error: {
        message: expressError.message,
        status: statusCode,
        type: expressError.type || 'UnhandledError'
      }
    });
  });
} 
