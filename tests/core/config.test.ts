import { TestResult } from '@core/state';
import { defaultConfig } from '@core/config';

export async function runTest(): Promise<TestResult> {
  try {
    // Test default config
    if (!defaultConfig.rootDir) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Missing rootDir in default config',
        line: 1,
        column: 1
      };
    }

    if (!defaultConfig.targetDirs || defaultConfig.targetDirs.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Missing targetDirs in default config',
        line: 1,
        column: 1
      };
    }

    if (!defaultConfig.testPattern) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Missing testPattern in default config',
        line: 1,
        column: 1
      };
    }

    if (!defaultConfig.exclude || defaultConfig.exclude.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Missing exclude patterns in default config',
        line: 1,
        column: 1
      };
    }

    if (typeof defaultConfig.watchMode !== 'boolean') {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Invalid watchMode type in default config',
        line: 1,
        column: 1
      };
    }

    if (typeof defaultConfig.workers !== 'number' || defaultConfig.workers < 1) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Invalid workers count in default config',
        line: 1,
        column: 1
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Config tests passed',
      line: 1,
      column: 1
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      line: 1,
      column: 1
    };
  }
} 
