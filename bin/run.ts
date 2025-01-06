import { TestRunner } from '../core/runner';
import { defaultConfig } from '../core/config';
import { detectProject } from '../core/config/projectDetector';
import { loadExternalConfig } from '../core/config/configLoader';
import { register } from 'ts-node';
import { join } from 'path';

// Register ts-node with test config
register({
  transpileOnly: true,
  project: join(__dirname, '..', 'tsconfig.test.json'),
  require: ['tsconfig-paths/register']
});

async function main() {
  const args = process.argv.slice(2);
  const isSelf = args.includes('--self');
  const isFrontend = args.includes('--frontend');
  const isBackend = args.includes('--backend');
  const isWatch = args.includes('--watch');
  const isAuto = args.includes('--auto');

  let testType: 'frontend' | 'backend' | 'self' | 'all' = 'all';
  if (isSelf) testType = 'self';
  else if (isFrontend) testType = 'frontend';
  else if (isBackend) testType = 'backend';

  const rootDir = process.cwd();
  let config = { ...defaultConfig };

  // Load external config if exists
  const externalConfig = await loadExternalConfig(rootDir);
  config = { ...config, ...externalConfig };

  // Auto-detect project type when --auto flag is used
  if (isAuto) {
    const projectInfo = await detectProject(rootDir);
    config = {
      ...config,
      projectType: projectInfo.type,
      targetDirs: [...new Set([...config.targetDirs, ...projectInfo.testDirs])],
      autoDetect: true,
      integrationMode: {
        enabled: true,
        watchMode: isWatch,
        customDirs: projectInfo.srcDirs
      }
    };

    if (projectInfo.hasTypeScript) {
      register({
        transpileOnly: true,
        project: join(rootDir, 'tsconfig.json'),
        require: ['tsconfig-paths/register']
      });
    }
  }

  const startTime = Date.now();

  // Ensure cleanup on process signals
  process.on('SIGINT', () => {
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    process.exit(143);
  });

  try {
    const runner = new TestRunner({
      ...config,
      rootDir,
      watchMode: isWatch,
      testType,
      parallelization: {
        enabled: true,
        maxWorkers: Math.max(1, Math.floor(require('os').cpus().length / 2)),
        groupTimeout: 60000,
        testTimeout: 30000
      }
    });

    const results = await runner.runTests();

    process.stdout.write(`\n\n`);

    // Print results
    console.log('📊 Test Summary');
    console.log('──────────────');
    console.log(`Total: ${results.length} tests`);
    
    const passed = results.filter(r => r.severity === 'info').length;
    const warnings = results.filter(r => r.severity === 'warning').length;
    const errors = results.filter(r => r.severity === 'error').length;

    if (passed > 0) console.log(`Passed: ${passed} ✓`);
    if (warnings > 0) console.log(`Warnings: ${warnings} ⚠️`);
    if (errors > 0) {
      console.log(`Failed: ${errors} ❌`);
      console.log('\nFailed Tests:');
      console.log('────────────');
      results
        .filter(r => r.severity === 'error')
        .forEach(r => {
          console.log(`❌ ${r.file}`);
          console.log(`   ${r.message}`);
          if (r.code) console.log(`   Code: ${r.code}`);
          if (r.stack) console.log(`   ${r.stack.split('\n')[0]}`);
          console.log('');
        });
    }

    const duration = Date.now() - startTime;
    console.log(`\nTime: ${duration}ms`);

    // Exit with appropriate code
    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test runner error:');
    console.error(error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled rejection:');
  console.error(error);
  process.exit(1);
});

main(); 
