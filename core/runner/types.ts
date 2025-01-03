import { TestSuiteConfig } from '../config';

export interface RunnerOptions {
  config: TestSuiteConfig;
  watchMode?: boolean;
  workers?: number;
}

export interface Task {
  id: string;
  execute: () => Promise<void>;
}
