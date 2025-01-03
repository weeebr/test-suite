import { Config, TestPatterns } from '../config';

export class FileValidator {
  constructor(private config: Config) {}

  private isValidExtension(filePath: string): boolean {
    return this.config.testFileExtensions.some(ext => filePath.endsWith(ext));
  }

  private matchesPattern(filePath: string, pattern: RegExp | TestPatterns): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(filePath);
    }

    // For TestPatterns object
    const { testType } = this.config;
    
    // First check if it matches the base test pattern
    if (!pattern.test.test(filePath)) {
      return false;
    }

    // Then check specific test type pattern if it exists
    switch (testType) {
      case 'unit':
        return pattern.unit ? pattern.unit.test(filePath) : true;
      case 'integration':
        return pattern.integration ? pattern.integration.test(filePath) : true;
      case 'e2e':
        return pattern.e2e ? pattern.e2e.test(filePath) : true;
      case 'frontend':
        return pattern.frontend ? pattern.frontend.test(filePath) : true;
      case 'backend':
        return pattern.backend ? pattern.backend.test(filePath) : true;
      case 'self':
        // Self tests are dedicated tests for validating the test runner itself
        return pattern.test.test(filePath) && filePath.includes('.self.test.');
      case 'all':
        return true;
      default:
        return false;
    }
  }

  public isValidFile(filePath: string): boolean {
    // Skip excluded directories
    if (this.config.exclude.some(pattern => filePath.includes(pattern))) {
      return false;
    }

    // Check if file is in target directories
    if (!this.config.targetDirs.some(dir => {
      // Handle glob patterns in targetDirs
      const globToRegex = (glob: string) => new RegExp(
        '^' + glob.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
      );
      return globToRegex(dir).test(filePath);
    })) {
      return false;
    }

    // Check file extension
    if (!this.isValidExtension(filePath)) {
      return false;
    }

    return this.matchesPattern(filePath, this.config.testPattern);
  }

  public isMatchingTestType(filePath: string): boolean {
    return this.isValidFile(filePath);
  }
} 
