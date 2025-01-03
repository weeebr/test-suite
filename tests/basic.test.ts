import { TestRunner } from '../core/runner';
import { join } from 'path';
import { TestResult } from '../core/state';
import { defaultConfig } from '../core/config';

export async function runTest(): Promise<TestResult> {
  try {
    const runner = new TestRunner({
      ...defaultConfig,
      rootDir: join(__dirname, '..'),
      structure: {
        directories: {
          core: ['core'],
          tests: ['tests', 'frontend/tests', 'backend/tests'],
          management: ['management'],
          monitoring: ['monitoring']
        },
        patterns: {
          test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
          source: /\.(ts|tsx|js|jsx)$/
        },
        exclude: ['node_modules', 'dist', 'coverage', '.git']
      },
      testType: 'all'
    });

    const files = await runner.collectFiles();
    
    if (files.length === 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: 'No source files found to validate against',
        line: 1,
        column: 1
      };
    }

    // Validate core structures exist
    const hasRunnerFiles = files.some(f => f.includes('core/runner'));
    const hasConfigFiles = files.some(f => f.includes('core/config'));
    const hasStateFiles = files.some(f => f.includes('core/state'));
    
    if (!hasRunnerFiles || !hasConfigFiles || !hasStateFiles) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: 'Missing core project structure files',
        line: 1,
        column: 1
      };
    }

    return {
      file: __filename,
      type: 'structure',
      severity: 'info',
      message: 'Project structure validation passed',
      line: 1,
      column: 1
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      line: 1,
      column: 1
    };
  }
} 
