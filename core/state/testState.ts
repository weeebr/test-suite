import { TestResult, TestSummary } from './types';

export class TestState {
  private results: TestResult[] = [];
  private startTime: number;

  public constructor() {
    this.startTime = Date.now();
  }

  public addResult(result: TestResult): void {
    this.results.push(result);
  }

  public clear(): void {
    this.results = [];
    this.startTime = Date.now();
  }

  public getResults(): TestResult[] {
    return this.results;
  }

  public getSummary(): TestSummary {
    const fileResults = new Map<string, TestResult[]>();
    
    // Group results by file
    for (const result of this.results) {
      const results = fileResults.get(result.file) || [];
      results.push(result);
      fileResults.set(result.file, results);
    }

    // Count files with errors
    let failedFiles = 0;
    for (const results of fileResults.values()) {
      if (results.some(r => r.severity === 'error')) {
        failedFiles++;
      }
    }

    const totalFiles = fileResults.size;

    return {
      totalFiles,
      passedFiles: totalFiles - failedFiles,
      failedFiles,
      duration: Date.now() - this.startTime
    };
  }
} 
