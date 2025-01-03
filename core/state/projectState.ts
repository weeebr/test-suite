import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { ProjectStructure, FunctionRegistry } from './types';

export class ProjectStateManager {
  private static instance: ProjectStateManager;
  private structurePath: string;
  private registryPath: string;
  private currentStructure: ProjectStructure | null = null;
  private currentRegistry: FunctionRegistry | null = null;

  private constructor(rootDir: string) {
    this.structurePath = join(rootDir, 'project-state', 'structure.json');
    this.registryPath = join(rootDir, 'project-state', 'functions.json');
  }

  public static getInstance(rootDir: string): ProjectStateManager {
    if (!ProjectStateManager.instance) {
      ProjectStateManager.instance = new ProjectStateManager(rootDir);
    }
    return ProjectStateManager.instance;
  }

  public async updateStructure(structure: ProjectStructure): Promise<void> {
    this.currentStructure = structure;
    await writeFile(this.structurePath, JSON.stringify(structure, null, 2));
  }

  public async getStructure(): Promise<ProjectStructure | null> {
    if (!this.currentStructure) {
      try {
        const data = await readFile(this.structurePath, 'utf-8');
        this.currentStructure = JSON.parse(data);
      } catch (error) {
        return null;
      }
    }
    return this.currentStructure;
  }

  public async updateRegistry(registry: FunctionRegistry): Promise<void> {
    this.currentRegistry = registry;
    await writeFile(this.registryPath, JSON.stringify(registry, null, 2));
  }

  public async getRegistry(): Promise<FunctionRegistry | null> {
    if (!this.currentRegistry) {
      try {
        const data = await readFile(this.registryPath, 'utf-8');
        this.currentRegistry = JSON.parse(data);
      } catch (error) {
        return null;
      }
    }
    return this.currentRegistry;
  }
} 
