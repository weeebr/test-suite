import { TestResult } from '../../core/state';
import { runMemoryTests } from './performanceMonitor.memoryTests';
import { runTimingTests } from './performanceMonitorTimingTests';
import { runResourceTests } from './performanceMonitorResourceTests';
import { runEventTests } from './performanceMonitorEventTests';

export async function runTest(): Promise<TestResult> {
  try {
    // Run memory tests
    const memoryResult = await runMemoryTests();
    if (memoryResult.severity === 'error') {
      return memoryResult;
    }

    // Run timing tests
    const timingResult = await runTimingTests();
    if (timingResult.severity === 'error') {
      return timingResult;
    }

    // Run resource tests
    const resourceResult = await runResourceTests();
    if (resourceResult.severity === 'error') {
      return resourceResult;
    }

    // Run event tests
    const eventResult = await runEventTests();
    if (eventResult.severity === 'error') {
      return eventResult;
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'All performance monitor tests passed'
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
