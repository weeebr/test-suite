import { Config } from '../config';

export class FileValidator {
  constructor(private config: Config) {}

  public isValidFile(filePath: string): boolean {
    // Skip excluded directories
    if (this.config.exclude.some(pattern => filePath.includes(pattern))) {
      return false;
    }

    // Check if file is in target directories
    if (!this.config.targetDirs.some(dir => filePath.startsWith(dir))) {
      return false;
    }

    return this.config.testPattern.test(filePath);
  }

  public isMatchingTestType(filePath: string): boolean {
    if (!this.isValidFile(filePath)) {
      return false;
    }

    switch (this.config.testType) {
      case 'self':
        return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) && 
          !filePath.includes('.frontend.') && 
          !filePath.includes('.backend.');
      case 'frontend':
        return /\.frontend\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);
      case 'backend':
        return /\.backend\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath);
      case 'all':
        return true;
      default:
        return false;
    }
  }
} 
