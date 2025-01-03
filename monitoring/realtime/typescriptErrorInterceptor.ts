import { ErrorInterceptor } from './errorInterceptor';
import { TypeScriptError } from './errorTypes';

export function interceptTypeScriptError(error: TypeScriptError): void {
  const errorInterceptor = ErrorInterceptor.getInstance();
  
  const context: Record<string, unknown> = {
    code: error.code,
    category: error.category,
    messageText: error.messageText,
    relatedInformation: error.relatedInformation
  };

  errorInterceptor.trackError('typescript', error, {
    context,
    source: error.file,
    line: error.line,
    column: error.column
  });
}

export function setupTypeScriptErrorHandling(languageService: any): void {
  const originalGetDiagnostics = languageService.getSemanticDiagnostics;
  
  languageService.getSemanticDiagnostics = function(fileName: string) {
    const diagnostics = originalGetDiagnostics.call(this, fileName);
    
    diagnostics.forEach((diagnostic: any) => {
      const error = new Error() as TypeScriptError;
      error.name = 'TypeScriptError';
      error.code = diagnostic.code;
      error.file = fileName;
      error.line = diagnostic.start ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1 : undefined;
      error.column = diagnostic.start ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).character + 1 : undefined;
      error.category = diagnostic.category === 1 ? 'error' : 'warning';
      error.messageText = diagnostic.messageText;
      error.relatedInformation = diagnostic.relatedInformation?.map((info: any) => ({
        file: info.file.fileName,
        line: info.file.getLineAndCharacterOfPosition(info.start).line + 1,
        column: info.file.getLineAndCharacterOfPosition(info.start).character + 1,
        message: info.messageText
      }));
      
      interceptTypeScriptError(error);
    });
    
    return diagnostics;
  };
} 
