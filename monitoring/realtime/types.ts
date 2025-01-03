import { TestResult } from '../../core/state';

// Base event type
export interface BaseEvent {
  timestamp: number;
  source: string;
}

// Error types
export type ErrorCategory = 
  | 'build'      // Webpack, TypeScript compilation
  | 'runtime'    // Node.js runtime errors
  | 'network'    // HTTP, WebSocket, API calls
  | 'console'    // Console.error, warn, info
  | 'process'    // Process exits, signals
  | 'memory'     // Memory leaks, limits
  | 'timeout'    // Test timeouts
  | 'assertion'  // Test assertions
  | 'validation' // Type checks, schema validation
  | 'system'     // OS, file system
  | 'module'     // Module loading/resolution
  | 'express'    // Express.js errors
  | 'webpack'    // Webpack build errors
  | 'typescript' // TypeScript compiler errors
  | 'internal'   // Error interceptor internal errors
  | 'uncaught'   // Uncaught exceptions and rejections
  | 'unknown';   // Uncategorized

export interface BaseErrorContext {
  severity?: 'info' | 'warning' | 'error';
  phase?: string;
  source?: string;
  details?: {
    originalArgs?: unknown[];
    hasError?: boolean;
    stack?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ErrorContext extends BaseErrorContext {
  category: ErrorCategory;
  severity: 'info' | 'warning' | 'error';
  source: string;
  timestamp: number;
}

export interface ErrorEvent extends BaseEvent {
  type: ErrorCategory;
  error: Error;
  context: BaseErrorContext;
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
