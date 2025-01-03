import { PerformanceMonitor } from './performanceMonitor';
import { TestResult } from '../../core/state';

export async function runTimingTests(): Promise<TestResult> {
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Test 1: Timing tracking
  const timingTestId = 'timing-test';
  performanceMonitor.startTest(timingTestId);

  await new Promise(resolve => setTimeout(resolve, 100));

  performanceMonitor.endTest(timingTestId);

  const timingEvents = performanceMonitor.getEventsByType('timing');
  if (timingEvents.length === 0) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: 'Timing tracking failed'
    };
  }

  const timingEvent = timingEvents[0];
  if ((timingEvent.metrics as any).duration < 100) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: 'Duration tracking failed'
    };
  }

  // Test 2: Timeout enforcement
  const timeoutTestId = 'timeout-test';
  performanceMonitor.setTimeoutLimit(100);
  performanceMonitor.startTest(timeoutTestId);

  await new Promise(resolve => setTimeout(resolve, 150));

  if (performanceMonitor.isTestRunning(timeoutTestId)) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: 'Timeout enforcement failed'
    };
  }

  return {
    file: __filename,
    type: 'runtime',
    severity: 'info',
    message: 'Timing tests passed'
  };
} 
