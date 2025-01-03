import { TestResult, TestGroup, TestState } from './types';

export class TestStateManager {
  private state: TestState;

  constructor() {
    this.state = {
      groups: new Map<string, TestGroup>(),
      results: new Map<string, TestResult[]>(),
      running: new Set<string>(),
      completed: new Set<string>(),
      startTime: Date.now()
    };
  }

  addGroup(group: TestGroup): void {
    this.state.groups.set(group.name, group);
    this.state.results.set(group.name, []);
  }

  startTest(groupName: string, file: string): void {
    this.state.running.add(`${groupName}:${file}`);
  }

  completeTest(groupName: string, file: string, result: TestResult): void {
    const key = `${groupName}:${file}`;
    this.state.running.delete(key);
    this.state.completed.add(key);
    
    const groupResults = this.state.results.get(groupName) || [];
    groupResults.push({ ...result, group: groupName });
    this.state.results.set(groupName, groupResults);
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

export type { TestResult, TestGroup, TestState };
