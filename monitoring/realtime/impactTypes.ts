export interface ImpactMetrics {
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedComponents: string[];
  cascadingEffects: string[];
  recoverySteps: string[];
  estimatedRecoveryTime: number;
}

export interface ImpactEvent {
  type: 'error' | 'warning' | 'info';
  metrics: ImpactMetrics;
  timestamp: number;
  source: string;
} 
