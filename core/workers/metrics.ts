import { Worker } from 'worker_threads';

export interface WorkerMetrics {
  memoryUsage: number;
  cpuUsage: number;
  startTime: number;
  lastActivity: number;
  file: string;
}

export class WorkerMetricsManager {
  private metrics = new Map<Worker, WorkerMetrics>();

  public setMetrics(worker: Worker, metrics: WorkerMetrics): void {
    this.metrics.set(worker, metrics);
  }

  public updateMetrics(worker: Worker, update: Partial<WorkerMetrics>): void {
    const current = this.metrics.get(worker);
    if (current) {
      this.metrics.set(worker, { ...current, ...update });
    }
  }

  public getMetrics(worker: Worker): WorkerMetrics | undefined {
    return this.metrics.get(worker);
  }

  public deleteMetrics(worker: Worker): void {
    this.metrics.delete(worker);
  }

  public clear(): void {
    this.metrics.clear();
  }

  public getAggregateMetrics(): { totalMemory: number; averageMemory: number; peakMemory: number } {
    let totalMemory = 0;
    let peakMemory = 0;
    let count = 0;

    for (const metrics of this.metrics.values()) {
      totalMemory += metrics.memoryUsage;
      peakMemory = Math.max(peakMemory, metrics.memoryUsage);
      count++;
    }

    return {
      totalMemory,
      averageMemory: count > 0 ? totalMemory / count : 0,
      peakMemory
    };
  }
} 
