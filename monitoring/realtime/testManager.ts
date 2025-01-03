import { ErrorInterceptor } from './errorInterceptor';
import { ResourceMonitor } from './resourceMonitor';
import { TestBaseline } from './types';

export class TestManager {
  private activeTests = new Map<string, TestBaseline>();
  private errorInterceptor: ErrorInterceptor;
  private memoryLimit: number;
  private timeoutLimit: number;

  constructor(memoryLimit: number, timeoutLimit: number) {
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.memoryLimit = memoryLimit;
    this.timeoutLimit = timeoutLimit;
    this.setupCleanupInterval();
  }

  private setupCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [testId, data] of this.activeTests.entries()) {
        if (now - data.startTime > this.timeoutLimit) {
          this.endTest(testId);
          const error = new Error(`Test ${testId} exceeded timeout limit`);
          (error as any).context = {
            timeoutLimit: this.timeoutLimit,
            actualDuration: now - data.startTime
          };
          this.errorInterceptor.trackError('runtime', error);
        }
      }
    }, 1000);
  }

  public startTest(testId: string): void {
    if (this.activeTests.has(testId)) {
      throw new Error(`Test ${testId} is already running`);
    }

    const baseline: TestBaseline = {
      startTime: Date.now(),
      memoryBaseline: process.memoryUsage(),
      cpuBaseline: process.cpuUsage(),
      ioBaseline: ResourceMonitor.getIOOperations(),
      networkBaseline: ResourceMonitor.getNetworkBandwidth()
    };

    this.activeTests.set(testId, baseline);
    this.checkMemoryLimit(testId);
  }

  private checkMemoryLimit(testId: string): void {
    const interval = setInterval(() => {
      if (!this.activeTests.has(testId)) {
        clearInterval(interval);
        return;
      }

      const memoryUsage = process.memoryUsage().heapUsed;
      if (memoryUsage > this.memoryLimit) {
        this.endTest(testId);
        const error = new Error(`Test ${testId} exceeded memory limit`);
        (error as any).context = {
          memoryLimit: this.memoryLimit,
          actualUsage: memoryUsage
        };
        this.errorInterceptor.trackError('runtime', error);
      }
    }, 100);
  }

  public endTest(testId: string): void {
    this.activeTests.delete(testId);
  }

  public getTest(testId: string): TestBaseline | undefined {
    return this.activeTests.get(testId);
  }

  public getActiveTests(): string[] {
    return Array.from(this.activeTests.keys());
  }

  public isTestRunning(testId: string): boolean {
    return this.activeTests.has(testId);
  }

  public setMemoryLimit(limit: number): void {
    this.memoryLimit = limit;
  }

  public getMemoryLimit(): number {
    return this.memoryLimit;
  }

  public setTimeoutLimit(limit: number): void {
    this.timeoutLimit = limit;
  }

  public getTimeoutLimit(): number {
    return this.timeoutLimit;
  }
} 
