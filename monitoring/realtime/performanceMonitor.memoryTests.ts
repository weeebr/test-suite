import { PerformanceMonitor } from './performanceMonitor';
import { TestResult } from '../../core/state';

export async function runMemoryTests(): Promise<TestResult> {
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Test 1: Memory tracking
  const testId = 'memory-test';
  performanceMonitor.startTest(testId);

  // Force memory allocation
  new Array(1000000).fill(0);

  performanceMonitor.endTest(testId);

  const memoryEvents = performanceMonitor.getEventsByType('memory');
  if (memoryEvents.length === 0) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: 'Memory tracking failed'
    };
  }

  // Test 2: Memory limit enforcement
  const memoryLimitTestId = 'memory-limit-test';
  performanceMonitor.setMemoryLimit(1024); // Set very low limit
  performanceMonitor.startTest(memoryLimitTestId);

  // Try to allocate more memory than the limit
  try {
    new Array(1000000).fill(0);
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for limit check
  } catch {}

  if (performanceMonitor.isTestRunning(memoryLimitTestId)) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: 'Memory limit enforcement failed'
    };
  }

  return {
    file: __filename,
    type: 'runtime',
    severity: 'info',
    message: 'Memory tests passed'
  };
} 
