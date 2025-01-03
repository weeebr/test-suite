import { ErrorEvent } from '../types';
import { TestResult } from '../../../core/state';

export function formatTestError(result: TestResult): string {
  const type = result.type.toUpperCase();
  const file = result.file.split('/').pop() || result.file;
  const message = formatErrorMessage(result.message);
  return `\n❌ ${type}: ${file}: ${message}`;
}

function formatErrorMessage(message: string): string {
  // Remove stack traces
  message = message.split('\n')[0];
  
  // Remove common error prefixes
  message = message.replace(/^Error: /, '');
  message = message.replace(/^AssertionError: /, '');
  
  // Truncate if too long (max 100 chars)
  if (message.length > 100) {
    message = message.substring(0, 97) + '...';
  }
  
  return message;
}

export function formatTestErrorEvent(event: ErrorEvent): string {
  const type = event.type.toUpperCase();
  const file = event.context.source?.split('/').pop() || 'unknown';
  const message = formatErrorMessage(event.error.message);
  return `\n❌ ${type}: ${file}: ${message}`;
} 
