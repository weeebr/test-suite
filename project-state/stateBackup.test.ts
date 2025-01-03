import { TestResult } from '../core/state';
import { StateBackupManager } from './state-backup';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

export async function runTest(): Promise<TestResult> {
  try {
    const backupManager = StateBackupManager.getInstance();
    const testDir = join(process.cwd(), 'project-state');
    const backupDir = join(testDir, 'backups');

    // Setup test environment
    await mkdir(testDir, { recursive: true });
    await mkdir(backupDir, { recursive: true });

    // Test 1: Create backup
    const testData = {
      test: 'data',
      timestamp: Date.now()
    };

    await writeFile(join(testDir, 'structure.json'), JSON.stringify(testData));
    await backupManager.createBackup();

    // Wait for backup to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const backups = await backupManager.restoreFromBackup('structure.json');
    if (!backups || typeof backups !== 'object') {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Backup creation failed'
      };
    }

    // Test 2: Concurrent access
    let concurrentError = false;
    await Promise.all([
      backupManager.createBackup(),
      backupManager.createBackup()
    ]).catch(() => {
      concurrentError = true;
    });

    if (concurrentError) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Concurrent access handling failed'
      };
    }

    // Test 3: Backup restoration
    const restoredData = await backupManager.restoreFromBackup('structure.json');
    if (JSON.stringify(restoredData) !== JSON.stringify(testData)) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Backup restoration failed'
      };
    }

    // Test 4: Cleanup old backups
    const oldData = {
      test: 'old',
      timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000 // 8 days old
    };

    await writeFile(join(testDir, 'history.json'), JSON.stringify(oldData));
    await backupManager.createBackup();
    await backupManager.cleanup(7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      await backupManager.restoreFromBackup('history.json', oldData.timestamp);
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Cleanup of old backups failed'
      };
    } catch {
      // Expected error - backup should be cleaned up
    }

    // Test 5: Lock handling
    let lockAcquired = true;
    const testFile = 'test.json';
    await writeFile(join(testDir, testFile), JSON.stringify({ test: 'lock' }));

    // Try to create backups with the same lock
    await Promise.all([
      backupManager.createBackup(),
      new Promise(resolve => {
        setTimeout(async () => {
          try {
            await backupManager.restoreFromBackup(testFile);
            lockAcquired = false;
          } catch {
            // Expected - lock should prevent access
          }
          resolve(undefined);
        }, 50);
      })
    ]);

    if (!lockAcquired) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Lock handling failed'
      };
    }

    // Cleanup
    backupManager.destroy();
    await rm(backupDir, { recursive: true, force: true });

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'State backup tests passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
} 
