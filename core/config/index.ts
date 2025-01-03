export interface Config {
  rootDir: string;
  targetDirs: string[];
  testPattern: RegExp;
  exclude: string[];
  watchMode: boolean;
  workers: number;
  testType: 'frontend' | 'backend' | 'self' | 'all';
  parallelization: {
    enabled: boolean;
    maxWorkers: number;
    groupTimeout: number;
    testTimeout: number;
  };
}

export const defaultConfig: Config = {
  rootDir: process.cwd(),
  targetDirs: ['tests'],
  testPattern: /\.test\.ts$/,
  exclude: ['node_modules', 'dist', 'coverage'],
  watchMode: false,
  workers: Math.max(1, Math.floor(require('os').cpus().length / 2)),
  testType: 'all',
  parallelization: {
    enabled: true,
    maxWorkers: Math.max(1, Math.floor(require('os').cpus().length / 2)),
    groupTimeout: 60000,
    testTimeout: 30000
  }
}; 
