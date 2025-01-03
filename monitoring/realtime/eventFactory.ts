import { PerformanceEvent, TestBaseline, MemoryMetrics, ResourceMetrics } from './types';

export function createMemoryEvent(currentMemory: MemoryMetrics, baseline: TestBaseline): PerformanceEvent {
  return {
    type: 'memory',
    timestamp: Date.now(),
    metrics: {
      value: currentMemory.heapUsed,
      unit: 'bytes',
      heapUsed: currentMemory.heapUsed - baseline.memoryBaseline.heapUsed,
      heapTotal: currentMemory.heapTotal,
      external: currentMemory.external,
      arrayBuffers: currentMemory.arrayBuffers
    }
  };
}

export function createTimingEvent(duration: number, baseline: TestBaseline): PerformanceEvent {
  return {
    type: 'timing',
    timestamp: Date.now(),
    metrics: {
      value: duration,
      unit: 'ms',
      startTime: baseline.startTime
    }
  };
}

export function createResourceEvent(currentCPU: ResourceMetrics['cpuUsage']): PerformanceEvent {
  return {
    type: 'resource',
    timestamp: Date.now(),
    metrics: {
      value: (currentCPU.user + currentCPU.system) / 1000000,
      unit: 'ms',
      cpuUsage: (currentCPU.user + currentCPU.system) / 1000000
    }
  };
} 
