import { promises as fs } from 'fs';
import { join } from 'path';
import { ProjectType, ProjectDetectionResult } from './index';

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJsonFile(path: string): Promise<Record<string, any>> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function detectProject(rootDir: string): Promise<ProjectDetectionResult> {
  const packageJsonPath = join(rootDir, 'package.json');
  const tsConfigPath = join(rootDir, 'tsconfig.json');
  
  const hasPackageJson = await fileExists(packageJsonPath);
  const hasTsConfig = await fileExists(tsConfigPath);
  
  const packageJson = hasPackageJson ? await readJsonFile(packageJsonPath) : {};
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let type: ProjectType = 'unknown';
  let testDirs = ['tests', 'src/**/__tests__'];
  let srcDirs = ['src'];
  
  // Detect React
  if (dependencies.react) {
    type = 'react';
    testDirs = [...testDirs, 'src/**/*.test.{ts,tsx,js,jsx}', 'src/**/*.spec.{ts,tsx,js,jsx}'];
    srcDirs = ['src', 'components', 'pages'];
  }
  // Detect Node
  else if (dependencies['@types/node'] || dependencies.express || dependencies.fastify) {
    type = 'node';
    testDirs = [...testDirs, '**/*.test.{ts,js}', '**/*.spec.{ts,js}'];
    srcDirs = ['src', 'lib', 'api'];
  }
  // Detect TypeScript
  else if (hasTsConfig) {
    type = 'typescript';
    testDirs = [...testDirs, '**/*.test.ts', '**/*.spec.ts'];
  }
  // Default to JavaScript
  else {
    type = 'javascript';
    testDirs = [...testDirs, '**/*.test.js', '**/*.spec.js'];
  }
  
  return {
    type,
    hasTypeScript: hasTsConfig,
    testDirs,
    srcDirs
  };
} 
