export type TestType = 'frontend' | 'backend' | 'self' | 'all' | 'unit' | 'integration' | 'e2e';

export interface TestPatterns {
  test: RegExp;
  unit?: RegExp;
  integration?: RegExp;
  e2e?: RegExp;
  frontend?: RegExp;
  backend?: RegExp;
}

export type ProjectType = 'react' | 'node' | 'typescript' | 'javascript' | 'unknown';

export interface ProjectDetectionResult {
  type: ProjectType;
  hasTypeScript: boolean;
  testDirs: string[];
  srcDirs: string[];
}

export interface ProjectStructureConfig {
  directories: {
    tests: string[];
    src: string[];
    config: string[];
    core: string[];
    management: string[];
    monitoring: string[];
  };
  files: {
    tests: string[];
    source: string[];
    config: string[];
  };
  exclude?: string[];
}

export interface TestSuiteConfig {
  rootDir: string;
  targetDirs: string[];
  exclude: string[];
  testPattern: RegExp | TestPatterns;
  testFileExtensions: string[];
  testType: TestType;
  structure?: ProjectStructureConfig;
}

export interface PortConfig {
  port: number;
  reservedPorts: number[];
  minPort: number;
  maxPort: number;
  basePort: number;
  services: {
    [key: string]: {
      port: number;
      host: string;
      protocol: string;
      priority: number;
    };
  };
}

export interface Config {
  // Project structure
  rootDir: string;
  targetDirs: string[];
  exclude: string[];
  
  // Test patterns
  testPattern: RegExp | TestPatterns;
  testFileExtensions: string[];
  
  // Test types
  testType: TestType;
  
  // Runtime options
  watchMode: boolean;
  workers: number;
  parallelization: {
    enabled: boolean;
    maxWorkers: number;
    groupTimeout: number;
    testTimeout: number;
  };
  
  // Output options
  silent?: boolean;
  verbose?: boolean;
  outputFormat?: 'default' | 'json' | 'junit';
  outputFile?: string;
  
  // Project detection
  projectType?: ProjectType;
  autoDetect?: boolean;
  
  // Integration options
  integrationMode?: {
    enabled: boolean;
    watchMode: boolean;
    customPatterns?: TestPatterns;
    customDirs?: string[];
  };
}

export const defaultConfig: Config = {
  // Project structure
  rootDir: process.cwd(),
  targetDirs: ['tests', 'src/**/__tests__', '**/*.test.*', '**/*.spec.*'],
  exclude: ['node_modules', 'dist', 'coverage', 'build'],
  
  // Test patterns
  testPattern: {
    test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    unit: /\.unit\.(test|spec)\.(ts|tsx|js|jsx)$/,
    integration: /\.integration\.(test|spec)\.(ts|tsx|js|jsx)$/,
    e2e: /\.e2e\.(test|spec)\.(ts|tsx|js|jsx)$/,
    frontend: /\.frontend\.(test|spec)\.(ts|tsx|js|jsx)$/,
    backend: /\.backend\.(test|spec)\.(ts|tsx|js|jsx)$/
  },
  testFileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  
  // Test types
  testType: 'all',
  
  // Runtime options
  watchMode: false,
  workers: Math.max(1, Math.floor(require('os').cpus().length / 2)),
  parallelization: {
    enabled: true,
    maxWorkers: Math.max(1, Math.floor(require('os').cpus().length / 2)),
    groupTimeout: 60000,
    testTimeout: 30000
  },
  
  // Output options
  silent: false,
  verbose: false,
  outputFormat: 'default',
  
  // Project detection
  projectType: 'unknown',
  autoDetect: true,
  
  // Integration defaults
  integrationMode: {
    enabled: false,
    watchMode: false
  },
}; 
