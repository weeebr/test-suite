import { join } from 'path';
import { stat, readFile } from 'fs/promises';
import { TestSuiteConfig } from '../config';
import { ProjectStateManager, FunctionRegistry } from '../state';
import { TestIssueManager } from '../../management/issues';
import { FunctionExtractor } from './functionExtractor';

export class StructureManager {
  private config: TestSuiteConfig;
  private issueManager: TestIssueManager;
  private projectState: ProjectStateManager;

  constructor(config: TestSuiteConfig, issueManager: TestIssueManager) {
    this.config = config;
    this.issueManager = issueManager;
    this.projectState = ProjectStateManager.getInstance(config.rootDir);
  }

  public async updateStructure(files: string[]): Promise<void> {
    const structure = {
      timestamp: Date.now(),
      files: await Promise.all(files.map(async file => {
        try {
          const fullPath = join(this.config.rootDir, file);
          const stats = await stat(fullPath);
          return {
            path: file,
            size: stats.size,
            lastModified: stats.mtimeMs
          };
        } catch (error) {
          this.issueManager.trackIssue({
            file,
            type: 'structure',
            severity: 'error',
            message: `Error reading file stats: ${error instanceof Error ? error.message : String(error)}`
          });
          return {
            path: file,
            size: 0,
            lastModified: Date.now()
          };
        }
      })),
      directories: Array.from(new Set(files.map(f => join(f, '..'))))
    };

    await this.projectState.updateStructure(structure);
  }

  public async updateRegistry(files: string[]): Promise<void> {
    const allFunctions: FunctionRegistry['functions'] = [];
    for (const file of files) {
      try {
        const fullPath = join(this.config.rootDir, file);
        const content = await readFile(fullPath, 'utf-8');
        const functions = FunctionExtractor.extractFunctions(file, content);
        allFunctions.push(...functions);
      } catch (error) {
        this.issueManager.trackIssue({
          file,
          type: 'structure',
          severity: 'error',
          message: `Error extracting functions: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    const registry: FunctionRegistry = {
      timestamp: Date.now(),
      functions: allFunctions
    };

    await this.projectState.updateRegistry(registry);
  }
} 
