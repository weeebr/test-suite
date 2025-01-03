export type TestResultType = 'type' | 'structure' | 'runtime';
export type TestResultSeverity = 'info' | 'warning' | 'error';

export interface TestResult {
  file: string;
  type: TestResultType;
  severity: TestResultSeverity;
  message: string;
  line?: number;
  column?: number;
  code?: string;
}

export interface TestSummary {
  totalFiles: number;
  passedFiles: number;
  failedFiles: number;
  duration: number;
}

export interface ProjectStructure {
  timestamp: number;
  files: Array<{
    path: string;
    size: number;
    lastModified: number;
  }>;
  directories: string[];
}

export interface FunctionRegistry {
  timestamp: number;
  functions: Array<{
    name: string;
    type: 'function' | 'type' | 'interface' | 'class';
    file: string;
    exported: boolean;
    async: boolean;
    line: number;
  }>;
}

export interface IssueState {
  error: string;
  file: string;
  created: Date;
  completed: Date;
  category: string;
  context: string;
} 
