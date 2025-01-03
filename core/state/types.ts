export type TestSeverity = 'info' | 'warning' | 'error';
export type TestType = 'runtime' | 'module' | 'syntax';

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
  group?: string;
}

export interface TestGroup {
  name: string;
  pattern: string;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  parallel?: boolean;
  timeout?: number;
  maxParallel?: number;
}

export interface TestState {
  groups: Map<string, TestGroup>;
  results: Map<string, TestResult[]>;
  running: Set<string>;
  completed: Set<string>;
  startTime: number;
  endTime?: number;
} 
