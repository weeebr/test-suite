import { TestResult } from '../state';

// Capture console output
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

const capturedOutput: string[] = [];

console.log = (...args) => {
  capturedOutput.push(args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' '));
  originalConsole.log(...args);
};

console.error = (...args) => {
  capturedOutput.push(args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' '));
  originalConsole.error(...args);
};

console.warn = (...args) => {
  capturedOutput.push(args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' '));
  originalConsole.warn(...args);
};

console.info = (...args) => {
  capturedOutput.push(args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' '));
  originalConsole.info(...args);
};

async function runTest(testPath: string): Promise<TestResult> {
  try {
    const testModule = await import(testPath);
    if (typeof testModule.runTest !== 'function') {
      return {
        file: testPath,
        type: 'runtime',
        severity: 'error',
        message: 'No runTest function exported',
        code: 'ERR_NO_TEST'
      };
    }
    const result = await testModule.runTest();
    return {
      ...result,
      consoleOutput: capturedOutput
    };
  } catch (error) {
    return {
      file: testPath,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'ERR_TEST_FAILED',
      consoleOutput: capturedOutput
    };
  }
}

process.on('message', async (testPath: string) => {
  try {
    const result = await runTest(testPath);
    process.send?.(result);
  } catch (error) {
    process.send?.({
      file: testPath,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'ERR_WORKER',
      consoleOutput: capturedOutput
    });
  } finally {
    process.exit(0);
  }
}); 
