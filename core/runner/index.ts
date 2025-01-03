import { TestSuiteConfig, defaultConfig } from '../config';
import { TestState, TestResult } from '../state';
import { TestMetricsCollector } from '../../monitoring/metrics';
import { TestIssueManager } from '../../management/issues';
import { FileCollector } from './fileCollector';
import { WorkerPool } from '../workers/pool';
import { StructureManager } from './structureManager';

export * from './types';

export class TestRunner {
  private config: TestSuiteConfig;
  private state: TestState;
  private metrics: TestMetricsCollector;
  private issueManager: TestIssueManager;
  private workerPool: WorkerPool;
  private fileCollector: FileCollector;
  private structureManager: StructureManager;
  private isRootRunner: boolean;

  public constructor(config: Partial<TestSuiteConfig> = {}, isRootRunner = false) {
    this.config = { ...defaultConfig, ...config };
    this.state = new TestState();
    this.metrics = new TestMetricsCollector();
    this.issueManager = new TestIssueManager();
    this.workerPool = new WorkerPool(
      this.config,
      (result: TestResult) => this.state.addResult(result),
      () => {}
    );
    this.fileCollector = new FileCollector(this.config, this.issueManager);
    this.structureManager = new StructureManager(this.config, this.issueManager);
    this.isRootRunner = isRootRunner;
  }

  public async collectFiles(): Promise<string[]> {
    try {
      const files = await this.fileCollector.collectFiles();
      await this.structureManager.updateStructure(files);
      await this.structureManager.updateRegistry(files);
      return files;
    } catch (error) {
      this.issueManager.trackIssue({
        file: 'test-runner',
        type: 'structure',
        severity: 'error',
        message: `Error collecting files: ${error instanceof Error ? error.message : String(error)}`
      });
      return [];
    }
  }

  public async runTests(): Promise<TestResult[]> {
    try {
      const files = await this.collectFiles();
      this.state.clear();

      if (files.length === 0) {
        const result: TestResult = {
          file: 'test-runner',
          type: 'structure',
          severity: 'error',
          message: 'No test files found'
        };
        this.state.addResult(result);
        return [result];
      }

      // Filter test files
      const testFiles = files.filter(file => {
        const pattern = this.config.structure?.patterns.test ?? this.config.testPattern;
        return pattern?.test(file) ?? false;
      });

      if (testFiles.length === 0) {
        const result: TestResult = {
          file: 'test-runner',
          type: 'structure',
          severity: 'error',
          message: 'No matching test files found'
        };
        this.state.addResult(result);
        return [result];
      }

      await this.workerPool.start(testFiles);
      const results = this.state.getResults();

      if (this.isRootRunner) {
        const summary = this.state.getSummary();
        this.metrics.updateMetrics({
          fileCount: summary.totalFiles,
          totalDuration: summary.duration
        });
      }

      return results;
    } catch (error) {
      const errorResult: TestResult = {
        file: 'test-runner',
        type: 'runtime',
        severity: 'error',
        message: `Error running tests: ${error instanceof Error ? error.message : String(error)}`
      };
      this.state.addResult(errorResult);
      return [errorResult];
    }
  }

  public getState(): TestState {
    return this.state;
  }
} 
