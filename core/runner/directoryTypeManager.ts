import { ProjectStructureConfig } from '../config';

export class DirectoryTypeManager {
  constructor(private structure: ProjectStructureConfig | undefined) {}

  public getDirectoryType(relativePath: string): keyof ProjectStructureConfig['directories'] | null {
    if (!this.structure) return null;

    const { directories } = this.structure;
    
    if (directories.tests.some(path => relativePath.startsWith(path))) {
      return 'tests';
    }

    for (const [type, paths] of Object.entries(directories)) {
      if (type !== 'tests' && paths.some(path => relativePath.startsWith(path))) {
        return type as keyof ProjectStructureConfig['directories'];
      }
    }

    return null;
  }

  public shouldSkipDirectory(name: string, exclude: string[] = []): boolean {
    return name.startsWith('.') || exclude.includes(name);
  }

  public getAllTargetDirs(targetDirs: string[]): string[] {
    if (!this.structure) {
      return targetDirs;
    }

    const { directories } = this.structure;
    return [
      ...directories.core,
      ...directories.tests,
      ...directories.management,
      ...directories.monitoring
    ];
  }
} 
