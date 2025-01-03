import { TestResult } from '../../../core/state';

export function formatTestSummary(results: TestResult[]): string {
  const failedTests = results.filter(r => r.severity === 'error');

  const summary = failedTests.map(result => {
    const type = result.type.toUpperCase();
    const file = result.file;
    const message = formatSummaryMessage(result.message);
    return `\n❌ ${type}: ${file}: ${message}`;
  }).join('');

  return failedTests.length > 0 ? `${summary}\n\n❌ ${failedTests.length} test(s) failed` : '' ;
}

function formatSummaryMessage(message: string): string {
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
