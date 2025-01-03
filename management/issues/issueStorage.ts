import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { Issue, IssueUpdate } from './issue-types';

export class IssueStorage {
  private issuesPath: string;
  private updatesPath: string;

  constructor() {
    this.issuesPath = join(process.cwd(), 'project-state', 'ISSUES.md');
    this.updatesPath = join(process.cwd(), 'project-state', 'issue-updates.json');
  }

  public async loadState(): Promise<{ issues: Map<string, Issue>; updates: IssueUpdate[] }> {
    try {
      const [issuesContent, updatesContent] = await Promise.all([
        readFile(this.issuesPath, 'utf-8'),
        readFile(this.updatesPath, 'utf-8')
      ]);

      const issues = new Map<string, Issue>();
      const issueMatches = issuesContent.matchAll(/### Issue (\S+)\n\n([\s\S]+?)(?=### Issue|\n*$)/g);
      for (const match of issueMatches) {
        const [, id, content] = match;
        const issue = this.parseIssueContent(content);
        if (issue) {
          issues.set(id, { ...issue, id });
        }
      }

      return {
        issues,
        updates: JSON.parse(updatesContent)
      };
    } catch (error) {
      return {
        issues: new Map(),
        updates: []
      };
    }
  }

  public async saveState(issues: Map<string, Issue>, updates: IssueUpdate[]): Promise<void> {
    const issuesContent = Array.from(issues.entries())
      .map(([id, issue]) => this.formatIssue(id, issue))
      .join('\n\n');

    const updatesContent = JSON.stringify(updates, null, 2);

    await Promise.all([
      writeFile(this.issuesPath, issuesContent),
      writeFile(this.updatesPath, updatesContent)
    ]);
  }

  private parseIssueContent(content: string): Omit<Issue, 'id'> | null {
    try {
      const lines = content.split('\n');
      const getValue = (key: string): string => {
        const line = lines.find(l => l.startsWith(`- ${key}:`));
        return line ? line.split(':')[1].trim() : '';
      };

      return {
        type: getValue('Type') as Issue['type'],
        title: getValue('Title'),
        description: getValue('Description'),
        status: getValue('Status') as Issue['status'],
        severity: getValue('Severity') as Issue['severity'],
        source: getValue('Source'),
        timestamp: parseInt(getValue('Created'), 10),
        lastUpdated: parseInt(getValue('Updated'), 10),
        assignee: getValue('Assignee') || undefined,
        resolution: getValue('Resolution') || undefined,
        relatedIssues: getValue('Related').split(',').map(s => s.trim()).filter(Boolean),
        impactMetrics: this.parseImpactMetrics(content)
      };
    } catch (error) {
      console.error('Failed to parse issue content:', error);
      return null;
    }
  }

  private parseImpactMetrics(content: string): Issue['impactMetrics'] | undefined {
    const impactSection = content.match(/Impact Metrics:\n([\s\S]+?)(?=\n\n|\n*$)/)?.[1];
    if (!impactSection) return undefined;

    const lines = impactSection.split('\n');
    const getValue = (key: string): string[] => {
      const line = lines.find(l => l.startsWith(`  - ${key}:`));
      return line ? line.split(':')[1].trim().split(',').map(s => s.trim()) : [];
    };

    return {
      affectedComponents: getValue('Affected Components'),
      cascadingEffects: getValue('Cascading Effects'),
      recoverySteps: getValue('Recovery Steps'),
      estimatedRecoveryTime: parseInt(lines.find(l => l.includes('Recovery Time:'))?.split(':')[1] || '0', 10)
    };
  }

  private formatIssue(id: string, issue: Issue): string {
    const formatArray = (arr?: string[]): string => 
      arr?.length ? arr.join(', ') : 'none';

    let content = `### Issue ${id}

- Type: ${issue.type}
- Title: ${issue.title}
- Description: ${issue.description}
- Status: ${issue.status}
- Severity: ${issue.severity}
- Source: ${issue.source}
- Created: ${issue.timestamp}
- Updated: ${issue.lastUpdated}`;

    if (issue.assignee) {
      content += `\n- Assignee: ${issue.assignee}`;
    }
    if (issue.resolution) {
      content += `\n- Resolution: ${issue.resolution}`;
    }
    if (issue.relatedIssues?.length) {
      content += `\n- Related: ${formatArray(issue.relatedIssues)}`;
    }

    if (issue.impactMetrics) {
      content += `\n\nImpact Metrics:
  - Affected Components: ${formatArray(issue.impactMetrics.affectedComponents)}
  - Cascading Effects: ${formatArray(issue.impactMetrics.cascadingEffects)}
  - Recovery Steps: ${formatArray(issue.impactMetrics.recoverySteps)}
  - Estimated Recovery Time: ${issue.impactMetrics.estimatedRecoveryTime}`;
    }

    return content;
  }
} 
