import { promises as fs } from 'fs';

interface FileRename {
  from: string;
  to: string;
}

async function renameFiles(): Promise<void> {
  const renames: FileRename[] = [
    // Core files
    { from: 'bin/rename-files.ts', to: 'bin/renameFiles.ts' }
  ];

  for (const rename of renames) {
    try {
      await fs.rename(rename.from, rename.to);
      console.log(`✅ Renamed ${rename.from} to ${rename.to}`);
    } catch (error) {
      console.error(`❌ Failed to rename ${rename.from}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

renameFiles().catch(error => {
  console.error('Error running rename script:', error);
  process.exit(1);
}); 
