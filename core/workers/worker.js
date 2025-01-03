const { join } = require('path');
const tsConfigPath = join(process.cwd(), 'tsconfig.test.json');

require('ts-node').register({
  transpileOnly: true,
  project: tsConfigPath,
  require: ['tsconfig-paths/register']
});

process.on('message', async (testFile) => {
  try {
    await require(testFile);
    process.send({
      file: testFile,
      type: 'runtime',
      severity: 'info',
      message: 'Test passed',
      code: 'TEST_PASSED'
    });
  } catch (error) {
    process.send({
      file: testFile,
      type: 'runtime',
      severity: 'error',
      message: error.message,
      code: 'ERR_TEST_FAILED',
      stack: error.stack
    });
  }
}); 
