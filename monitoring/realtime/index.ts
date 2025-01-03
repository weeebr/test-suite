import * as chokidar from 'chokidar';
import * as path from 'path';
import { setupTypeScriptErrorHandling, watchTypeScriptErrors } from './typescriptErrorInterceptor';
import { ErrorInterceptor } from './errorInterceptor';

export { ErrorInterceptor } from './errorInterceptor';
export { NetworkEventTracker } from './networkEventTracker';
export { ConsoleInterceptor } from './consoleInterceptor';
export { ImpactAnalyzer } from './impactAnalyzer';

export class FileSystemMonitor {
  private watcher: chokidar.FSWatcher;

  constructor(private basePath: string) {
    this.watcher = chokidar.watch(basePath, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
  }

  public watch(dir: string): void {
    this.watcher.add(path.join(this.basePath, dir));
  }

  public close(): void {
    this.watcher.close();
  }
}

export function initializeMonitoring(): void {
  const errorInterceptor = ErrorInterceptor.getInstance();
  
  // Initialize error handlers
  setupTypeScriptErrorHandling();
  watchTypeScriptErrors();
  
  // Initialize other monitoring systems
  errorInterceptor.registerErrorHandler('typescript', (error) => {
    console.error('TypeScript Error:', error.message);
  });
} 
