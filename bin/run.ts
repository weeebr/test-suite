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
  
  // Load configs in order: default -> external -> auto-detected
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

  // Determine test directories based on type
  const testDirs = ['tests/core', 'tests/management', 'tests/monitoring', 'tests/integration'];

  process.stdout.write('\n🧪 Running tests');
  const startTime = Date.now();
  const progressInterval = setInterval(() => {
    process.stdout.write(`\r🧪 Running tests...`);
  }, 500);

  let cleanupDone = false;
  const cleanup = () => {
    if (!cleanupDone) {
      cleanupDone = true;
      clearInterval(progressInterval);
    }
  };

  // Ensure cleanup on process signals
  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
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
    cleanup();

    process.stdout.write(`\r🧪 Running tests... [${results.length}/${results.length}]\n\n`);

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
    cleanup();
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
