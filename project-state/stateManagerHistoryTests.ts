import { TestResult } from '../core/state';
import { StateManager } from './stateManager';

export async function runHistoryTests(): Promise<TestResult> {
  try {
    const stateManager = StateManager.getInstance();
    await stateManager.clearAllState();

    const testEntry = {
      timestamp: Date.now(),
      testId: 'test-1',
      duration: 100,
      result: 'pass' as const,
      memoryUsage: 1000,
      cpuUsage: 0.5
    };

    await stateManager.addTestHistory(testEntry);
    const history = stateManager.getTestHistory();

    if (history.length === 0 || history[0].testId !== testEntry.testId) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Test history tracking failed'
      };
    }

    const start = Date.now() - 1000;
    const end = Date.now() + 1000;
    const timeRangeHistory = stateManager.getTestHistoryByTimeRange(start, end);

    if (timeRangeHistory.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Test history time range filtering failed'
      };
    }

    const testIdHistory = stateManager.getTestHistoryById('test-1');

    if (testIdHistory.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Test history ID filtering failed'
      };
    }

    await stateManager.clearTestHistory();
    const clearedHistory = stateManager.getTestHistory();

    if (clearedHistory.length !== 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Clear test history failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'History tests passed'
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
