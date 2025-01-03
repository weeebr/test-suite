export interface Issue {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  source: string;
  timestamp: number;
  lastUpdated: number;
  resolution?: string;
  relatedIssues?: string[];
  assignee?: string;
  tags?: string[];
  priority?: number;
  impactMetrics?: {
    affectedComponents: string[];
    cascadingEffects: string[];
    recoverySteps: string[];
    estimatedRecoveryTime: number;
  };
}

export interface IssueUpdate {
  title?: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in-progress' | 'resolved' | 'closed';
  relatedIssues?: string[];
  assignee?: string;
  tags?: string[];
  priority?: number;
} 
