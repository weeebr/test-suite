import { TestResult } from '../../core/state';

export async function runTest(): Promise<TestResult> {
  // Simulate a hanging test
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return {
    file: __filename,
    type: 'runtime',
    severity: 'info',
    message: 'This should never be returned',
    code: 'TEST_HANGING'
  };
} 
