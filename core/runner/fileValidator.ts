import { ProjectStructureConfig, TestSuiteConfig } from '../config';
import { DirectoryTypeManager } from './directoryTypeManager';

export class FileValidator {
  private directoryTypeManager: DirectoryTypeManager;

  constructor(
    private config: TestSuiteConfig,
    private structure: ProjectStructureConfig | undefined
  ) {
    this.directoryTypeManager = new DirectoryTypeManager(structure);
  }

  public isValidFile(name: string, relativePath: string): boolean {
    if (!this.structure) {
      return this.config.testPattern?.test(name) ?? false;
    }

    const { patterns } = this.structure;
    const dirType = this.directoryTypeManager.getDirectoryType(relativePath);

    if (dirType === 'tests' as keyof ProjectStructureConfig['directories']) {
      return patterns.test.test(name);
    }

    return patterns.source.test(name);
  }

  public isMatchingTestType(file: string): boolean {
    if (!this.structure) {
      return this.config.testPattern?.test(file) ?? false;
    }

    const dirType = this.directoryTypeManager.getDirectoryType(file);
    if (!dirType) return false;

    if (dirType === 'tests' as keyof ProjectStructureConfig['directories']) {
      return true;
    }

    const { patterns } = this.structure;
    const isTestFile = patterns.test.test(file);

    switch (this.config.testType) {
      case 'self':
        return false;
      case 'frontend':
        return isTestFile && file.startsWith('frontend/');
      case 'backend':
        return isTestFile && file.startsWith('backend/');
      case 'all':
        return isTestFile;
      default:
        return false;
    }
  }
} 
