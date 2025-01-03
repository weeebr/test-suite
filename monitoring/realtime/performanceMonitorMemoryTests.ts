import { TestResult } from '../../core/state';
import { PerformanceMonitor } from './performanceMonitor';

export async function runTest(): Promise<TestResult> {
  try {
    const monitor = PerformanceMonitor.getInstance();
    monitor.clearEvents();
    const testId = 'memory-test';

    // Start monitoring
    monitor.startTest(testId);
    const initialMemory = process.memoryUsage().heapUsed;

    // Allocate memory
    const array = new Array(1000000).fill(0);
    const currentMemory = process.memoryUsage().heapUsed;

    // Check memory increase
    if (currentMemory <= initialMemory) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Memory tracking failed - no memory increase detected',
        code: 'ERR_NO_MEMORY_INCREASE'
      };
    }

    // Test memory cleanup
    monitor.endTest(testId);
    array.length = 0;
    global.gc?.();

    // Check memory events
    const events = monitor.getEvents().filter(e => e.type === 'memory');
    if (events.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Memory tracking failed - no memory events recorded',
        code: 'ERR_NO_EVENTS'
      };
    }

    // Verify event data
    const memoryEvent = events[0];
    if (!memoryEvent.metrics.heapUsed || !memoryEvent.metrics.heapTotal) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Memory tracking failed - incomplete memory metrics',
        code: 'ERR_INCOMPLETE_METRICS'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Memory tracking test passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'ERR_UNEXPECTED'
    };
  }
} 
