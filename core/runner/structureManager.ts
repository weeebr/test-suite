import { TestStateManager } from '../state';
import { Config } from '../config';
import { join } from 'path';
import { glob } from 'glob';

export class StructureManager {
  private stateManager: TestStateManager;

  constructor(private config: Config) {
    this.stateManager = new TestStateManager();
  }

  async collectFiles(): Promise<{ [key: string]: string[] }> {
    const files: { [key: string]: string[] } = {
      frontend: [],
      validation: [],
      self: []
    };

    const patterns = [
      join(this.config.rootDir, '**', '*.frontend.test.ts'),
      join(this.config.rootDir, 'validation', '**', '*.test.ts'),
      join(this.config.rootDir, '**', '*.self.test.ts')
    ];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        ignore: this.config.exclude.map(p => `**/${p}/**`),
        nodir: true
      });

      if (pattern.includes('.frontend.test.ts')) {
        files.frontend.push(...matches);
      } else if (pattern.includes('validation/')) {
        files.validation.push(...matches);
      } else if (pattern.includes('.self.test.ts')) {
        files.self.push(...matches);
      }
    }

    // Initialize groups in state manager
    for (const [group, groupFiles] of Object.entries(files)) {
      if (groupFiles.length > 0) {
        this.stateManager.initializeGroup(group, groupFiles);
      }
    }

    return files;
  }
} 
