module.exports = {
  // Node.js-specific settings
  testPattern: {
    test: /\.(test|spec)\.(ts|js)$/,
    unit: /\.unit\.(test|spec)\.(ts|js)$/,
    integration: /\.integration\.(test|spec)\.(ts|js)$/,
    e2e: /\.e2e\.(test|spec)\.(ts|js)$/
  },
  targetDirs: [
    'src/**/__tests__',
    'tests',
    'test',
    'api/**/*.test.*',
    'lib/**/*.test.*'
  ],
  
  // Performance tuning for backend tests
  parallelization: {
    enabled: true,
    maxWorkers: 2,
    groupTimeout: 60000,
    testTimeout: 30000
  },
  
  // Output for CI systems
  outputFormat: 'junit',
  outputFile: 'test-results.xml'
}; 
