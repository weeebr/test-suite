import { ErrorCategory } from './types';

interface ErrorFormatOptions {
  phase?: string;
  file?: string;
  workerPid?: number;
  code?: number | string;
  signal?: string;
  metrics?: Record<string, unknown>;
}

export function formatErrorMessage(error: Error, category: ErrorCategory, options: ErrorFormatOptions = {}): string {
  const { phase, file, workerPid, code, signal, metrics } = options;
  const parts: string[] = [];

  // Base error info
  parts.push(`[${category.toUpperCase()}]`);
  if (phase) parts.push(`[${phase}]`);
  parts.push(error.message);

  // Context-specific details
  if (file) parts.push(`(file: ${file})`);
  if (workerPid) parts.push(`(pid: ${workerPid})`);
  if (code) parts.push(`(code: ${code})`);
  if (signal) parts.push(`(signal: ${signal})`);
  if (metrics) parts.push(`(metrics: ${JSON.stringify(metrics)})`);

  return parts.join(' ');
} 
