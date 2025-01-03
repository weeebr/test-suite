import { TestResult } from '../../core/state';
import { ProjectStructureValidator } from './projectStructureValidator';

export async function runTest(): Promise<TestResult> {
  try {
    const validator = ProjectStructureValidator.getInstance();
    const results = await validator.validateDirectory('.');

    const structureErrors = results.filter(r => 
      r.issues.some(i => i.severity === 'error')
    );

    if (structureErrors.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: `Project structure validation failed:\n${structureErrors
          .map(e => `${e.file}: ${e.issues.map(i => i.message).join(', ')}`)
          .join('\n')}`,
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
