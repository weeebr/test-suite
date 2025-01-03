import { StateManager } from '../../project-state/stateManager';
import { MemoryMetrics, ResourceMetrics } from './types';

interface TestHistoryEntry {
  timestamp: number;
  testId: string;
  duration: number;
  result: 'pass' | 'fail';
  memoryUsage: number;
  cpuUsage: number;
}

export class TestHistory {
  private stateManager: StateManager;

  constructor() {
    this.stateManager = StateManager.getInstance();
  }

  public async addTestResult(
    testId: string,
    timestamp: number,
    duration: number,
    timeoutLimit: number,
    memoryLimit: number,
    memoryMetrics: MemoryMetrics,
    resourceMetrics: ResourceMetrics
  ): Promise<void> {
    await this.stateManager.addTestHistory({
      timestamp,
      testId,
      duration,
      result: duration < timeoutLimit && memoryMetrics.heapUsed < memoryLimit ? 'pass' : 'fail',
      memoryUsage: memoryMetrics.heapUsed,
      cpuUsage: resourceMetrics.cpuUsage
    });
  }
} 
