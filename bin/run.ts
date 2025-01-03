import { TestRunner } from '../core/runner';
import { ErrorInterceptor } from '../monitoring/realtime/errorInterceptor';
import { TestResult } from '../core/state';

function parseArgs(): { targetPath?: string; testType: 'frontend' | 'backend' | 'self' | 'all'; watchMode: boolean } {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch');
  let testType: 'frontend' | 'backend' | 'self' | 'all' = 'all';
  let targetPath: string | undefined;

  if (args.includes('--frontend')) testType = 'frontend';
  if (args.includes('--backend')) testType = 'backend';
  if (args.includes('--self')) testType = 'self';
  if (args.includes('--all')) testType = 'all';

  const pathIndex = args.indexOf('--path');
  if (pathIndex !== -1 && args[pathIndex + 1]) {
    targetPath = args[pathIndex + 1];
  }

  return { targetPath, testType, watchMode };
}

function printResults(results: TestResult[]): void {
  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    console.log('─────────');
    errors.forEach(error => {
      console.log(`${error.file}:${error.line || 1} - ${error.message}`);
    });
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    console.log('───────────');
    warnings.forEach(warning => {
      console.log(`${warning.file}:${warning.line || 1} - ${warning.message}`);
    });
  }

  const total = results.length;
  const passed = results.filter(r => r.severity === 'info').length;

  console.log('\n📊 Summary:');
  console.log('──────────');
  console.log(`Total tests: ${total}`);
  console.log(`Passed: ${passed} ✓`);
  if (errors.length > 0) console.log(`Failed: ${errors.length} ❌`);
  if (warnings.length > 0) console.log(`Warnings: ${warnings.length} ⚠️`);
}

async function main(): Promise<void> {
  const errorInterceptor = ErrorInterceptor.getInstance();
  
  try {
    const { targetPath, testType, watchMode } = parseArgs();
    const runner = new TestRunner({
      rootDir: process.cwd(),
      targetDirs: targetPath ? [targetPath] : ['.'],
      testPattern: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      watchMode,
      testType
    }, true);

    const results = await runner.runTests();
    printResults(results);

    const hasErrors = results.some(r => r.severity === 'error');
    if (hasErrors) {
      process.exit(1);
    }
  } catch (error) {
    errorInterceptor.trackError('runtime', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  }
}

main(); 
