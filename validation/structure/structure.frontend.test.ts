import { TestResult } from '../../core/state';
import { StructureValidator, FileSizeValidator, CodeQualityValidator, CentralizationValidator } from './index';

interface ValidationStats {
  group: string;
  errors: number;
  warnings: number;
}

export async function runTest(): Promise<TestResult> {
  try {
    const structureValidator = StructureValidator.getInstance();
    const fileSizeValidator = FileSizeValidator.getInstance();
    const codeQualityValidator = CodeQualityValidator.getInstance();
    const centralizationValidator = CentralizationValidator.getInstance();

    const stats: ValidationStats[] = [];

    // Validate project structure
    const structureResults = await structureValidator.validateDirectory('.');
    stats.push({
      group: 'Structure',
      errors: structureResults.filter(r => r.issues.some(i => i.severity === 'error')).length,
      warnings: structureResults.filter(r => r.issues.some(i => i.severity === 'warning')).length
    });

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
    stats.push({
      group: 'File Size',
      errors: sizeResults.filter(r => !r.isValid).length,
      warnings: 0
    });

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

    // Validate code quality
    const qualityResults = await codeQualityValidator.validateDirectory('.');
    stats.push({
      group: 'Code Quality',
      errors: qualityResults.filter(r => r.issues.some(i => i.severity === 'error')).length,
      warnings: qualityResults.filter(r => r.issues.some(i => i.severity === 'warning')).length
    });

    const qualityErrors = qualityResults.filter(r =>
      r.issues.some(i => i.severity === 'error')
    );

    if (qualityErrors.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: `Code quality validation failed:\n${qualityErrors
          .map(e => `${e.file}: ${e.issues.map(i => i.message).join(', ')}`)
          .join('\n')}`,
        line: 1,
        column: 1
      };
    }

    // Validate centralization
    const centralizationResults = await centralizationValidator.validateDirectory('.');
    stats.push({
      group: 'Centralization',
      errors: centralizationResults.filter(r => r.issues.some(i => i.severity === 'error')).length,
      warnings: centralizationResults.filter(r => r.issues.some(i => i.severity === 'warning')).length
    });

    const centralizationErrors = centralizationResults.filter(r =>
      r.issues.some(i => i.severity === 'error')
    );

    if (centralizationErrors.length > 0) {
      return {
        file: __filename,
        type: 'structure',
        severity: 'error',
        message: `Centralization validation failed:\n${centralizationErrors
          .map(e => `${e.file}: ${e.issues.map(i => i.message).join(', ')}`)
          .join('\n')}`,
        line: 1,
        column: 1
      };
    }

    // Check for warnings
    const allWarnings = [
      ...structureResults.filter(r => r.issues.some(i => i.severity === 'warning')),
      ...qualityResults.filter(r => r.issues.some(i => i.severity === 'warning')),
      ...centralizationResults.filter(r => r.issues.some(i => i.severity === 'warning'))
    ];

    if (allWarnings.length > 0) {
      // Add validation stats to the warning message
      const statsMessage = stats
        .map(s => `${s.group}: ${s.errors} errors, ${s.warnings} warnings`)
        .join('\n');

      return {
        file: __filename,
        type: 'structure',
        severity: 'warning',
        message: `Structure validation warnings:\n${allWarnings
          .map(w => `${w.file}: ${w.issues.map(i => i.message).join(', ')}`)
          .join('\n')}\n\nValidation Summary:\n${statsMessage}`,
        line: 1,
        column: 1
      };
    }

    // Add validation stats to the success message
    const statsMessage = stats
      .map(s => `${s.group}: ${s.errors} errors, ${s.warnings} warnings`)
      .join('\n');

    return {
      file: __filename,
      type: 'structure',
      severity: 'info',
      message: `All structure validations passed\n\nValidation Summary:\n${statsMessage}`,
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
