export interface ProjectStructureConfig {
  directories: {
    core: string[];
    tests: string[];
    management: string[];
    monitoring: string[];
  };
  patterns: {
    test: RegExp;
    source: RegExp;
  };
  exclude: string[];
}

export interface PortConfig {
  basePort: number;
  maxPort: number;
  reservedPorts: number[];
  services: {
    [key: string]: {
      port: number;
      host: string;
      protocol: 'http' | 'https' | 'ws' | 'wss';
      priority: number;
    };
  };
}

export interface TestSuiteConfig {
  rootDir: string;
  targetDirs: string[];
  testPattern?: RegExp;
  exclude?: string[];
  watchMode?: boolean;
  workers?: number;
  compilerOptions?: Record<string, unknown>;
  testType?: 'frontend' | 'backend' | 'self' | 'all';
  setupFiles?: string[];
  moduleNameMapper?: Record<string, string>;
  testTimeout?: number;
  maxConcurrentTests?: number;
  collectCoverage?: boolean;
  coverageDirectory?: string;
  coverageThreshold?: {
    global?: {
      branches?: number;
      functions?: number;
      lines?: number;
      statements?: number;
    };
  };
  performance?: {
    memoryLimit?: number;
    timeoutLimit?: number;
    resourceLimit?: number;
  };
  testCategories?: {
    frontend?: {
      pattern: RegExp;
      setupFiles?: string[];
      environment?: 'jsdom' | 'happy-dom';
    };
    backend?: {
      pattern: RegExp;
      setupFiles?: string[];
      environment?: 'node';
    };
  };
  structure?: ProjectStructureConfig;
  ports?: PortConfig;
}

export const defaultConfig: TestSuiteConfig = {
  rootDir: process.cwd(),
  targetDirs: ['.'],
  testPattern: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
  exclude: ['node_modules', 'dist', 'coverage'],
  watchMode: false,
  workers: Math.max(1, Math.floor(require('os').cpus().length / 2)),
  testType: 'all',
  testTimeout: 5000,
  maxConcurrentTests: 5,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  performance: {
    memoryLimit: 512 * 1024 * 1024,
    timeoutLimit: 30000,
    resourceLimit: 0.8
  },
  testCategories: {
    frontend: {
      pattern: /\.frontend\.(test|spec)\.(ts|tsx|js|jsx)$/,
      environment: 'jsdom'
    },
    backend: {
      pattern: /\.backend\.(test|spec)\.(ts|tsx|js|jsx)$/,
      environment: 'node'
    }
  },
  structure: {
    directories: {
      core: ['core'],
      tests: ['tests', 'frontend/tests', 'backend/tests'],
      management: ['management'],
      monitoring: ['monitoring']
    },
    patterns: {
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      source: /\.(ts|tsx|js|jsx)$/
    },
    exclude: ['node_modules', 'dist', 'coverage', '.git']
  },
  ports: {
    basePort: 9000,
    maxPort: 9999,
    reservedPorts: [],
    services: {}
  }
}; 
