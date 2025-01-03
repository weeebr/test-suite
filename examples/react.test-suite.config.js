module.exports = {
  // React-specific settings
  testPattern: {
    test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
    unit: /\.unit\.(test|spec)\.(ts|tsx|js|jsx)$/,
    integration: /\.integration\.(test|spec)\.(ts|tsx|js|jsx)$/,
    e2e: /\.e2e\.(test|spec)\.(ts|tsx|js|jsx)$/
  },
  targetDirs: [
    'src/**/__tests__',
    'src/**/*.test.*',
    'src/**/*.spec.*',
    'tests'
  ],
  
  // Performance tuning for component tests
  parallelization: {
    enabled: true,
    maxWorkers: 4,
    groupTimeout: 30000,
    testTimeout: 10000
  }
}; 
