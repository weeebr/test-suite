import { TestResult, TestSummary } from './types';

export class TestState {
  private results: TestResult[] = [];
  private startTime: number;

  public constructor() {
    this.startTime = Date.now();
  }

  public addResult(result: TestResult): void {
    this.results.push(result);
  }

  public clear(): void {
    this.results = [];
    this.startTime = Date.now();
  }

  public getResults(): TestResult[] {
    return this.results;
  }

  public getSummary(): TestSummary {
    const total = this.results.length;
    const passed = this.results.filter(r => r.severity === 'info').length;
    const failed = this.results.filter(r => r.severity === 'error').length;
    const skipped = this.results.filter(r => r.severity === 'warning').length;

    // Group results by group
    const groupResults = new Map<string, TestResult[]>();
    for (const result of this.results) {
      const group = result.group || 'default';
      const results = groupResults.get(group) || [];
      results.push(result);
      groupResults.set(group, results);
    }

    const groups: TestSummary['groups'] = {};
    for (const [group, results] of groupResults) {
      groups[group] = {
        total: results.length,
        passed: results.filter(r => r.severity === 'info').length,
        failed: results.filter(r => r.severity === 'error').length,
        skipped: results.filter(r => r.severity === 'warning').length
      };
    }

    return {
      total,
      passed,
      failed,
      skipped,
      duration: Date.now() - this.startTime,
      groups
    };
  }
} 
