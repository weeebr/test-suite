import { writeFile, readFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { createHash } from 'crypto';
import { ErrorInterceptor } from '../monitoring/realtime/errorInterceptor';
import { BackupEntry } from './backupTypes';

export class BackupFileManager {
  private backupDir: string;
  private errorInterceptor: ErrorInterceptor;

  constructor() {
    this.backupDir = join(process.cwd(), 'project-state', 'backups');
    this.errorInterceptor = ErrorInterceptor.getInstance();
  }

  public async ensureBackupDir(): Promise<void> {
    try {
      await mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      this.errorInterceptor.trackError('runtime', error as Error);
    }
  }

  public calculateHash(data: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  public async writeBackup(file: string, data: unknown): Promise<void> {
    const timestamp = Date.now();
    const hash = this.calculateHash(data);

    const backup: BackupEntry = {
      metadata: {
        timestamp,
        hash,
        version: 1
      },
      data
    };

    const backupFile = join(this.backupDir, `${file}.${timestamp}.backup`);
    await writeFile(backupFile, JSON.stringify(backup, null, 2));
  }

  public async readBackup(file: string, timestamp?: number): Promise<unknown> {
    const backups = await this.listBackups(file);
    if (backups.length === 0) {
      throw new Error(`No backups found for ${file}`);
    }

    let targetBackup: BackupEntry;
    if (timestamp) {
      const backupFile = join(this.backupDir, `${file}.${timestamp}.backup`);
      const content = await readFile(backupFile, 'utf-8');
      targetBackup = JSON.parse(content);
    } else {
      // Get latest backup
      const latestBackup = backups[backups.length - 1];
      const content = await readFile(latestBackup, 'utf-8');
      targetBackup = JSON.parse(content);
    }

    return targetBackup.data;
  }

  public async listBackups(file: string): Promise<string[]> {
    await this.ensureBackupDir();
    const backups = await readdir(this.backupDir);
    return backups
      .filter(entry => entry.startsWith(file))
      .map(entry => join(this.backupDir, entry))
      .sort();
  }

  public async cleanupOldBackups(file: string, maxAge: number): Promise<void> {
    const backups = await this.listBackups(file);
    const now = Date.now();

    for (const backup of backups) {
      const content = await readFile(backup, 'utf-8');
      const { metadata } = JSON.parse(content) as BackupEntry;

      if (now - metadata.timestamp > maxAge) {
        await writeFile(backup, '');
      }
    }
  }
} 
