import { TestResult } from '../../core/state';
import { CentralizationValidator } from './centralizationValidator';

export async function runTest(): Promise<TestResult> {
  try {
    const validator = CentralizationValidator.getInstance();
    
    // Validate current directory
    const results = await validator.validateDirectory('.');
    
    // Check for centralization violations
    const violations = results.filter(r => 
      r.issues.some(i => i.type === 'structure' && i.severity === 'error')
    );

    if (violations.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: `Centralization violations detected:\n${violations
          .map(e => `${e.file}: ${e.issues.map(i => i.message).join(', ')}`)
          .join('\n')}`,
        line: 1,
        column: 1
      };
    }

    // Check for organization warnings
    const warnings = results.filter(r =>
      r.issues.some(i => i.type === 'structure' && i.severity === 'warning')
    );

    if (warnings.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'warning',
        message: `Organization warnings found:\n${warnings
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
      message: 'Centralization validation passed',
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
