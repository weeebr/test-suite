import { PerformanceMonitor } from './performanceMonitor';
import { TestResult } from '../../core/state';

export async function runEventTests(): Promise<TestResult> {
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Test 1: Event filtering
  const testId = 'filter-test';
  performanceMonitor.startTest(testId);
  performanceMonitor.endTest(testId);

  const events = performanceMonitor.getEventsByTest(testId);
  if (events.length === 0) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: 'Event filtering failed'
    };
  }

  // Test 2: Event emission
  let eventEmitted = false;
  performanceMonitor.once('performanceEvent', () => {
    eventEmitted = true;
  });

  const emissionTestId = 'emission-test';
  performanceMonitor.startTest(emissionTestId);
  performanceMonitor.endTest(emissionTestId);

  if (!eventEmitted) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: 'Event emission failed'
    };
  }

  return {
    file: __filename,
    type: 'runtime',
    severity: 'info',
    message: 'Event tests passed'
  };
} 
