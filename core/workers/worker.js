const { workerData, parentPort } = require('worker_threads');
const { join } = require('path');
const { register } = require('ts-node');

// Register ts-node with appropriate compiler options
register({
  transpileOnly: true,
  compilerOptions: {
    ...workerData.config.compilerOptions,
    allowJs: true,
    module: 'commonjs',
    esModuleInterop: true,
    moduleResolution: 'node',
    resolveJsonModule: true,
    skipLibCheck: true
  }
});

// Report metrics periodically
let lastMemoryUsage = 0;
let lastCpuUsage = process.cpuUsage();

const metricsInterval = setInterval(() => {
  const memoryUsage = process.memoryUsage().heapUsed;
  const cpuUsage = process.cpuUsage(lastCpuUsage);
  
  if (Math.abs(memoryUsage - lastMemoryUsage) > 1024 * 1024) {
    parentPort.postMessage({
      type: 'metrics',
      memory: memoryUsage,
      cpu: (cpuUsage.user + cpuUsage.system) / 1000000
    });
    lastMemoryUsage = memoryUsage;
    lastCpuUsage = process.cpuUsage();
  }
}, 1000);

async function runTest() {
  const { file } = workerData;
  
  try {
    const fullPath = join(workerData.config.rootDir, file);
    
    // Clear require cache to ensure fresh module load
    delete require.cache[require.resolve(fullPath)];
    
    const testModule = require(fullPath);
    
    if (typeof testModule.runTest !== 'function') {
      clearInterval(metricsInterval);
      parentPort.postMessage({
        file,
        type: 'structure',
        severity: 'error',
        message: 'Module does not export a runTest function'
      });
      return;
    }

    const result = await testModule.runTest();
    if (!result) {
      clearInterval(metricsInterval);
      parentPort.postMessage({
        file,
        type: 'runtime',
        severity: 'error',
        message: 'Test did not return a result'
      });
      return;
    }

    clearInterval(metricsInterval);
    parentPort.postMessage(result);
  } catch (error) {
    clearInterval(metricsInterval);
    parentPort.postMessage({
      file,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  clearInterval(metricsInterval);
  parentPort.postMessage({
    file: workerData.file,
    type: 'runtime',
    severity: 'error',
    message: `Uncaught error: ${error.message}`
  });
});

process.on('unhandledRejection', (error) => {
  clearInterval(metricsInterval);
  parentPort.postMessage({
    file: workerData.file,
    type: 'runtime',
    severity: 'error',
    message: `Unhandled rejection: ${error instanceof Error ? error.message : String(error)}`
  });
});

runTest(); 
