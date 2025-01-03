import { join } from 'path';
import { stat, readFile } from 'fs/promises';
import { TestStateManager } from '../state';
import { TestSuiteConfig } from '../config';
import { FileCollector } from './fileCollector';
import { FileValidator } from './fileValidator';
import { FunctionExtractor } from './functionExtractor';
import { TestIssueManager } from '../../management/issues';

export class StructureManager {
  private fileCollector: FileCollector;
  private fileValidator: FileValidator;

  constructor(
    private config: TestSuiteConfig,
    private stateManager: TestStateManager,
    private issueManager: TestIssueManager
  ) {
    this.fileValidator = new FileValidator(config);
    this.fileCollector = new FileCollector(config, issueManager);
  }

  public async collectFiles(): Promise<string[]> {
    return this.fileCollector.collectFiles();
  }

  public async validateFile(filePath: string): Promise<boolean> {
    const fullPath = join(this.config.rootDir, filePath);
    const stats = await stat(fullPath);

    if (!stats.isFile()) {
      return false;
    }

    return this.fileValidator.isValidFile(filePath);
  }

  public async extractFunctions(filePath: string): Promise<string[]> {
    const fullPath = join(this.config.rootDir, filePath);
    const content = await readFile(fullPath, 'utf-8');
    return FunctionExtractor.extractFunctions(content);
  }

  public async updateStructure(filePath: string): Promise<void> {
    if (!await this.validateFile(filePath)) {
      this.issueManager.trackIssue({
        file: filePath,
        type: 'structure',
        message: `Invalid test file: ${filePath}`,
        severity: 'error'
      });
      return;
    }

    const functions = await this.extractFunctions(filePath);
    this.stateManager.addGroup({
      name: filePath,
      pattern: filePath,
      parallel: true,
      setup: async () => {
        if (await this.validateFile(filePath)) {
          const currentFunctions = await this.extractFunctions(filePath);
          if (JSON.stringify(currentFunctions) !== JSON.stringify(functions)) {
            this.issueManager.trackIssue({
              file: filePath,
              type: 'structure',
              message: `Test functions changed during execution`,
              severity: 'warning'
            });
          }
        }
      }
    });
  }
} 
