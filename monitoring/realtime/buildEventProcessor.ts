import { BuildEvent } from './buildTypes';

export class BuildEventProcessor {
  public static processOutput(output: string): BuildEvent[] {
    const events: BuildEvent[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        if (line.toLowerCase().includes('warning')) {
          events.push({
            type: 'warning',
            message: line,
            timestamp: Date.now()
          });
        } else {
          events.push({
            type: 'success',
            message: line,
            timestamp: Date.now()
          });
        }
      }
    }

    return events;
  }

  public static processError(error: string): BuildEvent[] {
    const events: BuildEvent[] = [];
    const lines = error.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        const errorEvent: BuildEvent = {
          type: 'error',
          message: line,
          timestamp: Date.now()
        };

        // Try to extract file information
        const fileMatch = line.match(/([^:]+):(\d+):(\d+)/);
        if (fileMatch) {
          errorEvent.file = fileMatch[1];
          errorEvent.line = parseInt(fileMatch[2], 10);
          errorEvent.column = parseInt(fileMatch[3], 10);
        }

        events.push(errorEvent);
      }
    }

    return events;
  }
} 
