import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface CodeBlock {
  file: string;
  content: string;
  start: number;
  end: number;
}

export interface ValidationIssue {
  message: string;
  severity: 'error' | 'warning';
  type: 'duplication' | 'dry' | 'structure';
}

export interface ValidationResult {
  file: string;
  issues: ValidationIssue[];
}

export class CodeQualityValidator {
  private static instance: CodeQualityValidator;

  private constructor() {}

  public static getInstance(): CodeQualityValidator {
    if (!CodeQualityValidator.instance) {
      CodeQualityValidator.instance = new CodeQualityValidator();
    }
    return CodeQualityValidator.instance;
  }

  public async validateDirectory(dir: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    const codeBlocks = await this.collectCodeBlocks(dir);
    
    // Check for duplicates
    const duplicates = this.findDuplicates(codeBlocks);
    for (const [_, blocks] of duplicates) {
      if (blocks.length > 1) {
        results.push({
          file: blocks[0].file,
          issues: [{
            message: `Code duplication found in ${blocks.length} locations`,
            severity: 'error',
            type: 'duplication'
          }]
        });
      }
    }

    // Check for DRY violations
    const dryViolations = this.checkDRYViolations(codeBlocks);
    for (const violation of dryViolations) {
      results.push({
        file: violation.file,
        issues: [{
          message: `DRY violation: ${violation.pattern} appears ${violation.count} times`,
          severity: 'warning',
          type: 'dry'
        }]
      });
    }

    return results;
  }

  private async collectCodeBlocks(dir: string): Promise<CodeBlock[]> {
    const blocks: CodeBlock[] = [];
    const ignoredPaths = ['node_modules', 'dist', '.git', 'coverage'];
    const minBlockLines = 6;
    
    async function processFile(filePath: string): Promise<void> {
      try {
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        let currentBlock: string[] = [];
        let startLine = 1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines and comments
          if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
            if (currentBlock.length >= minBlockLines) {
              blocks.push({
                file: filePath,
                content: currentBlock.join('\n'),
                start: startLine,
                end: i
              });
            }
            currentBlock = [];
            startLine = i + 2;
            continue;
          }
          
          currentBlock.push(line);
        }
        
        // Handle last block
        if (currentBlock.length >= minBlockLines) {
          blocks.push({
            file: filePath,
            content: currentBlock.join('\n'),
            start: startLine,
            end: lines.length
          });
        }
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }
    
    async function scanDirectory(currentDir: string): Promise<void> {
      try {
        const entries = await readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          
          if (ignoredPaths.includes(entry.name)) continue;
          
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            await processFile(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${currentDir}:`, error);
      }
    }
    
    await scanDirectory(dir);
    return blocks;
  }

  private findDuplicates(blocks: CodeBlock[]): Map<string, CodeBlock[]> {
    const seen = new Map<string, CodeBlock[]>();
    
    for (const block of blocks) {
      // Normalize the code block to ignore whitespace and variable names
      const normalized = this.normalizeCode(block.content);
      
      const existing = seen.get(normalized) || [];
      seen.set(normalized, [...existing, block]);
    }
    
    // Filter out non-duplicates
    return new Map([...seen.entries()].filter(([_, blocks]) => blocks.length > 1));
  }

  private checkDRYViolations(blocks: CodeBlock[]): Array<{
    file: string;
    pattern: string;
    count: number;
  }> {
    const patterns = new Map<string, number>();
    const results: Array<{ file: string; pattern: string; count: number }> = [];
    
    for (const block of blocks) {
      // Extract common patterns (e.g., repeated function calls, similar logic)
      const extractedPatterns = this.extractPatterns(block.content);
      
      for (const pattern of extractedPatterns) {
        const count = (patterns.get(pattern) || 0) + 1;
        patterns.set(pattern, count);
        
        if (count > 2) { // Report if pattern appears more than twice
          results.push({
            file: block.file,
            pattern,
            count
          });
        }
      }
    }
    
    return results;
  }

  private normalizeCode(code: string): string {
    return code
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[a-zA-Z_]\w*/g, 'ID') // Replace identifiers
      .replace(/[0-9]+/g, 'NUM') // Replace numbers
      .trim();
  }

  private extractPatterns(code: string): string[] {
    const patterns: string[] = [];
    
    // Look for repeated function calls
    const functionCalls = code.match(/\w+\([^)]*\)/g) || [];
    patterns.push(...functionCalls);
    
    // Look for similar control structures
    const controlStructures = code.match(/(if|for|while|switch)\s*\([^)]*\)/g) || [];
    patterns.push(...controlStructures);
    
    // Look for similar object/array patterns
    const objectPatterns = code.match(/{\s*\w+\s*:\s*[^}]+}/g) || [];
    patterns.push(...objectPatterns);
    
    return patterns.map(p => this.normalizeCode(p));
  }
} 
