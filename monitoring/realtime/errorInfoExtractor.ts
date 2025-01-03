export class ErrorInfoExtractor {
  public static extractErrorInfo(error: Error): Record<string, unknown> {
    const info: Record<string, unknown> = {};
    
    if (error.stack) {
      info.stack = error.stack;
      
      // Extract source file and line number from stack trace
      const stackLines = error.stack.split('\n');
      for (const line of stackLines) {
        const match = line.match(/at\s+.*\s+\(?(.*):(\d+):(\d+)\)?/);
        if (match) {
          info.source = match[1];
          info.line = parseInt(match[2], 10);
          info.column = parseInt(match[3], 10);
          break;
        }
      }
    }

    return info;
  }
} 
