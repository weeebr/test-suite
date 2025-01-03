import { EventEmitter } from 'events';

export interface PerformanceEvent {
  type: 'memory' | 'timing' | 'resource';
  testId: string;
  timestamp: number;
  metrics: Record<string, number>;
}

export class PerformanceMonitor extends EventEmitter {
  private static instance: PerformanceMonitor;
  private events: PerformanceEvent[] = [];
  private activeTests = new Map<string, { startTime: number }>();
  private memoryLimit = Infinity;
  private timeoutLimit = Infinity;

  private constructor() {
    super();
    this.setupMonitoring();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupMonitoring(): void {
    setInterval(() => {
      for (const [testId, test] of this.activeTests.entries()) {
        // Check memory limit
        const memoryUsage = process.memoryUsage().heapUsed;
        if (memoryUsage > this.memoryLimit) {
          this.endTest(testId);
          continue;
        }

        // Check timeout limit
        if (Date.now() - test.startTime > this.timeoutLimit) {
          this.endTest(testId);
          continue;
        }

        // Track metrics
        this.trackMetrics(testId);
      }
    }, 100);
  }

  private trackMetrics(testId: string): void {
    const memoryEvent: PerformanceEvent = {
      type: 'memory',
      testId,
      timestamp: Date.now(),
      metrics: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal
      }
    };
    this.events.push(memoryEvent);
    this.emit('performanceEvent', memoryEvent);

    const resourceEvent: PerformanceEvent = {
      type: 'resource',
      testId,
      timestamp: Date.now(),
      metrics: {
        cpuUsage: process.cpuUsage().user
      }
    };
    this.events.push(resourceEvent);
    this.emit('performanceEvent', resourceEvent);
  }

  public startTest(testId: string): void {
    this.activeTests.set(testId, { startTime: Date.now() });
  }

  public endTest(testId: string): void {
    const test = this.activeTests.get(testId);
    if (test) {
      const timingEvent: PerformanceEvent = {
        type: 'timing',
        testId,
        timestamp: Date.now(),
        metrics: {
          duration: Date.now() - test.startTime
        }
      };
      this.events.push(timingEvent);
      this.emit('performanceEvent', timingEvent);
      this.activeTests.delete(testId);
    }
  }

  public setMemoryLimit(bytes: number): void {
    this.memoryLimit = bytes;
  }

  public setTimeoutLimit(ms: number): void {
    this.timeoutLimit = ms;
  }

  public isTestRunning(testId: string): boolean {
    return this.activeTests.has(testId);
  }

  public getEvents(): PerformanceEvent[] {
    return this.events;
  }

  public getEventsByType(type: PerformanceEvent['type']): PerformanceEvent[] {
    return this.events.filter(e => e.type === type);
  }

  public getEventsByTest(testId: string): PerformanceEvent[] {
    return this.events.filter(e => e.testId === testId);
  }

  public clearEvents(): void {
    this.events = [];
  }
} 
