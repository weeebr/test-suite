import { TestResult } from '../../core/state';
import { TestIssueManager } from './index';

export async function runTest(): Promise<TestResult> {
  try {
    const manager = new TestIssueManager();
    
    // Test issue tracking
    const testIssue: TestResult = {
      file: 'test.ts',
      type: 'runtime',
      severity: 'error',
      message: 'Test error'
    };
    
    manager.trackIssue(testIssue);
    
    if (manager.getIssueCount() !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Issue count mismatch',
        line: 1
      };
    }
    
    if (manager.getErrorCount() !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error count mismatch',
        line: 1
      };
    }
    
    // Test warning tracking
    const warningIssue: TestResult = {
      file: 'test.ts',
      type: 'runtime',
      severity: 'warning',
      message: 'Test warning'
    };
    
    manager.trackIssue(warningIssue);
    
    if (manager.getWarningCount() !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Warning count mismatch',
        line: 1
      };
    }
    
    // Test clear
    manager.clear();
    
    if (manager.getIssueCount() !== 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Clear failed',
        line: 1
      };
    }
    
    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Issue manager tests passed',
      line: 1
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      line: 1
    };
  }
} 
