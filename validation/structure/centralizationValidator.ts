import { join } from 'path';
import { readdir } from 'fs/promises';

export interface ValidationIssue {
  message: string;
  severity: 'error' | 'warning';
  type: 'structure';
}

export interface ValidationResult {
  file: string;
  issues: ValidationIssue[];
}

export interface CentralizationRule {
  pattern: RegExp;
  location: string;
  message: string;
  severity: 'error' | 'warning';
}

export class CentralizationValidator {
  private static instance: CentralizationValidator;
  private rules: CentralizationRule[] = [
    {
      pattern: /interface.*State/,
      location: 'core/state',
      message: 'State interfaces must be in core/state directory',
      severity: 'error'
    },
    {
      pattern: /interface.*Config/,
      location: 'core/config',
      message: 'Config interfaces must be in core/config directory',
      severity: 'error'
    },
    {
      pattern: /interface.*Test/,
      location: 'core/test',
      message: 'Test interfaces must be in core/test directory',
      severity: 'error'
    },
    {
      pattern: /\.test\.ts$/,
      location: 'tests',
      message: 'Test files should be in tests directory',
      severity: 'warning'
    }
  ];

  private constructor() {}

  public static getInstance(): CentralizationValidator {
    if (!CentralizationValidator.instance) {
      CentralizationValidator.instance = new CentralizationValidator();
    }
    return CentralizationValidator.instance;
  }

  public async validateDirectory(dir: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const files = await this.collectFiles(dir);

    for (const file of files) {
      const issues: ValidationIssue[] = [];
      
      for (const rule of this.rules) {
        if (rule.pattern.test(file)) {
          if (!file.includes(rule.location)) {
            issues.push({
              message: rule.message,
              severity: rule.severity,
              type: 'structure'
            });
          }
        }
      }

      if (issues.length > 0) {
        results.push({ file, issues });
      }
    }

    return results;
  }

  private async collectFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const ignoredPaths = ['node_modules', 'dist', '.git', 'coverage'];
    
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (ignoredPaths.includes(entry.name)) continue;
        
        if (entry.isDirectory()) {
          const subFiles = await this.collectFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error collecting files from ${dir}:`, error);
    }
    
    return files;
  }
} 
