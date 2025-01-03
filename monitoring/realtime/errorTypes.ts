export interface NodeJSError extends Error {
  code?: string;
}

export interface WebpackError extends Error {
  name: 'WebpackError';
  module?: {
    id: number | string;
    rawRequest?: string;
    dependencies?: Array<{ request: string }>;
    issuer?: string;
  };
  file?: string;
  details?: string;
  moduleId?: number | string;
  loc?: { line: number; column: number };
  chunk?: { name: string };
}

export interface ExpressError extends Error {
  name: 'ExpressError';
  status?: number;
  statusCode?: number;
  expose?: boolean;
  headers?: Record<string, string | string[] | undefined>;
  path?: string;
  method?: string;
  type?: string;
  syscall?: string;
  route?: string;
  stack?: string;
}

export interface TypeScriptError extends Error {
  name: 'TypeScriptError';
  code?: number;
  file?: string;
  line?: number;
  column?: number;
  category?: 'error' | 'warning' | 'suggestion' | 'message';
  source?: string;
  messageText?: string;
  relatedInformation?: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
  }>;
}

export interface ConsoleError extends Error {
  name: 'ConsoleError';
  level: 'error' | 'warn' | 'info' | 'debug';
  timestamp: number;
  args: unknown[];
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
}

export interface ErrorEvent {
  type: 'build' | 'network' | 'runtime' | 'lint' | 'module' | 'webpack' | 'express' | 'typescript' | 'console';
  error: Error | WebpackError | ExpressError | TypeScriptError | ConsoleError;
  timestamp: number;
  context?: Record<string, unknown>;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
  moduleId?: string | number;
  chunkName?: string;
  dependencies?: string[];
  statusCode?: number;
  path?: string;
  method?: string;
}

export type ErrorHandler = (error: Error) => void; 
