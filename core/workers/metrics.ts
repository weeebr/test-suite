export type WorkerStatus = 'starting' | 'running' | 'completed' | 'failed';

export interface WorkerMetrics {
  pid: number;
  memory: number;
  memoryUsage: number;
  cpuUsage: number;
  startTime: number;
  lastActivity: number;
  status: WorkerStatus;
  file: string;
}

export class WorkerMetricsManager {
  private metrics = new Map<number, WorkerMetrics>();

  updateMetrics(pid: number, metrics: WorkerMetrics): void {
    this.metrics.set(pid, metrics);
  }

  getMetrics(pid: number): WorkerMetrics | undefined {
    return this.metrics.get(pid);
  }

  clear(): void {
    this.metrics.clear();
  }

  getAggregateMetrics(): { totalMemory: number; averageMemory: number; workerStatuses: Record<string, number> } {
    const workers = Array.from(this.metrics.values());
    const totalMemory = workers.reduce((sum, m) => sum + m.memory, 0);
    const averageMemory = workers.length ? totalMemory / workers.length : 0;

    const workerStatuses = workers.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalMemory, averageMemory, workerStatuses };
  }
} 
