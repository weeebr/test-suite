import { TestResult } from '../core/state';
import { StateManager } from './stateManager';

export async function runRegistryTests(): Promise<TestResult> {
  try {
    const stateManager = StateManager.getInstance();
    await stateManager.clearAllState();

    const registry = {
      timestamp: Date.now(),
      functions: [
        {
          name: 'testFunction',
          type: 'function' as const,
          file: 'test.ts',
          exported: true,
          async: false,
          line: 1
        }
      ]
    };

    await stateManager.updateFunctionRegistry(registry);
    const savedRegistry = stateManager.getFunctionRegistry();

    if (!savedRegistry || savedRegistry.functions[0].name !== registry.functions[0].name) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Function registry persistence failed'
      };
    }

    await stateManager.clearAllState();
    const clearedRegistry = stateManager.getFunctionRegistry();

    if (clearedRegistry) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Clear function registry failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Registry tests passed'
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
