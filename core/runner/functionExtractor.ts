import { FunctionRegistry } from '../state';

export class FunctionExtractor {
  public static extractFunctions(file: string, content: string): FunctionRegistry['functions'][0][] {
    const functions: FunctionRegistry['functions'] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match function declarations
      const functionMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (functionMatch) {
        functions.push({
          name: functionMatch[1],
          type: 'function',
          file,
          exported: line.includes('export'),
          async: line.includes('async'),
          line: i + 1
        });
        continue;
      }

      // Match interface declarations
      const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
      if (interfaceMatch) {
        functions.push({
          name: interfaceMatch[1],
          type: 'interface',
          file,
          exported: line.includes('export'),
          async: false,
          line: i + 1
        });
        continue;
      }

      // Match class declarations
      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        functions.push({
          name: classMatch[1],
          type: 'class',
          file,
          exported: line.includes('export'),
          async: false,
          line: i + 1
        });
        continue;
      }

      // Match type declarations
      const typeMatch = line.match(/(?:export\s+)?type\s+(\w+)/);
      if (typeMatch) {
        functions.push({
          name: typeMatch[1],
          type: 'type',
          file,
          exported: line.includes('export'),
          async: false,
          line: i + 1
        });
      }
    }

    return functions;
  }
} 
