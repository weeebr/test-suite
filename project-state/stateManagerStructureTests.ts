import { TestResult } from '../core/state';
import { StateManager } from './stateManager';

export async function runStructureTests(): Promise<TestResult> {
  try {
    const stateManager = StateManager.getInstance();
    await stateManager.clearAllState();

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
    const savedStructure = stateManager.getProjectStructure();

    if (!savedStructure || savedStructure.files[0].path !== structure.files[0].path) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Project structure persistence failed'
      };
    }

    await stateManager.clearAllState();
    const clearedStructure = stateManager.getProjectStructure();

    if (clearedStructure) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Clear project structure failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Structure tests passed'
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
