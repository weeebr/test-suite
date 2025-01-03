import { freemem, totalmem } from 'os';
import { ResourceMonitor } from './resourceMonitor';
import { PerformanceEvent, TestBaseline } from './types';

export class EventFactory {
  public static createMemoryEvent(
    testId: string,
    timestamp: number,
    currentMemory: NodeJS.MemoryUsage,
    baseline: TestBaseline
  ): PerformanceEvent {
    return {
      type: 'memory',
      testId,
      timestamp,
      metrics: {
        heapUsed: currentMemory.heapUsed - baseline.memoryBaseline.heapUsed,
        heapTotal: currentMemory.heapTotal - baseline.memoryBaseline.heapTotal,
        external: currentMemory.external - baseline.memoryBaseline.external,
        systemTotal: totalmem(),
        systemFree: freemem(),
        processUsage: process.memoryUsage().heapUsed
      }
    };
  }

  public static createTimingEvent(
    testId: string,
    timestamp: number,
    duration: number,
    timeoutLimit: number,
    baseline: TestBaseline
  ): PerformanceEvent {
    return {
      type: 'timing',
      testId,
      timestamp,
      metrics: {
        startTime: baseline.startTime,
        duration,
        timeoutThreshold: timeoutLimit,
        isTimeout: duration >= timeoutLimit
      }
    };
  }

  public static createResourceEvent(
    testId: string,
    timestamp: number,
    baseline: TestBaseline
  ): PerformanceEvent {
    const currentCPU = process.cpuUsage(baseline.cpuBaseline);
    return {
      type: 'resource',
      testId,
      timestamp,
      metrics: {
        cpuUsage: (currentCPU.user + currentCPU.system) / 1000000,
        cpuLoad: ResourceMonitor.getCPULoad(),
        ioOperations: ResourceMonitor.getIOOperations() - baseline.ioBaseline,
        networkBandwidth: ResourceMonitor.getNetworkBandwidth() - baseline.networkBaseline
      }
    };
  }
} 
