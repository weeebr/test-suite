import { TestResult } from '../../core/state';

// Base event type
export interface BaseEvent {
  timestamp: number;
  source: string;
}

// Error types
export type ErrorCategory = 'runtime' | 'network' | 'build' | 'test' | 'lint' | 'module';

export interface ErrorEvent extends BaseEvent {
  type: ErrorCategory;
  error: Error;
  context: Record<string, unknown>;
  stack?: string;
  line?: number;
  column?: number;
}

export type ErrorHandler = (error: Error) => void;

// Impact types
export type ImpactSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ImpactMetrics {
  severity: ImpactSeverity;
  affectedComponents: string[];
  cascadingEffects: string[];
  recoverySteps: string[];
  estimatedRecoveryTime: number;
}

export interface ImpactEvent extends BaseEvent {
  type: 'runtime' | 'network' | 'resource';
  metrics: ImpactMetrics;
}

// Network types
export interface NetworkEvent extends BaseEvent {
  type: 'request' | 'response';
  url: string;
  method: string;
  status?: number;
  duration?: number;
  size?: number;
}

// Performance types
export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

export interface ResourceMetrics {
  cpuUsage: {
    user: number;
    system: number;
  };
  memoryUsage: MemoryMetrics;
}

export interface TestBaseline {
  startTime: number;
  memoryBaseline: MemoryMetrics;
  cpuBaseline: {
    user: number;
    system: number;
  };
}

export interface PerformanceEvent {
  type: 'memory' | 'cpu' | 'io' | 'timing' | 'resource';
  timestamp: number;
  testId?: string;
  metrics: {
    value: number;
    unit: string;
    limit?: number;
    heapUsed?: number;
    heapTotal?: number;
    external?: number;
    arrayBuffers?: number;
    cpuUsage?: number;
    startTime?: number;
  };
  context?: Record<string, unknown>;
}

// Resource types
export interface ResourceEvent extends BaseEvent {
  type: 'cpu' | 'memory' | 'io' | 'network';
  usage: number;
  limit: number;
  available: number;
}

// Test types
export interface TestEvent extends BaseEvent {
  type: 'start' | 'end' | 'error';
  testId: string;
  result?: TestResult;
  duration?: number;
} 
