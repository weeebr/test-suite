import { join } from 'path';
import { TestResult } from '../../core/state';
import { promises as fs } from 'fs';

export async function runTest(): Promise<TestResult> {
  try {
    const testsDir = join(__dirname, '..');

    // Check for frontend test files
    let testFiles: string[] = [];
    try {
      const entries = await fs.readdir(testsDir, { withFileTypes: true });
      testFiles = entries
        .filter(entry => entry.isFile() && /\.test\.(ts|tsx|js|jsx)$/.test(entry.name))
        .map(entry => join('tests/frontend', entry.name));
    } catch (error) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Failed to read tests directory',
        line: 1,
        column: 1
      };
    }

    if (testFiles.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'info',
        message: 'No frontend tests found (optional)',
        line: 1,
        column: 1
      };
    }

    // Validate test files
    const invalidFiles = [];
    for (const file of testFiles) {
      try {
        const content = await fs.readFile(join(__dirname, '../..', file), 'utf-8');
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
      message: `Found ${testFiles.length} frontend test files`,
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
