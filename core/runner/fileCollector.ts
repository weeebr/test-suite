import { promises as fs } from 'fs';
import { join, relative } from 'path';
import { TestSuiteConfig } from '../config';
import { TestResult } from '../state';
import { TestIssueManager } from '../../management/issues';
import { DirectoryTypeManager } from './directoryTypeManager';
import { FileValidator } from './fileValidator';

export class FileCollector {
  private pendingOperations: Promise<void>[] = [];
  private foundFiles = 0;
  private scannedDirs = 0;
  private directoryTypeManager: DirectoryTypeManager;
  private fileValidator: FileValidator;

  public constructor(
    private config: TestSuiteConfig,
    private issueManager: TestIssueManager
  ) {
    this.directoryTypeManager = new DirectoryTypeManager(config.structure);
    this.fileValidator = new FileValidator(config, config.structure);
  }

  public async collectFiles(): Promise<string[]> {
    const files: string[] = [];
    this.pendingOperations = [];
    this.foundFiles = 0;
    this.scannedDirs = 0;
    
    try {
      const allDirs = this.directoryTypeManager.getAllTargetDirs(this.config.targetDirs);
      for (const dir of allDirs) {
        const fullPath = join(this.config.rootDir, dir);
        await this.walkDir(fullPath, files);
      }
      
      await Promise.all(this.pendingOperations);
      return Array.from(new Set(files)).filter(file => this.fileValidator.isMatchingTestType(file));
    } catch (error) {
      const errorResult: TestResult = {
        file: 'file-collector',
        type: 'structure',
        severity: 'error',
        message: `Error collecting files: ${error instanceof Error ? error.message : String(error)}`
      };
      this.issueManager.trackIssue(errorResult);
      return files;
    }
  }

  private async walkDir(dir: string, files: string[]): Promise<void> {
    if (this.pendingOperations.length >= 50) {
      await Promise.race(this.pendingOperations);
    }

    const operation = (async () => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      this.scannedDirs++;
      
      const subDirPromises: Promise<void>[] = [];
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = relative(this.config.rootDir, fullPath);
        
        if (entry.isDirectory()) {
          const exclude = this.config.structure?.exclude ?? this.config.exclude ?? [];
          if (!this.directoryTypeManager.shouldSkipDirectory(entry.name, exclude)) {
            subDirPromises.push(this.walkDir(fullPath, files));
          }
        } else if (this.fileValidator.isValidFile(entry.name, relativePath)) {
          this.foundFiles++;
          files.push(relativePath);
        }
      }

      await Promise.all(subDirPromises);
    })();

    try {
      this.pendingOperations.push(operation);
      await operation;
    } catch (error) {
      const errorResult: TestResult = {
        file: dir,
        type: 'structure',
        severity: 'error',
        message: `Error reading directory: ${error instanceof Error ? error.message : String(error)}`
      };
      this.issueManager.trackIssue(errorResult);
    } finally {
      const index = this.pendingOperations.findIndex(op => op === operation);
      if (index !== -1) {
        this.pendingOperations.splice(index, 1);
      }
    }
  }
}
