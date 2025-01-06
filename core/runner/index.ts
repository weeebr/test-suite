import { fork } from 'child_process';
import { join } from 'path';
import { TestResult, TestStateManager } from '../state';
import { Config } from '../config';
import { glob } from 'glob';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';
import { formatTestError } from '../../monitoring/realtime/error/testErrorFormatter';

export class TestRunner {
  private stateManager: TestStateManager;
  private completedTests: number = 0;
  private errorInterceptor: ErrorInterceptor;

  constructor(private config: Config) {
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.stateManager = new TestStateManager();
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.errorInterceptor.registerErrorHandler('assertion', (error: Error) => {
      console.error(formatTestError({
        type: 'runtime',
        severity: 'error',
        message: error.message,
        file: error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[1] || 'unknown'
      }));
    });

    this.errorInterceptor.registerErrorHandler('timeout', (error: Error) => {
      console.error(formatTestError({
        type: 'runtime',
        severity: 'error',
        message: error.message,
        file: error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[1] || 'unknown'
      }));
    });
  }

  private formatFilePath(file: string): string {
    return file.replace(this.config.rootDir + '/', '');
  }

  async collectFiles(): Promise<string[]> {
    const patterns = [
      // Include tests from targetDirs and validation
      ...this.config.targetDirs.map(dir => 
        join(this.config.rootDir, dir, '**', '*.test.ts')
      ),
      join(this.config.rootDir, 'validation', '**', '*.test.ts')
    ];
    
    const files = await glob(patterns, {
      ignore: this.config.exclude.map(pattern => `**/${pattern}/**`),
      nodir: true
    });

    return files.map(file => file.replace(this.config.rootDir + '/', ''));
  }

  async runTests(): Promise<TestResult[]> {
    const files = await this.collectFiles();
    const groups = this.groupFiles(files);

    // Initialize groups
    for (const group of groups) {
      this.stateManager.initializeGroup(group.name, group.files);
    }

    // Run tests in parallel
    const promises = groups.map(group => this.runGroup(group.name, group.files));
    await Promise.all(promises);

    return this.stateManager.getResults();
  }

  public groupFiles(files: string[]): { name: string; files: string[] }[] {
    const groups: { name: string; files: string[] }[] = [];

    // Group frontend tests
    const frontendTests = files.filter(file => file.includes('.frontend.test.ts'));
    if (frontendTests.length > 0) {
      groups.push({
        name: 'frontend',
        files: frontendTests
      });
    }

    // Group validation tests
    const validationTests = files.filter(file => file.includes('validation/'));
    if (validationTests.length > 0) {
      groups.push({
        name: 'validation',
        files: validationTests
      });
    }

    // Group self tests
    const selfTests = files.filter(file => file.includes('.self.test.ts'));
    if (selfTests.length > 0) {
      groups.push({
        name: 'self',
        files: selfTests
      });
    }

    // Group remaining tests
    const remainingTests = files.filter(file => 
      !file.includes('.frontend.test.ts') && 
      !file.includes('validation/') && 
      !file.includes('.self.test.ts')
    );
    if (remainingTests.length > 0) {
      groups.push({
        name: 'tests',
        files: remainingTests
      });
    }

    return groups;
  }

  private async runGroup(groupName: string, files: string[]): Promise<void> {
    const maxWorkers = this.config.parallelization.maxWorkers || 1;
    const chunks = this.chunkArray(files, maxWorkers);

    for (const chunk of chunks) {
      const promises = chunk.map(file => this.runTestInWorker(groupName, file));
      await Promise.all(promises);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async runTestInWorker(groupName: string, testFile: string): Promise<void> {
    return new Promise((resolve) => {
      const worker = fork(join(__dirname, '../workers/worker.js'), [], {
        env: { 
          ...process.env, 
          TS_NODE_PROJECT: join(process.cwd(), 'tsconfig.json'),
          TEST_ROOT_DIR: this.config.rootDir
        }
      });

      let hasResolved = false;
      const startTime = Date.now();

      // Show test starting
      process.stdout.write(`\n🧪 Running test: ${this.formatFilePath(testFile)}...`);

      const cleanup = () => {
        if (worker && !worker.killed) {
          worker.kill();
        }
      };

      const completeTest = (result: TestResult) => {
        if (!hasResolved) {
          hasResolved = true;
          this.completedTests++;
          
          // Print console output if any
          if (result.consoleOutput?.length) {
            console.log('\nConsole output from test:');
            console.log('─'.repeat(30));
            result.consoleOutput.forEach(line => console.log(line));
            console.log('─'.repeat(30), '\n');
          }

          this.stateManager.completeTest(groupName, testFile, {
            ...result,
            file: this.formatFilePath(result.file),
            duration: Date.now() - startTime
          });
          cleanup();
          resolve();
        }
      };

      worker.on('message', (result: TestResult) => {
        completeTest(result);
      });

      worker.on('error', (error) => {
        completeTest({
          file: this.formatFilePath(testFile),
          type: 'runtime',
          severity: 'error',
          message: error.message,
          code: 'ERR_WORKER',
          stack: error.stack
        });
      });

      worker.on('exit', (code) => {
        if (!hasResolved && code !== 0) {
          completeTest({
            file: this.formatFilePath(testFile),
            type: 'runtime',
            severity: 'error',
            message: `Worker exited with code ${code}`,
            code: 'ERR_WORKER_EXIT'
          });
        }
      });

      const timeoutId = setTimeout(() => {
        completeTest({
          file: this.formatFilePath(testFile),
          type: 'runtime',
          severity: 'error',
          message: 'Test timed out',
          code: 'ERR_TIMEOUT'
        });
      }, this.config.parallelization.testTimeout || 30000);

      // Ensure timeout is cleared if test completes
      worker.on('message', () => clearTimeout(timeoutId));
      worker.on('error', () => clearTimeout(timeoutId));
      worker.on('exit', () => clearTimeout(timeoutId));

      worker.send(testFile);
    });
  }

  public getProgress(): { completed: number; total: number } {
    return this.stateManager.getProgress();
  }
} 
