import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { EventEmitter } from 'events';
import { ProjectStructure, FunctionRegistry } from '../core/state';
import { ErrorInterceptor } from '../monitoring/realtime/errorInterceptor';

interface StateFiles {
  structure: string;
  functions: string;
  history: string;
}

interface TestHistoryEntry {
  timestamp: number;
  testId: string;
  duration: number;
  result: 'pass' | 'fail';
  memoryUsage: number;
  cpuUsage: number;
}

export class StateManager extends EventEmitter {
  private static instance: StateManager;
  private stateDir: string;
  private stateFiles: StateFiles;
  private errorInterceptor: ErrorInterceptor;
  private currentState: {
    structure?: ProjectStructure;
    functions?: FunctionRegistry;
    history: TestHistoryEntry[];
  };

  private constructor() {
    super();
    this.stateDir = join(process.cwd(), 'project-state');
    this.stateFiles = {
      structure: join(this.stateDir, 'structure.json'),
      functions: join(this.stateDir, 'functions.json'),
      history: join(this.stateDir, 'history.json')
    };
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.currentState = { history: [] };
    this.initializeState();
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  private async initializeState(): Promise<void> {
    try {
      const [structure, functions, history] = await Promise.all([
        this.readStateFile<ProjectStructure>(this.stateFiles.structure),
        this.readStateFile<FunctionRegistry>(this.stateFiles.functions),
        this.readStateFile<TestHistoryEntry[]>(this.stateFiles.history)
      ]);

      this.currentState = {
        structure,
        functions,
        history: Array.isArray(history) ? history : []
      };
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        context: 'StateManager.initializeState'
      });
      this.currentState.history = this.currentState.history || [];
    }
  }

  private async readStateFile<T>(filePath: string): Promise<T | undefined> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return undefined;
    }
  }

  private async writeStateFile<T>(filePath: string, data: T): Promise<void> {
    try {
      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      this.emit('stateUpdate', { file: filePath, timestamp: Date.now() });
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error, {
        context: 'StateManager.writeStateFile',
        file: filePath
      });
    }
  }

  public async updateProjectStructure(structure: ProjectStructure): Promise<void> {
    this.currentState.structure = structure;
    await this.writeStateFile(this.stateFiles.structure, structure);
  }

  public async updateFunctionRegistry(registry: FunctionRegistry): Promise<void> {
    this.currentState.functions = registry;
    await this.writeStateFile(this.stateFiles.functions, registry);
  }

  public async addTestHistory(entry: TestHistoryEntry): Promise<void> {
    this.currentState.history.push(entry);
    await this.writeStateFile(this.stateFiles.history, this.currentState.history);
  }

  public getProjectStructure(): ProjectStructure | undefined {
    return this.currentState.structure;
  }

  public getFunctionRegistry(): FunctionRegistry | undefined {
    return this.currentState.functions;
  }

  public getTestHistory(): TestHistoryEntry[] {
    return this.currentState.history;
  }

  public getTestHistoryByTimeRange(start: number, end: number): TestHistoryEntry[] {
    return this.currentState.history.filter(entry => 
      entry.timestamp >= start && entry.timestamp <= end
    );
  }

  public getTestHistoryById(testId: string): TestHistoryEntry[] {
    return this.currentState.history.filter(entry => entry.testId === testId);
  }

  public async clearTestHistory(): Promise<void> {
    this.currentState.history = [];
    await this.writeStateFile(this.stateFiles.history, []);
  }

  public async clearAllState(): Promise<void> {
    this.currentState = { history: [] };
    await Promise.all([
      this.writeStateFile(this.stateFiles.structure, null),
      this.writeStateFile(this.stateFiles.functions, null),
      this.writeStateFile(this.stateFiles.history, [])
    ]);
  }
} 
