import { fork } from 'child_process';
import { join } from 'path';
import { TestResult, TestGroup, TestStateManager, TestType, TestSeverity } from '../state';
import { Config } from '../config';
import { glob } from 'glob';
import { ConsoleInterceptor } from '../../monitoring/realtime/consoleInterceptor';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';
import { formatTestError } from '../../monitoring/realtime/error/testErrorFormatter';
import { formatTestSummary } from '../../monitoring/realtime/error/testSummaryFormatter';

export class TestRunner {
  private stateManager: TestStateManager;
  private completedTests: number = 0;
  private totalTests: number = 0;
  private consoleInterceptor: ConsoleInterceptor;
  private errorInterceptor: ErrorInterceptor;

  constructor(private config: Config) {
    this.consoleInterceptor = ConsoleInterceptor.getInstance();
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.stateManager = new TestStateManager();
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.errorInterceptor.registerErrorHandler('assertion', (error: Error) => {
      console.error(formatTestError({
        type: 'runtime' as TestType,
        severity: 'error' as TestSeverity,
        message: error.message,
        file: error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[1] || 'unknown'
      }));
    });

    this.errorInterceptor.registerErrorHandler('timeout', (error: Error) => {
      console.error(formatTestError({
        type: 'runtime' as TestType,
        severity: 'error' as TestSeverity,
        message: error.message,
        file: error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[1] || 'unknown'
      }));
    });
  }

  private formatFilePath(file: string): string {
    // For system-level errors (no test files, etc)
    if (file === 'test-runner') return file;
    
    // Try to make path relative to project root
    const rootDir = this.config.rootDir;
    if (file.startsWith(rootDir)) {
      file = file.substring(rootDir.length + 1);
    }
    
    // Clean up any remaining absolute path segments
    return file.replace(/^\/+/, '');
  }

  async runTests(): Promise<TestResult[]> {
    try {
      const testFiles = await this.findTestFiles();
      this.totalTests = testFiles.length;
      this.completedTests = 0;

      if (testFiles.length === 0) {
        const error = new Error('No test files found');
        const result: TestResult = {
          file: 'test-runner',
          type: 'runtime',
          severity: 'warning',
          message: error.message,
          code: 'NO_TESTS'
        };
        console.error(formatTestError(result));
        return [result];
      }

      // Create test groups based on directories
      const groups = this.createTestGroups(testFiles);
      groups.forEach(group => {
        try {
          this.stateManager.addGroup(group);
        } catch (error) {
          const result: TestResult = {
            file: this.formatFilePath(group.name),
            type: 'runtime',
            severity: 'error',
            message: (error as Error).message,
            code: 'ERR_GROUP_CREATION'
          };
          console.error(formatTestError(result));
        }
      });

      // Run tests for each group
      for (const group of groups) {
        const groupFiles = testFiles.filter(file => file.includes(group.name));
        
        if (group.parallel && this.config.parallelization.enabled) {
          // Run tests in parallel with max workers limit
          const maxWorkers = group.maxParallel || this.config.parallelization.maxWorkers || 1;
          const chunks = this.chunkArray(groupFiles, maxWorkers);
          for (const chunk of chunks) {
            const workers = chunk.map(file => {
              try {
                this.stateManager.startTest(group.name, file);
                return this.runTestInWorker(group.name, file);
              } catch (error) {
                this.errorInterceptor.trackError('runtime', error as Error, {
                  severity: 'error',
                  phase: 'test_start',
                  details: { group: group.name, file }
                });
                return Promise.reject(error);
              }
            });
            await Promise.all(workers);
          }
        } else {
          // Run tests sequentially
          for (const file of groupFiles) {
            this.stateManager.startTest(group.name, file);
            await this.runTestInWorker(group.name, file);
          }
        }

        // Check if group timed out
        if (!this.stateManager.isGroupComplete(group.name)) {
          this.stateManager.completeTest(group.name, group.name, {
            file: this.formatFilePath(group.name),
            type: 'runtime',
            severity: 'error',
            message: 'Group timed out',
            code: 'ERR_GROUP_TIMEOUT'
          });
        }
      }

      this.stateManager.finalize();
      const results = this.stateManager.getAllResults();
      console.log(formatTestSummary(results));
      return results;
    } catch (error) {
      const err = error as Error;
      this.errorInterceptor.trackError('runtime', err, {
        severity: 'error',
        phase: 'test_run',
        details: {}
      });
      const result: TestResult = {
        type: 'runtime',
        severity: 'error',
        message: err.message,
        file: 'test-runner'
      };
      console.error(formatTestError(result));
      throw error;
    }
  }

  private createTestGroups(files: string[]): TestGroup[] {
    // Extract unique directories from test files
    const dirs = new Set(files.map(file => {
      const parts = file.split('/');
      return parts[0]; // Get top-level directory
    }));

    // Create a group for each directory
    return Array.from(dirs).map(dir => ({
      name: dir,
      pattern: `${dir}/**/*.${this.config.testType}.test.ts`,
      parallel: true,
      maxParallel: this.config.parallelization.maxWorkers,
      timeout: this.config.parallelization.groupTimeout
    }));
  }

  private async findTestFiles(): Promise<string[]> {
    const files = await this.collectFiles();
    
    // Filter based on test type
    if (this.config.testType === 'all') {
      return files;
    }
    
    return files.filter(file => {
      if (this.config.testType === 'self') {
        return file.includes('.self.test.ts');
      }
      return file.includes(`.${this.config.testType}.test.ts`);
    });
  }

  async collectFiles(): Promise<string[]> {
    const patterns = this.config.targetDirs.map(dir => 
      join(this.config.rootDir, dir, '**', '*.test.ts')
    );
    
    const files = await glob(patterns, {
      ignore: this.config.exclude.map(pattern => `**/${pattern}/**`),
      nodir: true
    });

    return files;
  }

  private async runTestInWorker(groupName: string, testFile: string): Promise<void> {
    return new Promise((resolve) => {
      const worker = fork(join(__dirname, '../workers/worker.js'), [], {
        env: { ...process.env, TS_NODE_PROJECT: join(process.cwd(), 'tsconfig.json') }
      });

      let hasResolved = false;
      const startTime = Date.now();

      worker.on('message', (result: TestResult) => {
        if (!hasResolved) {
          hasResolved = true;
          this.completedTests++;
          process.stdout.write(`\r\r🧪 Running tests... [${this.completedTests}/${this.totalTests}]`);
          this.stateManager.completeTest(groupName, testFile, {
            ...result,
            file: this.formatFilePath(result.file),
            duration: Date.now() - startTime
          });
          worker.kill();
          resolve();
        }
      });

      worker.on('error', (error) => {
        if (!hasResolved) {
          hasResolved = true;
          this.completedTests++;
          this.stateManager.completeTest(groupName, testFile, {
            file: this.formatFilePath(testFile),
            type: 'runtime',
            severity: 'error',
            message: error.message,
            code: 'ERR_WORKER',
            stack: error.stack,
            duration: Date.now() - startTime
          });
          worker.kill();
          resolve();
        }
      });

      worker.on('exit', (code) => {
        if (!hasResolved) {
          hasResolved = true;
          this.completedTests++;
          this.stateManager.completeTest(groupName, testFile, {
            file: this.formatFilePath(testFile),
            type: 'runtime',
            severity: 'error',
            message: `Worker exited with code ${code}`,
            code: 'ERR_WORKER_EXIT',
            duration: Date.now() - startTime
          });
          resolve();
        }
      });

      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          this.completedTests++;
          this.stateManager.completeTest(groupName, testFile, {
            file: this.formatFilePath(testFile),
            type: 'runtime',
            severity: 'error',
            message: 'Test timed out',
            code: 'ERR_TIMEOUT',
            duration: Date.now() - startTime
          });
          worker.kill();
          resolve();
        }
      }, this.config.parallelization.testTimeout || 30000);

      worker.send(testFile);
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  public cleanup(): void {
    this.consoleInterceptor.restore();
  }
} 
