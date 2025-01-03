import { TestSuiteConfig } from '../../core/config';
import * as chokidar from 'chokidar';
import * as path from 'path';

export { ErrorInterceptor } from './errorInterceptor';
export { BuildMonitor } from './buildMonitor';
export { NetworkMonitor } from './networkMonitor';

export class FileSystemMonitor {
  private config: TestSuiteConfig;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(config: TestSuiteConfig) {
    this.config = config;
  }

  start(): void {
    if (this.watcher) return;
    const patterns = this.config.targetDirs.map(dir => 
      path.join(dir, this.config.testPattern?.source || '**/*.test.ts')
    );
    this.watcher = chokidar.watch(patterns, {
      ignored: this.config.exclude || ['**/node_modules/**', '**/dist/**'],
      persistent: true,
      cwd: this.config.rootDir
    });
  }

  onEvent(callback: (event: { type: string; path: string }) => void): void {
    if (!this.watcher) return;
    this.watcher.on('add', path => callback({ type: 'add', path }));
    this.watcher.on('change', path => callback({ type: 'change', path }));
    this.watcher.on('unlink', path => callback({ type: 'unlink', path }));
  }
} 
