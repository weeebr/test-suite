import { BuildMonitor } from './build-monitor';
import { TestResult } from '../../core/state';
import { join } from 'path';

export async function runTest(): Promise<TestResult> {
  try {
    const buildMonitor = BuildMonitor.getInstance();
    buildMonitor.clearEvents();

    // Test 1: Start build
    const success = await buildMonitor.startBuild('echo', ['test'], process.cwd());
    if (!success) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Build start failed'
      };
    }

    // Test 2: Check events
    const events = buildMonitor.getEvents();
    if (events.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'No build events recorded'
      };
    }

    // Test 3: Check event types
    const startEvents = buildMonitor.getEventsByType('start');
    const successEvents = buildMonitor.getEventsByType('success');
    if (startEvents.length === 0 || successEvents.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Missing required event types'
      };
    }

    // Test 4: Failed build
    const failure = await buildMonitor.startBuild('nonexistent-command', [], process.cwd()).catch(() => false);
    if (failure !== false) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Failed build handling incorrect'
      };
    }

    // Test 5: Error events
    const errorEvents = buildMonitor.getEventsByType('error');
    if (errorEvents.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Error events not recorded'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Build monitor tests passed'
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
