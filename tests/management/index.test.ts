import { join } from 'path';
import { TestResult } from '../../core/state';
import { promises as fs } from 'fs';

export async function runTest(): Promise<TestResult> {
  try {
    const managementDir = join(__dirname, '..', 'management');

    // Check if management directory exists
    try {
      await fs.access(managementDir);
    } catch {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Management directory not found',
        line: 1,
        column: 1
      };
    }

    // Check for required components
    const requiredComponents = ['issues', 'metrics'];
    const missingComponents = [];

    for (const component of requiredComponents) {
      try {
        await fs.access(join(managementDir, component));
      } catch {
        missingComponents.push(component);
      }
    }

    if (missingComponents.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Missing management components: ${missingComponents.join(', ')}`,
        line: 1,
        column: 1
      };
    }

    // Check for required files
    const requiredFiles = [
      'issues/index.ts',
      'metrics/index.ts',
      'issues/issue-manager.test.ts',
      'metrics/metrics.test.ts'
    ];

    const missingFiles = [];
    for (const file of requiredFiles) {
      try {
        await fs.access(join(managementDir, file));
      } catch {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Missing management files: ${missingFiles.join(', ')}`,
        line: 1,
        column: 1
      };
    }

    // Validate test files
    const testFiles = requiredFiles.filter(f => f.endsWith('.test.ts'));
    const invalidFiles = [];

    for (const file of testFiles) {
      try {
        const content = await fs.readFile(join(managementDir, file), 'utf-8');
        if (!content.includes('export') || !content.includes('runTest')) {
          invalidFiles.push(file);
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
        message: `Invalid test files: ${invalidFiles.join(', ')}`,
        line: 1,
        column: 1
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Management structure validation passed',
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
