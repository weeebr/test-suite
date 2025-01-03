import { fork } from 'child_process';
import { join } from 'path';
import { TestResult, TestGroup, TestStateManager } from '../state';
import { Config } from '../config';
import { glob } from 'glob';

export class TestRunner {
  private stateManager: TestStateManager;
  private completedTests: number = 0;
  private totalTests: number = 0;

  constructor(private config: Config) {
    this.stateManager = new TestStateManager();
  }

  async runTests(): Promise<TestResult[]> {
    const testFiles = await this.findTestFiles();
    this.totalTests = testFiles.length;
    this.completedTests = 0;

    if (testFiles.length === 0) {
      return [{
        file: this.config.targetDirs.join(', '),
        type: 'runtime',
        severity: 'warning',
        message: 'No test files found',
        code: 'NO_TESTS'
      }];
    }

    // Create test groups based on directories
    const groups = this.createTestGroups(testFiles);
    groups.forEach(group => this.stateManager.addGroup(group));

    // Run tests for each group
    for (const group of groups) {
      const groupFiles = testFiles.filter(file => file.includes(group.name));
      
      if (group.parallel && this.config.parallelization.enabled) {
        // Run tests in parallel with max workers limit
        const maxWorkers = group.maxParallel || this.config.parallelization.maxWorkers || 1;
        const chunks = this.chunkArray(groupFiles, maxWorkers);
        for (const chunk of chunks) {
          const workers = chunk.map(file => {
            this.stateManager.startTest(group.name, file);
            return this.runTestInWorker(group.name, file);
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
          file: group.name,
          type: 'runtime',
          severity: 'error',
          message: 'Group timed out',
          code: 'ERR_GROUP_TIMEOUT'
        });
      }
    }

    this.stateManager.finalize();
    return this.stateManager.getAllResults();
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
          process.stdout.write(`\r🧪 Running tests... [${this.completedTests}/${this.totalTests}]`);
          this.stateManager.completeTest(groupName, testFile, {
            ...result,
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
          process.stdout.write(`\r🧪 Running tests... [${this.completedTests}/${this.totalTests}]`);
          this.stateManager.completeTest(groupName, testFile, {
            file: testFile,
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
          process.stdout.write(`\r🧪 Running tests... [${this.completedTests}/${this.totalTests}]`);
          this.stateManager.completeTest(groupName, testFile, {
            file: testFile,
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
          process.stdout.write(`\r🧪 Running tests... [${this.completedTests}/${this.totalTests}]`);
          this.stateManager.completeTest(groupName, testFile, {
            file: testFile,
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
} 
