export interface TestMetrics {
  fileCount: number;
  averageFileSize: number;
  averageLineLength: number;
  totalDuration: number;
}

export class TestMetricsCollector {
  private metrics: TestMetrics = {
    fileCount: 0,
    averageFileSize: 0,
    averageLineLength: 0,
    totalDuration: 0
  };

  public updateMetrics(metrics: Partial<TestMetrics>): void {
    Object.assign(this.metrics, metrics);
  }

  public getLatestMetrics(): TestMetrics {
    return { ...this.metrics };
  }

  public clear(): void {
    this.metrics = {
      fileCount: 0,
      averageFileSize: 0,
      averageLineLength: 0,
      totalDuration: 0
    };
  }
}
