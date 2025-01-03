import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { ErrorInterceptor } from './errorInterceptor';
import { BuildEvent } from './buildTypes';
import { BuildEventProcessor } from './buildEventProcessor';

export class BuildMonitor extends EventEmitter {
  private static instance: BuildMonitor;
  private events: BuildEvent[] = [];
  private isBuilding = false;
  private errorInterceptor: ErrorInterceptor;

  private constructor() {
    super();
    this.errorInterceptor = ErrorInterceptor.getInstance();
  }

  public static getInstance(): BuildMonitor {
    if (!BuildMonitor.instance) {
      BuildMonitor.instance = new BuildMonitor();
    }
    return BuildMonitor.instance;
  }

  public async startBuild(command: string, args: string[], cwd: string): Promise<boolean> {
    if (this.isBuilding) {
      throw new Error('Build already in progress');
    }

    this.isBuilding = true;
    this.events = [];

    const buildEvent: BuildEvent = {
      type: 'start',
      message: `Starting build: ${command} ${args.join(' ')}`,
      timestamp: Date.now()
    };
    this.events.push(buildEvent);
    this.emit('buildEvent', buildEvent);

    return new Promise((resolve) => {
      const build = spawn(command, args, { cwd });
      let output = '';

      build.stdout.on('data', (data) => {
        const dataStr = data.toString();
        output += dataStr;
        const events = BuildEventProcessor.processOutput(dataStr);
        for (const event of events) {
          this.events.push(event);
          this.emit('buildEvent', event);
        }
      });

      build.stderr.on('data', (data) => {
        const dataStr = data.toString();
        output += dataStr;
        const events = BuildEventProcessor.processError(dataStr);
        for (const event of events) {
          this.events.push(event);
          this.emit('buildEvent', event);
        }
      });

      build.on('error', (error) => {
        const errorEvent: BuildEvent = {
          type: 'error',
          message: error.message,
          timestamp: Date.now()
        };
        this.events.push(errorEvent);
        this.emit('buildEvent', errorEvent);
        this.errorInterceptor.trackError('build', error);
      });

      build.on('close', (code) => {
        this.isBuilding = false;
        if (code === 0) {
          const successEvent: BuildEvent = {
            type: 'success',
            message: 'Build completed successfully',
            timestamp: Date.now()
          };
          this.events.push(successEvent);
          this.emit('buildEvent', successEvent);
          resolve(true);
        } else {
          const errorEvent: BuildEvent = {
            type: 'error',
            message: `Build failed with code ${code}`,
            timestamp: Date.now()
          };
          this.events.push(errorEvent);
          this.emit('buildEvent', errorEvent);
          this.errorInterceptor.trackError('build', new Error(`Build failed with code ${code}`));
          resolve(false);
        }
      });
    });
  }

  public getEvents(): BuildEvent[] {
    return this.events;
  }

  public getEventsByType(type: BuildEvent['type']): BuildEvent[] {
    return this.events.filter(e => e.type === type);
  }

  public isInProgress(): boolean {
    return this.isBuilding;
  }

  public clearEvents(): void {
    this.events = [];
  }
}
