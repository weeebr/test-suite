import { IssueManager } from './issueManager';
import { ImpactAnalyzer } from '../../monitoring/realtime/impactAnalyzer';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';
import { TestResult } from '../../core/state';

export async function runTest(): Promise<TestResult> {
  try {
    const issueManager = IssueManager.getInstance();
    const impactAnalyzer = ImpactAnalyzer.getInstance();
    const errorInterceptor = ErrorInterceptor.getInstance();

    // Test 1: Issue creation
    const issueId = await issueManager.createIssue({
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

    // Test 2: Error event handling
    let issueCreated = false;
    issueManager.once('issueCreated', () => {
      issueCreated = true;
    });

    const error = new Error('Test error');
    errorInterceptor.trackError('runtime', error, { source: 'test.ts' });

    if (!issueCreated) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error event handling failed'
      };
    }

    // Test 3: Impact analysis
    const impact = await impactAnalyzer.analyzeError(error);
    if (!impact) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Impact analysis failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Issue manager tests passed'
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
