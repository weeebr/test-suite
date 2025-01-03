export interface TestMetrics {
  duration: number;
  memory: number;
  cpu: number;
}

export class MetricsManager {
  private static instance: MetricsManager;
  private metrics = new Map<string, TestMetrics>();

  private constructor() {}

  public static getInstance(): MetricsManager {
    if (!MetricsManager.instance) {
      MetricsManager.instance = new MetricsManager();
    }
    return MetricsManager.instance;
  }

  public trackMetrics(testId: string, metrics: TestMetrics): void {
    this.metrics.set(testId, metrics);
  }

  public getMetrics(testId: string): TestMetrics | undefined {
    return this.metrics.get(testId);
  }

  public getAggregateMetrics(): { totalDuration: number; totalMemory: number; averageCpu: number } {
    let totalDuration = 0;
    let totalMemory = 0;
    let totalCpu = 0;
    const count = this.metrics.size;

    for (const metrics of this.metrics.values()) {
      totalDuration += metrics.duration;
      totalMemory += metrics.memory;
      totalCpu += metrics.cpu;
    }

    return {
      totalDuration,
      totalMemory,
      averageCpu: count > 0 ? totalCpu / count : 0
    };
  }

  public clear(): void {
    this.metrics.clear();
  }
} 
