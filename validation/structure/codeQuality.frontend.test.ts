import { TestResult } from '../../core/state';
import { CodeQualityValidator } from './codeQualityValidator';

export async function runTest(): Promise<TestResult> {
  try {
    const validator = CodeQualityValidator.getInstance();
    
    // Validate current directory
    const results = await validator.validateDirectory('.');
    
    // Check for duplicate code
    const duplicateErrors = results.filter(r => 
      r.issues.some(i => i.type === 'duplication' && i.severity === 'error')
    );

    if (duplicateErrors.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: `Code duplication detected:\n${duplicateErrors
          .map(e => `${e.file}: ${e.issues.map(i => i.message).join(', ')}`)
          .join('\n')}`,
        line: 1,
        column: 1
      };
    }

    // Check for DRY violations
    const dryViolations = results.filter(r =>
      r.issues.some(i => i.type === 'dry' && i.severity === 'warning')
    );

    if (dryViolations.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'warning',
        message: `DRY violations found:\n${dryViolations
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
      message: 'Code quality validation passed',
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
