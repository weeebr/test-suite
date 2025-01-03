import { PerformanceMonitor } from './performanceMonitor';
import { TestResult } from '../../core/state';

export async function runResourceTests(): Promise<TestResult> {
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Test: Resource tracking
  const resourceTestId = 'resource-test';
  performanceMonitor.startTest(resourceTestId);

  // Generate some CPU load
  for (let i = 0; i < 1000000; i++) {
    Math.random();
  }

  performanceMonitor.endTest(resourceTestId);

  const resourceEvents = performanceMonitor.getEventsByType('resource');
  if (resourceEvents.length === 0) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: 'Resource tracking failed'
    };
  }

  return {
    file: __filename,
    type: 'runtime',
    severity: 'info',
    message: 'Resource tests passed'
  };
} 
