import { TestResult, TestState } from '../../core/state';

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: number;
}

export class TestMetricsManager {
  private metrics: TestMetrics[] = [];

  public trackMetrics(results: TestResult[], state: TestState): void {
    const duration = state.endTime && state.startTime ? state.endTime - state.startTime : 0;
    const metrics: TestMetrics = {
      totalTests: results.length,
      passedTests: results.filter(r => r.severity === 'info').length,
      failedTests: results.filter(r => r.severity === 'error').length,
      skippedTests: results.filter(r => r.severity === 'warning').length,
      duration,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user,
      timestamp: Date.now()
    };

    this.metrics.push(metrics);
  }

  public getLatestMetrics(): TestMetrics | undefined {
    return this.metrics[this.metrics.length - 1];
  }

  public getAllMetrics(): TestMetrics[] {
    return this.metrics;
  }

  public clearMetrics(): void {
    this.metrics = [];
  }
} 
