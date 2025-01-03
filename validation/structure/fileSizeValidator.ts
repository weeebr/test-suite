import { promises as fs } from 'fs';
import { join } from 'path';

interface FileSizeValidationResult {
  file: string;
  lineCount: number;
  isValid: boolean;
  message: string;
}

export class FileSizeValidator {
  private static instance: FileSizeValidator;
  private readonly maxLines = 150;
  private ignoredPaths = [
    'node_modules',
    'dist',
    'coverage',
    '.git',
    '.vscode',
    '.idea'
  ];

  private constructor() {}

  public static getInstance(): FileSizeValidator {
    if (!FileSizeValidator.instance) {
      FileSizeValidator.instance = new FileSizeValidator();
    }
    return FileSizeValidator.instance;
  }

  public async validateFile(filePath: string): Promise<FileSizeValidationResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lineCount = content.split('\n').length;

    return {
      file: filePath,
      lineCount,
      isValid: lineCount <= this.maxLines,
      message: lineCount > this.maxLines 
        ? `File exceeds ${this.maxLines} lines (current: ${lineCount})`
        : `File size is within limit (${lineCount} lines)`
    };
  }

  public async validateDirectory(dir: string): Promise<FileSizeValidationResult[]> {
    const results: FileSizeValidationResult[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (this.ignoredPaths.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        const dirResults = await this.validateDirectory(fullPath);
        results.push(...dirResults);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const fileResult = await this.validateFile(fullPath);
        results.push(fileResult);
      }
    }

    return results;
  }
} 
