export * from './types';
export * from './testState';
export * from './projectState';

export { ProjectStateManager } from './projectState';
export { TestState } from './testState';

import { TestState } from './testState';
import { ProjectStateManager } from './projectState';

export class StateManager {
  private static instance: StateManager;
  private testState: TestState;
  private projectState: ProjectStateManager;

  private constructor() {
    this.testState = new TestState();
    this.projectState = ProjectStateManager.getInstance(process.cwd());
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public getTestState(): TestState {
    return this.testState;
  }

  public getProjectState(): ProjectStateManager {
    return this.projectState;
  }
}

export type { 
  TestResult,
  TestSummary,
  ProjectStructure,
  FunctionRegistry,
  IssueState,
  TestResultType,
  TestResultSeverity
} from './types';
