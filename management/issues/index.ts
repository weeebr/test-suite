import { TestResult } from '../../core/state';

export class TestIssueManager {
  private issues: TestResult[] = [];

  public trackIssue(result: TestResult): void {
    this.issues.push(result);
  }

  public getIssues(): TestResult[] {
    return this.issues;
  }

  public getIssueCount(): number {
    return this.issues.length;
  }

  public getErrorCount(): number {
    return this.issues.filter(i => i.severity === 'error').length;
  }

  public getWarningCount(): number {
    return this.issues.filter(i => i.severity === 'warning').length;
  }

  public clear(): void {
    this.issues = [];
  }
}
