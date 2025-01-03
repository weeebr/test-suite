import { ErrorInterceptor } from './errorInterceptor';
import { TypeScriptError } from './errorTypes';
import * as ts from 'typescript';

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

export function setupTypeScriptErrorHandling(): void {
  const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) return;

  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
  
  const program = ts.createProgram({
    rootNames: parsedConfig.fileNames,
    options: parsedConfig.options
  });

  const diagnostics = [
    ...program.getSemanticDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getDeclarationDiagnostics(),
    ...program.getGlobalDiagnostics()
  ];

  diagnostics.forEach((diagnostic) => {
    if (!diagnostic.file || diagnostic.start === undefined) return;

    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

    const error = new Error(message) as TypeScriptError;
    error.name = 'TypeScriptError';
    error.code = diagnostic.code;
    error.file = diagnostic.file.fileName;
    error.line = line + 1;
    error.column = character + 1;
    error.category = ts.DiagnosticCategory[diagnostic.category].toLowerCase() as 'error' | 'warning' | 'suggestion' | 'message';
    error.messageText = message;

    if (diagnostic.relatedInformation) {
      error.relatedInformation = diagnostic.relatedInformation
        .map(info => {
          if (!info.file || info.start === undefined) return null;
          const { line, character } = info.file.getLineAndCharacterOfPosition(info.start);
          return {
            file: info.file.fileName,
            line: line + 1,
            column: character + 1,
            message: ts.flattenDiagnosticMessageText(info.messageText, '\n')
          };
        })
        .filter((info): info is NonNullable<typeof info> => info !== null);
    }

    interceptTypeScriptError(error);
  });
}

export function watchTypeScriptErrors(): void {
  const configPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
  if (!configPath) return;

  const host = ts.createWatchCompilerHost(
    configPath,
    {},
    ts.sys,
    ts.createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportWatchStatus
  );

  ts.createWatchProgram(host);
}

function reportDiagnostic(diagnostic: ts.Diagnostic) {
  if (!diagnostic.file || diagnostic.start === undefined) return;

  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

  const error = new Error(message) as TypeScriptError;
  error.name = 'TypeScriptError';
  error.code = diagnostic.code;
  error.file = diagnostic.file.fileName;
  error.line = line + 1;
  error.column = character + 1;
  error.category = ts.DiagnosticCategory[diagnostic.category].toLowerCase() as 'error' | 'warning' | 'suggestion' | 'message';
  error.messageText = message;

  interceptTypeScriptError(error);
}

function reportWatchStatus() {
  // Intentionally empty - we don't need to handle watch status
} 
