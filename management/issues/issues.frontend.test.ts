import { TestResult } from '../../core/state';
import { IssueManager } from './issueManager';

export async function runTest(): Promise<TestResult> {
  try {
    const issueManager = IssueManager.getInstance();

    // Test issue creation
    const issueId = issueManager.createIssue({
      type: 'error',
      title: 'Test Issue',
      description: 'Test description',
      severity: 'high',
      source: 'test.ts'
    });

    const issue = issueManager.getIssue(issueId);
    if (!issue || issue.status !== 'open') {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Issue creation failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Issue tests passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
} 
