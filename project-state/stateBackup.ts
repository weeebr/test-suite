import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

export interface StateBackup {
  timestamp: number;
  data: Record<string, unknown>;
  version: string;
}

export class StateBackupManager {
  private static instance: StateBackupManager;
  private backupPath: string;
  private backupInterval: number;
  private maxBackups: number;

  private constructor() {
    this.backupPath = join(process.cwd(), 'backups');
    this.backupInterval = 300000; // 5 minutes
    this.maxBackups = 10;
  }

  public static getInstance(): StateBackupManager {
    if (!StateBackupManager.instance) {
      StateBackupManager.instance = new StateBackupManager();
    }
    return StateBackupManager.instance;
  }

  public async createBackup(state: Record<string, unknown>): Promise<void> {
    const backup: StateBackup = {
      timestamp: Date.now(),
      data: state,
      version: '1.0.0'
    };

    const filename = `backup-${backup.timestamp}.json`;
    await writeFile(join(this.backupPath, filename), JSON.stringify(backup));
    await this.cleanupOldBackups();
  }

  public async restoreBackup(timestamp: number): Promise<Record<string, unknown>> {
    const filename = `backup-${timestamp}.json`;
    const content = await readFile(join(this.backupPath, filename), 'utf-8');
    const backup = JSON.parse(content) as StateBackup;
    return backup.data;
  }

  private async cleanupOldBackups(): Promise<void> {
    // Implementation for cleaning up old backups
  }

  public setBackupInterval(interval: number): void {
    this.backupInterval = interval;
  }

  public setMaxBackups(max: number): void {
    this.maxBackups = max;
  }
} 
