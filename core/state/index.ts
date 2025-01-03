import { TestResult, TestGroup, TestState, TestType, TestSeverity } from './types';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';

export class TestStateManager {
  private state: TestState;
  private errorInterceptor: ErrorInterceptor;

  constructor() {
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.state = {
      groups: new Map<string, TestGroup>(),
      results: new Map<string, TestResult[]>(),
      running: new Set<string>(),
      completed: new Set<string>(),
      startTime: Date.now()
    };
  }

  addGroup(group: TestGroup): void {
    try {
      if (this.state.groups.has(group.name)) {
        throw new Error(`Duplicate test group: ${group.name}`);
      }
      this.state.groups.set(group.name, group);
      this.state.results.set(group.name, []);
    } catch (error) {
      this.errorInterceptor.trackError('validation', error as Error, {
        severity: 'error',
        phase: 'state_management',
        details: { group, action: 'add_group' }
      });
      throw error;
    }
  }

  startTest(groupName: string, file: string): void {
    try {
      if (!this.state.groups.has(groupName)) {
        throw new Error(`Unknown test group: ${groupName}`);
      }
      const key = `${groupName}:${file}`;
      if (this.state.running.has(key)) {
        throw new Error(`Test already running: ${key}`);
      }
      this.state.running.add(key);
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        severity: 'error',
        phase: 'state_management',
        details: { groupName, file, action: 'start_test' }
      });
      throw error;
    }
  }

  completeTest(groupName: string, file: string, result: TestResult): void {
    try {
      const key = `${groupName}:${file}`;
      if (!this.state.running.has(key)) {
        throw new Error(`Test not running: ${key}`);
      }
      this.state.running.delete(key);
      this.state.completed.add(key);
      
      const groupResults = this.state.results.get(groupName);
      if (!groupResults) {
        throw new Error(`No results for group: ${groupName}`);
      }
      groupResults.push({ ...result, group: groupName });
      this.state.results.set(groupName, groupResults);
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        severity: 'error',
        phase: 'state_management',
        details: { groupName, file, result, action: 'complete_test' }
      });
      throw error;
    }
  }

  getGroupResults(groupName: string): TestResult[] {
    return this.state.results.get(groupName) || [];
  }

  getAllResults(): TestResult[] {
    return Array.from(this.state.results.values()).flat();
  }

  getRunningTests(): string[] {
    return Array.from(this.state.running);
  }

  getCompletedTests(): string[] {
    return Array.from(this.state.completed);
  }

  isGroupComplete(groupName: string): boolean {
    return Array.from(this.state.running)
      .filter(key => key.startsWith(`${groupName}:`))
      .length === 0;
  }

  finalize(): void {
    this.state.endTime = Date.now();
  }

  getDuration(): number {
    return (this.state.endTime || Date.now()) - this.state.startTime;
  }
}

export type { TestResult, TestGroup, TestState, TestType, TestSeverity };
