import { ErrorCategory } from '../types';

export interface ErrorFormatOptions {
  phase?: string;
  file?: string;
  workerPid?: number;
  code?: number | string;
  signal?: string;
  metrics?: Record<string, unknown>;
}

export interface ErrorContext {
  message: string;
  category: ErrorCategory;
  phase?: string;
  file?: string;
  workerPid?: number;
  code?: number | string;
  signal?: string;
  metrics?: Record<string, unknown>;
} 
