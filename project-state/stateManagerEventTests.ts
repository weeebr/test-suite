import { TestResult } from '../core/state';
import { StateManager } from './stateManager';

export async function runEventTests(): Promise<TestResult> {
  try {
    const stateManager = StateManager.getInstance();
    await stateManager.clearAllState();

    let eventEmitted = false;
    stateManager.once('stateUpdate', () => {
      eventEmitted = true;
    });

    const structure = {
      timestamp: Date.now(),
      files: [
        {
          path: 'test.ts',
          size: 100,
          lastModified: Date.now()
        }
      ],
      directories: ['src']
    };

    await stateManager.updateProjectStructure(structure);

    if (!eventEmitted) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'State update event emission failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Event tests passed'
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
