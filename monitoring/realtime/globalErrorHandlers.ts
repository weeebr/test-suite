import { ErrorInterceptor } from './errorInterceptor';

const errorInterceptor = ErrorInterceptor.getInstance();

process.on('uncaughtException', (error: Error) => {
  errorInterceptor.trackError('runtime', error);
});

process.on('unhandledRejection', (reason: any) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  errorInterceptor.trackError('runtime', error);
});

process.on('warning', (warning: Error) => {
  errorInterceptor.trackError('console', warning);
});

process.on('exit', (code: number) => {
  if (code !== 0) {
    const error = new Error(`Process exited with code ${code}`);
    errorInterceptor.trackError('runtime', error);
  }
}); 
