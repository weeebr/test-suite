export interface BackupMetadata {
  timestamp: number;
  hash: string;
  version: number;
}

export interface BackupEntry {
  metadata: BackupMetadata;
  data: unknown;
}

export interface BackupLock {
  pid: number;
  timestamp: number;
} 
