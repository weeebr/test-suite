import { TestResult } from '../../core/state';
import { StructureValidator, FileSizeValidator } from './index';

export async function runTest(): Promise<TestResult> {
  try {
    const structureValidator = StructureValidator.getInstance();
    const fileSizeValidator = FileSizeValidator.getInstance();

    // Validate project structure
    const structureResults = await structureValidator.validateDirectory('.');
    const structureErrors = structureResults.filter(r => 
      r.issues.some(i => i.severity === 'error')
    );

    if (structureErrors.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: `Structure validation failed:\n${structureErrors
          .map(e => `${e.file}: ${e.issues.map(i => i.message).join(', ')}`)
          .join('\n')}`,
        line: 1,
        column: 1
      };
    }

    // Validate file sizes
    const sizeResults = await fileSizeValidator.validateDirectory('.');
    const sizeErrors = sizeResults.filter(r => !r.isValid);

    if (sizeErrors.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: `File size validation failed:\n${sizeErrors
          .map(e => e.message)
          .join('\n')}`,
        line: 1,
        column: 1
      };
    }

    return {
      file: __filename,
      type: 'structure',
      severity: 'info',
      message: 'Structure validation passed',
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
