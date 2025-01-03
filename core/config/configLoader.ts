import { promises as fs } from 'fs';
import { join } from 'path';
import { Config } from './index';

const CONFIG_FILE_NAMES = [
  'test-suite.config.js',
  'test-suite.config.ts',
  '.test-suiterc.js',
  '.test-suiterc.json'
];

export async function loadExternalConfig(rootDir: string): Promise<Partial<Config>> {
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = join(rootDir, fileName);
    try {
      await fs.access(configPath);
      
      // For TypeScript configs, use require after registration
      if (fileName.endsWith('.ts')) {
        require('ts-node').register({ transpileOnly: true });
      }
      
      const config = require(configPath);
      return config.default || config;
    } catch {
      continue;
    }
  }
  
  return {};
} 
