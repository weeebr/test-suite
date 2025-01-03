export interface Issue {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: number;
  lastUpdated: number;
  assignee?: string;
  resolution?: string;
  relatedIssues?: string[];
  impactMetrics?: {
    affectedComponents: string[];
    cascadingEffects: string[];
    recoverySteps: string[];
    estimatedRecoveryTime: number;
  };
}

export interface IssueUpdate {
  id: string;
  changes: Partial<Issue>;
  timestamp: number;
} 
