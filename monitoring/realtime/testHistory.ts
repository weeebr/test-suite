import { TestResult } from '../../core/state';
import { ResourceMetrics } from './types';

interface TestHistoryEntry {
  testId: string;
  startTime: number;
  endTime: number;
  duration: number;
  result: TestResult;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    arrayBuffers: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

export class TestHistory {
  private history: TestHistoryEntry[] = [];

  public addEntry(
    testId: string,
    startTime: number,
    endTime: number,
    result: TestResult,
    resourceMetrics: ResourceMetrics
  ): void {
    this.history.push({
      testId,
      startTime,
      endTime,
      duration: endTime - startTime,
      result,
      memoryUsage: resourceMetrics.memoryUsage,
      cpuUsage: resourceMetrics.cpuUsage
    });
  }

  public getHistory(): TestHistoryEntry[] {
    return this.history;
  }

  public getTestHistory(testId: string): TestHistoryEntry[] {
    return this.history.filter(entry => entry.testId === testId);
  }

  public clear(): void {
    this.history = [];
  }
} 
