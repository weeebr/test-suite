import { TestResult } from '../../../core/state';
import { TestRunner } from '../../../core/runner';
import { defaultConfig } from '../../../core/config';

export async function runTest(): Promise<TestResult> {
  try {
    const runner = new TestRunner(defaultConfig);
    const files = await runner.collectFiles();
    const groups = runner.groupFiles(files);

    // Validate group structure
    const invalidGroups = groups.filter(g =>
      !g.name || !g.files || !Array.isArray(g.files)
    );

    if (invalidGroups.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Invalid group structure:\n${JSON.stringify(invalidGroups, null, 2)}`,
        code: 'ERR_GROUP_STRUCTURE'
      };
    }

    // Validate group names
    const validGroupNames = ['frontend', 'validation', 'self', 'tests'];
    const invalidGroupNames = groups
      .map(g => g.name)
      .filter(name => !validGroupNames.includes(name));

    if (invalidGroupNames.length > 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: `Invalid group names: ${invalidGroupNames.join(', ')}`,
        code: 'ERR_GROUP_NAMES'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Test groups validation passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'ERR_TEST_FAILED'
    };
  }
} 
