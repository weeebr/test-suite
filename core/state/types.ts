export type TestType = 'runtime' | 'structure' | 'validation';
export type TestSeverity = 'info' | 'warning' | 'error';

export interface TestResult {
  file: string;
  type: TestType;
  severity: TestSeverity;
  message: string;
  code?: string;
  stack?: string;
  line?: number;
  column?: number;
  duration?: number;
  consoleOutput?: string[];
  group?: string;
}

export interface TestGroup {
  name: string;
  files: string[];
  results: TestResult[];
}

export interface TestState {
  groups: Record<string, TestGroup>;
  completedTests: number;
  totalTests: number;
  startTime?: number;
  endTime?: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  groups: Record<string, {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  }>;
}

export interface ProjectStructure {
  directories: {
    tests: string[];
    src: string[];
    config: string[];
  };
  files: {
    tests: string[];
    source: string[];
    config: string[];
  };
}

export interface FunctionRegistry {
  functions: Map<string, {
    name: string;
    file: string;
    line: number;
    column: number;
    type: string;
  }>;
  types: Map<string, {
    name: string;
    file: string;
    line: number;
    column: number;
    kind: string;
  }>;
}

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
  | 'unknown';   // Uncategorized

export interface ErrorContext {
  category: ErrorCategory;
  severity: 'info' | 'warning' | 'error';
  source: string;
  timestamp: number;
  details?: Record<string, any>;
}

export interface ErrorEvent {
  type: ErrorCategory;
  error: Error;
  context: ErrorContext;
  stack?: string;
  source?: string;
  line?: number;
  column?: number;
} 
