import { promises as fs } from 'fs';
import { resolve } from 'path';
import { glob } from 'glob';

interface FileSizeValidationResult {
  file: string;
  lineCount: number;
  isValid: boolean;
  message: string;
}

export class FileSizeValidator {
  private static instance: FileSizeValidator;
  private readonly maxLines = 150;
  private readonly projectRoot: string;
  private readonly ignoredPaths = [
    'node_modules/**',
    'dist/**',
    'coverage/**',
    '.git/**',
    '.vscode/**',
    '.idea/**'
  ];

  private constructor() {
    // Use the test runner's root directory
    this.projectRoot = process.env.TEST_ROOT_DIR || process.cwd();
  }

  public static getInstance(): FileSizeValidator {
    if (!FileSizeValidator.instance) {
      FileSizeValidator.instance = new FileSizeValidator();
    }
    return FileSizeValidator.instance;
  }

  public async validateFile(filePath: string): Promise<FileSizeValidationResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lineCount = content.split('\n').length;
    const relativePath = filePath.replace(this.projectRoot + '/', '');

    return {
      file: relativePath,
      lineCount,
      isValid: lineCount <= this.maxLines,
      message: lineCount > this.maxLines 
        ? `${relativePath} exceeds ${this.maxLines} lines (current: ${lineCount})`
        : `File size is within limit (${lineCount} lines)`
    };
  }

  public async validateDirectory(dir: string): Promise<FileSizeValidationResult[]> {
    const results: FileSizeValidationResult[] = [];
    const absoluteDir = resolve(this.projectRoot, dir);
    console.log('Project root:', this.projectRoot);
    console.log('Validating directory:', absoluteDir);
    
    try {
      // Find all TypeScript files in the directory
      const patterns = [
        '**/*.ts',
        '!**/*.test.ts', // Exclude test files
        '!**/*.d.ts'     // Exclude type definition files
      ];
      console.log('Search patterns:', patterns);
      const files = await glob(patterns, {
        ignore: this.ignoredPaths,
        absolute: true,
        cwd: absoluteDir,
        nodir: true,
        dot: false
      });
      console.log('Found files:', files);

      for (const file of files) {
        console.log('Validating file:', file);
        const fileResult = await this.validateFile(file);
        console.log('File result:', fileResult);
        results.push(fileResult);
      }
    } catch (error: any) {
      console.error('Error validating directory:', absoluteDir, error);
      console.error('Stack trace:', error.stack);
    }

    return results;
  }
} 
