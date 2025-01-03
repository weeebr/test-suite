import { EventEmitter } from 'events';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { ErrorInterceptor } from '../monitoring/realtime/errorInterceptor';
import { BackupLockManager } from './backupLockManager';
import { BackupFileManager } from './backupFileManager';

export class StateBackupManager extends EventEmitter {
  private static instance: StateBackupManager;
  private errorInterceptor: ErrorInterceptor;
  private lockManager: BackupLockManager;
  private fileManager: BackupFileManager;
  private backupInterval!: NodeJS.Timeout;

  private constructor() {
    super();
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.lockManager = new BackupLockManager();
    this.fileManager = new BackupFileManager();
    this.setupBackupInterval();
  }

  public static getInstance(): StateBackupManager {
    if (!StateBackupManager.instance) {
      StateBackupManager.instance = new StateBackupManager();
    }
    return StateBackupManager.instance;
  }

  private setupBackupInterval(): void {
    this.backupInterval = setInterval(() => {
      this.createBackup().catch(error => {
        this.errorInterceptor.trackError('runtime', error as Error);
      });
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  public async createBackup(): Promise<void> {
    await this.fileManager.ensureBackupDir();

    const timestamp = Date.now();
    const files = ['structure.json', 'functions.json', 'history.json'];

    for (const file of files) {
      if (!await this.lockManager.acquireLock(file)) {
        continue;
      }

      try {
        const content = await readFile(join(process.cwd(), 'project-state', file), 'utf-8');
        const data = JSON.parse(content);
        await this.fileManager.writeBackup(file, data);

        this.emit('backupCreated', {
          file,
          timestamp,
          hash: this.fileManager.calculateHash(data)
        });
      } catch (error) {
        this.errorInterceptor.trackError('runtime', error as Error);
      } finally {
        await this.lockManager.releaseLock(file);
      }
    }
  }

  public async restoreFromBackup(file: string, timestamp?: number): Promise<unknown> {
    if (!await this.lockManager.acquireLock(file)) {
      throw new Error(`Could not acquire lock for ${file}`);
    }

    try {
      return await this.fileManager.readBackup(file, timestamp);
    } finally {
      await this.lockManager.releaseLock(file);
    }
  }

  public async cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const files = ['structure.json', 'functions.json', 'history.json'];

    for (const file of files) {
      if (!await this.lockManager.acquireLock(file)) {
        continue;
      }

      try {
        await this.fileManager.cleanupOldBackups(file, maxAge);
      } finally {
        await this.lockManager.releaseLock(file);
      }
    }
  }

  public destroy(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }
  }
} 
