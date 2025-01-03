import { TestResult, TestState } from '../../../core/state';
import { TestMetricsManager } from '../../../management/metrics';

export async function runTest(): Promise<TestResult> {
  try {
    const manager = new TestMetricsManager();
    const state = new TestState();
    
    // Test metrics tracking
    const testResults: TestResult[] = [
      {
        file: 'test1.ts',
        type: 'runtime',
        severity: 'error',
        message: 'Test error'
      },
      {
        file: 'test2.ts',
        type: 'runtime',
        severity: 'info',
        message: 'Test info'
      },
      {
        file: 'test3.ts',
        type: 'runtime',
        severity: 'warning',
        message: 'Test warning'
      }
    ];
    
    manager.trackMetrics(testResults, state);
    
    const metrics = manager.getLatestMetrics();
    if (!metrics) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No metrics tracked',
        line: 1
      };
    }
    
    // Verify metrics
    if (metrics.totalTests !== 3) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Total tests count mismatch',
        line: 1
      };
    }
    
    if (metrics.passedTests !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Passed tests count mismatch',
        line: 1
      };
    }
    
    if (metrics.failedTests !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Failed tests count mismatch',
        line: 1
      };
    }
    
    if (metrics.skippedTests !== 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Skipped tests count mismatch',
        line: 1
      };
    }
    
    // Test clear
    manager.clearMetrics();
    if (manager.getLatestMetrics() !== undefined) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Clear metrics failed',
        line: 1
      };
    }
    
    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Metrics manager tests passed',
      line: 1
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      line: 1
    };
  }
} 
