import { TestResult } from '../core/state';
import { runStructureTests } from './stateManagerStructureTests';
import { runRegistryTests } from './stateManagerRegistryTests';
import { runHistoryTests } from './stateManagerHistoryTests';
import { runEventTests } from './stateManagerEventTests';

export async function runTest(): Promise<TestResult> {
  try {
    const structureResult = await runStructureTests();
    if (structureResult.severity === 'error') return structureResult;

    const registryResult = await runRegistryTests();
    if (registryResult.severity === 'error') return registryResult;

    const historyResult = await runHistoryTests();
    if (historyResult.severity === 'error') return historyResult;

    const eventResult = await runEventTests();
    if (eventResult.severity === 'error') return eventResult;

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'All state manager tests passed'
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
