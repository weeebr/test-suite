import { promises as fs } from 'fs';
import { join } from 'path';
import { Dirent } from 'fs';
import { TestResult } from '@core/state';

export async function runFrontendTests(): Promise<TestResult[]> {
  try {
    const testDir = 'tests/frontend';
    const entries = await fs.readdir(testDir, { withFileTypes: true });
    
    const testFiles = entries
      .filter((entry: Dirent) => entry.isFile() && /\.test\.(ts|tsx|js|jsx)$/.test(entry.name))
      .map((entry: Dirent) => join('tests/frontend', entry.name));

    const results: TestResult[] = [];
    for (const file of testFiles) {
      try {
        const testModule = await import(file);
        if (typeof testModule.runTest === 'function') {
          const result = await testModule.runTest();
          results.push(result);
        }
      } catch (error) {
        results.push({
          file,
          type: 'runtime',
          severity: 'error',
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  } catch (error) {
    return [{
      file: 'frontend-tests',
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error)
    }];
  }
} 
