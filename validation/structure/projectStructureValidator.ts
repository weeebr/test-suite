import { promises as fs } from 'fs';
import { join } from 'path';
import { ProjectStructureConfig } from '../../core/config';

interface ValidationResult {
  file: string;
  issues: Array<{
    message: string;
    severity: 'error' | 'warning';
  }>;
}

interface DirectoryDependency {
  from: string;
  to: string[];
}

export class ProjectStructureValidator {
  private static instance: ProjectStructureValidator;
  private readonly requiredDirectories = [
    'core',
    'interceptors',
    'validation',
    'monitoring',
    'management'
  ];

  private readonly requiredFiles = {
    core: ['config.ts', 'state.ts', 'runner.ts'],
    interceptors: ['build.ts', 'runtime.ts', 'network.ts'],
    validation: ['patterns.ts', 'structure.ts', 'limits.ts'],
    monitoring: ['metrics.ts', 'realtime.ts'],
    management: ['files.ts', 'issues.ts', 'history.ts']
  };

  private readonly directoryDependencies: DirectoryDependency[] = [
    { from: 'interceptors', to: ['core'] },
    { from: 'validation', to: ['core'] },
    { from: 'monitoring', to: ['core', 'interceptors'] },
    { from: 'management', to: ['core'] }
  ];

  private readonly ignoredPaths = [
    'node_modules',
    'dist',
    'coverage',
    '.git',
    '.vscode',
    '.idea'
  ];

  private constructor(_config?: ProjectStructureConfig) {}

  public static getInstance(config?: ProjectStructureConfig): ProjectStructureValidator {
    if (!ProjectStructureValidator.instance) {
      ProjectStructureValidator.instance = new ProjectStructureValidator(config);
    }
    return ProjectStructureValidator.instance;
  }

  public async validateDirectory(dir: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate required directories
    const directoryResults = await this.validateRequiredDirectories(dir);
    results.push(...directoryResults);

    // Validate required files
    const fileResults = await this.validateRequiredFiles(dir);
    results.push(...fileResults);

    // Validate directory dependencies
    const dependencyResults = await this.validateDirectoryDependencies(dir);
    results.push(...dependencyResults);

    return results;
  }

  private async validateRequiredDirectories(dir: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const missingDirs: string[] = [];

    for (const requiredDir of this.requiredDirectories) {
      try {
        await fs.access(join(dir, requiredDir));
      } catch {
        missingDirs.push(requiredDir);
      }
    }

    if (missingDirs.length > 0) {
      results.push({
        file: dir,
        issues: [{
          message: `Missing required directories: ${missingDirs.join(', ')}`,
          severity: 'error'
        }]
      });
    }

    return results;
  }

  private async validateRequiredFiles(dir: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const [directory, files] of Object.entries(this.requiredFiles)) {
      const dirPath = join(dir, directory);
      const missingFiles: string[] = [];

      for (const file of files) {
        try {
          await fs.access(join(dirPath, file));
        } catch {
          missingFiles.push(file);
        }
      }

      if (missingFiles.length > 0) {
        results.push({
          file: dirPath,
          issues: [{
            message: `Missing required files in ${directory}: ${missingFiles.join(', ')}`,
            severity: 'error'
          }]
        });
      }
    }

    return results;
  }

  private async validateDirectoryDependencies(dir: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const dependency of this.directoryDependencies) {
      const fromDir = join(dir, dependency.from);
      const files = await this.collectTsFiles(fromDir);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const imports = this.extractImports(content);
        const invalidImports = this.findInvalidImports(file, imports, dependency.to);

        if (invalidImports.length > 0) {
          results.push({
            file,
            issues: invalidImports.map(imp => ({
              message: `Invalid import from ${dependency.from}: ${imp}`,
              severity: 'error'
            }))
          });
        }
      }
    }

    return results;
  }

  private async collectTsFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (this.ignoredPaths.includes(entry.name)) continue;

      if (entry.isDirectory()) {
        const dirFiles = await this.collectTsFiles(fullPath);
        files.push(...dirFiles);
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private findInvalidImports(_file: string, imports: string[], allowedDeps: string[]): string[] {
    return imports.filter(imp => !allowedDeps.some(dep => imp.startsWith(dep)));
  }
} 
