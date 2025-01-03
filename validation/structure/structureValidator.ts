import { promises as fs } from 'fs';
import { join } from 'path';

interface ValidationRule {
  pattern: RegExp;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  file: string;
  issues: Array<{
    message: string;
    severity: 'error' | 'warning';
  }>;
}

export class StructureValidator {
  private static instance: StructureValidator;
  private rules: ValidationRule[] = [
    {
      pattern: /^[a-z0-9-]+$/,
      message: 'Directory names should be lowercase with dashes',
      severity: 'error'
    },
    {
      pattern: /^[A-Z][a-zA-Z]*\.(tsx|ts)$/,
      message: 'Component files should be PascalCase',
      severity: 'error'
    },
    {
      pattern: /^[a-z][a-zA-Z]*\.(ts|js)$/,
      message: 'Utility files should be camelCase',
      severity: 'error'
    },
    {
      pattern: /^[a-z][a-zA-Z]*\.test\.(ts|js)$/,
      message: 'Test files should be camelCase with .test suffix',
      severity: 'error'
    }
  ];

  private ignoredPaths = [
    'node_modules',
    'dist',
    'coverage',
    '.git',
    '.vscode',
    '.idea'
  ];

  private constructor() {}

  public static getInstance(): StructureValidator {
    if (!StructureValidator.instance) {
      StructureValidator.instance = new StructureValidator();
    }
    return StructureValidator.instance;
  }

  public async validateDirectory(dir: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (this.ignoredPaths.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        const dirResults = await this.validateDirectory(fullPath);
        results.push(...dirResults);

        if (!this.rules[0].pattern.test(entry.name)) {
          results.push({
            file: fullPath,
            issues: [{
              message: this.rules[0].message,
              severity: this.rules[0].severity
            }]
          });
        }
      } else {
        const fileIssues = this.validateFileName(entry.name);
        if (fileIssues.length > 0) {
          results.push({
            file: fullPath,
            issues: fileIssues
          });
        }
      }
    }

    return results;
  }

  private validateFileName(fileName: string): Array<{ message: string; severity: 'error' | 'warning' }> {
    const issues: Array<{ message: string; severity: 'error' | 'warning' }> = [];
    const isComponent = /\.(tsx|ts)$/.test(fileName) && /^[A-Z]/.test(fileName);
    const isTest = /\.test\.(ts|js)$/.test(fileName);
    const isUtility = /\.(ts|js)$/.test(fileName) && /^[a-z]/.test(fileName) && !isTest;

    if (isComponent && !this.rules[1].pattern.test(fileName)) {
      issues.push({
        message: this.rules[1].message,
        severity: this.rules[1].severity
      });
    }

    if (isTest && !this.rules[3].pattern.test(fileName)) {
      issues.push({
        message: this.rules[3].message,
        severity: this.rules[3].severity
      });
    }

    if (isUtility && !this.rules[2].pattern.test(fileName)) {
      issues.push({
        message: this.rules[2].message,
        severity: this.rules[2].severity
      });
    }

    return issues;
  }
} 
