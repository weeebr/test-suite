import { TestResult, TestGroup, TestState, TestType, TestSeverity } from './types';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';

export class TestStateManager {
  private state: TestState = {
    groups: {},
    completedTests: 0,
    totalTests: 0
  };

  private errorInterceptor: ErrorInterceptor;

  constructor() {
    this.errorInterceptor = ErrorInterceptor.getInstance();
  }

  public initializeGroup(groupName: string, files: string[]): void {
    this.state.groups[groupName] = {
      name: groupName,
      files,
      results: []
    };
    this.state.totalTests += files.length;
  }

  public completeTest(groupName: string, file: string, result: TestResult): void {
    const group = this.state.groups[groupName];
    if (!group) {
      throw new Error(`Group ${groupName} not found`);
    }

    group.results.push(result);
    this.state.completedTests++;

    if (result.severity === 'error') {
      this.errorInterceptor.trackError('runtime', new Error(result.message), {
        file,
        group: groupName,
        code: result.code,
        stack: result.stack
      });
    }
  }

  public getResults(): TestResult[] {
    return Object.values(this.state.groups).flatMap(group => group.results);
  }

  public getProgress(): { completed: number; total: number } {
    return {
      completed: this.state.completedTests,
      total: this.state.totalTests
    };
  }
}

export type { TestResult, TestGroup, TestState, TestType, TestSeverity };
