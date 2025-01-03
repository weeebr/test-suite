import { EventEmitter } from 'events';
import { PerformanceEvent } from './types';

export class EventManager extends EventEmitter {
  private events: PerformanceEvent[] = [];

  public addEvent(event: PerformanceEvent): void {
    this.events.push(event);
    this.emit('performanceEvent', event);
  }

  public getEvents(): PerformanceEvent[] {
    return this.events;
  }

  public getEventsByType(type: PerformanceEvent['type']): PerformanceEvent[] {
    return this.events.filter(e => e.type === type);
  }

  public getEventsByTest(testId: string): PerformanceEvent[] {
    return this.events.filter(e => e.testId === testId);
  }

  public clearEvents(): void {
    this.events = [];
  }
} 
