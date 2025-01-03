import { join } from 'path';
import { TestResult } from '@/core/state';
import { promises as fs } from 'fs';

export async function runTest(): Promise<TestResult> {
  try {
    const coreDir = join(__dirname, '..', '..', 'core');

    // Check if core directory exists
    try {
      await fs.access(coreDir);
    } catch {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Core directory not found',
        line: 1,
        column: 1
      };
    }

    // Check for required components
    const requiredComponents = ['runner', 'config', 'state', 'workers'];
    const missingComponents = [];

    for (const component of requiredComponents) {
      try {
        await fs.access(join(coreDir, component));
      } catch {
        missingComponents.push(component);
      }
    }

    if (missingComponents.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Missing core components: ${missingComponents.join(', ')}`,
        line: 1,
        column: 1
      };
    }

    // Check for required files
    const requiredFiles = [
      'runner/index.ts',
      'config/index.ts',
      'state/index.ts',
      'workers/pool.ts',
      'workers/worker.js'
    ];

    const missingFiles = [];
    for (const file of requiredFiles) {
      try {
        await fs.access(join(coreDir, file));
      } catch {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Missing core files: ${missingFiles.join(', ')}`,
        line: 1,
        column: 1
      };
    }

    // Validate core files
    const invalidFiles = [];
    for (const file of requiredFiles) {
      try {
        const content = await fs.readFile(join(coreDir, file), 'utf-8');
        if (file.endsWith('index.ts')) {
          if (file === 'config/index.ts' && !content.includes('export interface')) {
            invalidFiles.push(file);
          } else if (file !== 'config/index.ts' && (!content.includes('export') || !content.includes('class'))) {
            invalidFiles.push(file);
          }
        }
      } catch (error) {
        invalidFiles.push(file);
      }
    }

    if (invalidFiles.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Invalid core files: ${invalidFiles.join(', ')}`,
        line: 1,
        column: 1
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Core structure validation passed',
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
