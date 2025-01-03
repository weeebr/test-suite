import { IssueManager } from './issueManager';
import { TestResult } from '../../core/state';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';
import { ImpactAnalyzer } from '../../monitoring/realtime/impactAnalyzer';

export async function runTest(): Promise<TestResult> {
  try {
    const issueManager = IssueManager.getInstance();
    const errorInterceptor = ErrorInterceptor.getInstance();
    const impactAnalyzer = ImpactAnalyzer.getInstance();

    // Test 1: Issue creation
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

    // Test 2: Issue update
    issueManager.updateIssue(issueId, {
      status: 'in-progress',
      assignee: 'tester'
    });

    const updatedIssue = issueManager.getIssue(issueId);
    if (updatedIssue?.status !== 'in-progress' || updatedIssue?.assignee !== 'tester') {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Issue update failed'
      };
    }

    // Test 3: Issue filtering
    const highSeverityIssues = issueManager.getIssuesBySeverity('high');
    if (highSeverityIssues.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Issue filtering by severity failed'
      };
    }

    // Test 4: Issue linking
    const relatedIssueId = issueManager.createIssue({
      type: 'warning',
      title: 'Related Issue',
      description: 'Related issue description',
      severity: 'medium',
      source: 'test.ts'
    });

    issueManager.linkIssues(issueId, relatedIssueId);
    const relatedIssues = issueManager.getRelatedIssues(issueId);
    if (relatedIssues.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Issue linking failed'
      };
    }

    // Test 5: Issue unlinking
    issueManager.unlinkIssues(issueId, relatedIssueId);
    const unlinkedIssues = issueManager.getRelatedIssues(issueId);
    if (unlinkedIssues.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Issue unlinking failed'
      };
    }

    // Test 6: Error event handling
    let issueCreated = false;
    issueManager.once('issueCreated', () => {
      issueCreated = true;
    });

    errorInterceptor.trackError('runtime', new Error('Test error'), { source: 'test.ts' });

    if (!issueCreated) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error event handling failed'
      };
    }

    // Test 7: State persistence
    await issueManager.initialize();
    const persistedIssue = issueManager.getIssue(issueId);
    if (!persistedIssue) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'State persistence failed'
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
