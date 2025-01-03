import { Issue } from './issueTypes';

export class IssueAnalyzer {
  public getRelatedIssues(id: string, issues: Map<string, Issue>): Issue[] {
    const issue = issues.get(id);
    if (!issue?.relatedIssues) return [];
    return issue.relatedIssues
      .map(relatedId => issues.get(relatedId))
      .filter((i): i is Issue => i !== undefined);
  }

  public linkIssues(
    id1: string, 
    id2: string, 
    issues: Map<string, Issue>,
    updateCallback: (id: string, changes: Partial<Issue>) => void
  ): void {
    const issue1 = issues.get(id1);
    const issue2 = issues.get(id2);

    if (!issue1 || !issue2) {
      throw new Error('One or both issues not found');
    }

    const relatedIssues1 = new Set(issue1.relatedIssues || []);
    const relatedIssues2 = new Set(issue2.relatedIssues || []);

    relatedIssues1.add(id2);
    relatedIssues2.add(id1);

    updateCallback(id1, { relatedIssues: Array.from(relatedIssues1) });
    updateCallback(id2, { relatedIssues: Array.from(relatedIssues2) });
  }

  public unlinkIssues(
    id1: string, 
    id2: string, 
    issues: Map<string, Issue>,
    updateCallback: (id: string, changes: Partial<Issue>) => void
  ): void {
    const issue1 = issues.get(id1);
    const issue2 = issues.get(id2);

    if (!issue1 || !issue2) {
      throw new Error('One or both issues not found');
    }

    const relatedIssues1 = new Set(issue1.relatedIssues || []);
    const relatedIssues2 = new Set(issue2.relatedIssues || []);

    relatedIssues1.delete(id2);
    relatedIssues2.delete(id1);

    updateCallback(id1, { relatedIssues: Array.from(relatedIssues1) });
    updateCallback(id2, { relatedIssues: Array.from(relatedIssues2) });
  }
} 
