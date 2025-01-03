import { writeFile } from 'fs/promises';
import { join } from 'path';
import { ErrorInterceptor } from '../monitoring/realtime/errorInterceptor';
import { BackupLock } from './backupTypes';

export class BackupLockManager {
  private locks = new Map<string, BackupLock>();
  private lockFile: string;
  private errorInterceptor: ErrorInterceptor;

  constructor() {
    this.lockFile = join(process.cwd(), 'project-state', 'state.lock');
    this.errorInterceptor = ErrorInterceptor.getInstance();
  }

  public async acquireLock(file: string): Promise<boolean> {
    const currentLock = this.locks.get(file);
    if (currentLock) {
      // Check if lock is stale (older than 30 seconds)
      if (Date.now() - currentLock.timestamp > 30000) {
        this.locks.delete(file);
      } else {
        return false;
      }
    }

    this.locks.set(file, {
      pid: process.pid,
      timestamp: Date.now()
    });

    try {
      await writeFile(this.lockFile, JSON.stringify({
        file,
        pid: process.pid,
        timestamp: Date.now()
      }));
      return true;
    } catch {
      return false;
    }
  }

  public async releaseLock(file: string): Promise<void> {
    this.locks.delete(file);
    try {
      await writeFile(this.lockFile, '');
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error);
    }
  }
} 
