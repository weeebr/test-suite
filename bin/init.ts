import { promises as fs } from 'fs';
import { join } from 'path';
import { detectProject } from '../core/config/projectDetector';

async function copyTemplate(templateName: string, destPath: string): Promise<void> {
  const templateDir = join(__dirname, '..', 'examples', 'templates');
  await fs.copyFile(join(templateDir, templateName), destPath);
}

async function main() {
  const rootDir = process.cwd();
  const projectInfo = await detectProject(rootDir);
  
  // Create test directory if it doesn't exist
  const testDir = join(rootDir, 'tests');
  try {
    await fs.mkdir(testDir, { recursive: true });
  } catch {}
  
  // Copy appropriate template based on project type
  if (projectInfo.type === 'react') {
    await copyTemplate('react.test.tsx', join(testDir, 'example.test.tsx'));
  } else {
    await copyTemplate('basic.test.ts', join(testDir, 'example.test.ts'));
  }
  
  console.log('✅ Created test template in tests/');
  console.log('📝 Run tests with: yarn test-suite test --auto');
}

main().catch(console.error); 
