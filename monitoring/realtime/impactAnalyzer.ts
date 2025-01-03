import { EventEmitter } from 'events';
import { ErrorInterceptor } from './errorInterceptor';
import { ImpactEvent, ImpactMetrics } from './impactTypes';
import { RecoveryStrategyManager } from './recoveryStrategyManager';

export class ImpactAnalyzer extends EventEmitter {
  private static instance: ImpactAnalyzer;
  private events: ImpactEvent[] = [];
  private errorInterceptor: ErrorInterceptor;
  private componentDependencies = new Map<string, Set<string>>();
  private recoveryManager: RecoveryStrategyManager;

  private constructor() {
    super();
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.recoveryManager = new RecoveryStrategyManager();
    this.setupErrorHandlers();
  }

  public static getInstance(): ImpactAnalyzer {
    if (!ImpactAnalyzer.instance) {
      ImpactAnalyzer.instance = new ImpactAnalyzer();
    }
    return ImpactAnalyzer.instance;
  }

  private setupErrorHandlers(): void {
    this.errorInterceptor.on('error', (errorEvent) => {
      const impact = this.analyzeImpact(errorEvent);
      this.trackImpact('error', impact, errorEvent.source || 'unknown');
    });
  }

  public registerComponent(component: string, dependencies: string[]): void {
    this.componentDependencies.set(component, new Set(dependencies));
  }

  private findAffectedComponents(source: string): string[] {
    const affected = new Set<string>();
    const visited = new Set<string>();

    const traverse = (component: string) => {
      if (visited.has(component)) return;
      visited.add(component);
      affected.add(component);

      for (const [dep, deps] of this.componentDependencies.entries()) {
        if (deps.has(component)) {
          traverse(dep);
        }
      }
    };

    traverse(source);
    return Array.from(affected);
  }

  private analyzeImpact(errorEvent: any): ImpactMetrics {
    const affectedComponents = this.findAffectedComponents(errorEvent.source || 'unknown');
    const severity = this.calculateSeverity(errorEvent, affectedComponents.length);
    const cascadingEffects = this.analyzeCascadingEffects(affectedComponents);
    const recoverySteps = this.recoveryManager.getRecoverySteps(errorEvent.type);
    const estimatedRecoveryTime = this.recoveryManager.estimateRecoveryTime(severity, affectedComponents.length);

    return {
      severity,
      affectedComponents,
      cascadingEffects,
      recoverySteps,
      estimatedRecoveryTime
    };
  }

  private calculateSeverity(errorEvent: any, affectedCount: number): ImpactMetrics['severity'] {
    if (errorEvent.type === 'runtime' && affectedCount > 5) {
      return 'critical';
    }
    if (errorEvent.type === 'network' && affectedCount > 3) {
      return 'high';
    }
    if (affectedCount > 2) {
      return 'medium';
    }
    return 'low';
  }

  private analyzeCascadingEffects(affectedComponents: string[]): string[] {
    const effects: string[] = [];
    for (const component of affectedComponents) {
      const deps = this.componentDependencies.get(component);
      if (deps) {
        effects.push(`${component} affects ${Array.from(deps).join(', ')}`);
      }
    }
    return effects;
  }

  private trackImpact(type: ImpactEvent['type'], metrics: ImpactMetrics, source: string): void {
    const event: ImpactEvent = {
      type,
      metrics,
      timestamp: Date.now(),
      source
    };

    this.events.push(event);
    this.emit('impact', event);

    console.log(`Impact Analysis for ${source}:`);
    console.log(`Severity: ${metrics.severity}`);
    console.log(`Affected Components: ${metrics.affectedComponents.join(', ')}`);
    console.log(`Cascading Effects: ${metrics.cascadingEffects.join(', ')}`);
    console.log(`Recovery Steps: ${metrics.recoverySteps.join(', ')}`);
    console.log(`Estimated Recovery Time: ${metrics.estimatedRecoveryTime} minutes`);
  }

  public getEvents(): ImpactEvent[] {
    return this.events;
  }

  public clearEvents(): void {
    this.events = [];
  }

  public getEventsByType(type: ImpactEvent['type']): ImpactEvent[] {
    return this.events.filter(e => e.type === type);
  }

  public getEventsByComponent(component: string): ImpactEvent[] {
    return this.events.filter(e => e.metrics.affectedComponents.includes(component));
  }

  public getHighSeverityEvents(): ImpactEvent[] {
    return this.events.filter(e => 
      e.metrics.severity === 'high' || e.metrics.severity === 'critical'
    );
  }

  public async analyzeError(error: Error): Promise<ImpactMetrics | undefined> {
    if (!error) return undefined;
    const source = error.stack?.split('\n')[1]?.match(/\((.*?):(\d+):(\d+)\)/)?.[1] || 'unknown';
    return this.analyzeImpact({ type: 'runtime', error, source });
  }
} 
