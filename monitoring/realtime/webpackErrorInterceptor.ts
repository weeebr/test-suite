import { ErrorInterceptor } from './errorInterceptor';
import { WebpackError } from './errorTypes';

export function interceptWebpackError(error: WebpackError): void {
  const errorInterceptor = ErrorInterceptor.getInstance();
  
  const context: Record<string, unknown> = {
    moduleId: error.moduleId || error.module?.id,
    chunkName: error.chunk?.name,
    dependencies: error.module?.dependencies?.map(d => d.request),
    issuer: error.module?.issuer,
    details: error.details
  };

  errorInterceptor.trackError('webpack', error, {
    context,
    source: error.file,
    line: error.loc?.line,
    column: error.loc?.column
  });
}

export function setupWebpackErrorHandling(compiler: any): void {
  compiler.hooks.failed.tap('WebpackErrorInterceptor', (error: Error) => {
    interceptWebpackError(error as WebpackError);
  });

  compiler.hooks.compilation.tap('WebpackErrorInterceptor', (compilation: any) => {
    compilation.hooks.failedModule.tap('WebpackErrorInterceptor', 
      (module: any, error: Error) => {
        const webpackError = error as WebpackError;
        webpackError.module = module;
        interceptWebpackError(webpackError);
      }
    );

    compilation.hooks.chunkAsset.tap('WebpackErrorInterceptor', 
      (chunk: any, file: string) => {
        compilation.errors.forEach((error: Error) => {
          const webpackError = error as WebpackError;
          if (!webpackError.chunk) {
            webpackError.chunk = { name: chunk.name };
          }
          if (!webpackError.file) {
            webpackError.file = file;
          }
          interceptWebpackError(webpackError);
        });
      }
    );
  });
} 
