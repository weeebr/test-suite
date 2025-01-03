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

export interface ErrorEvent {
  type: 'build' | 'network' | 'runtime' | 'lint' | 'module' | 'webpack' | 'express';
  error: Error | WebpackError | ExpressError;
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
