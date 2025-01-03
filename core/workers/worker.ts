import { TestResult } from '../state';

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
    return await testModule.runTest();
  } catch (error) {
    return {
      file: testPath,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'ERR_TEST_FAILED'
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
      code: 'ERR_WORKER'
    });
  } finally {
    process.exit(0);
  }
}); 
