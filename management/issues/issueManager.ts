import { EventEmitter } from 'events';
import { ErrorInterceptor } from '../../monitoring/realtime/errorInterceptor';
import { ImpactAnalyzer } from '../../monitoring/realtime/impactAnalyzer';
import { Issue, IssueUpdate } from './issueTypes';
import { IssueStorage } from './issueStorage';
import { IssueAnalyzer } from './issueAnalyzer';

export class IssueManager extends EventEmitter {
  private static instance: IssueManager;
  private issues: Map<string, Issue> = new Map();
  private updates: IssueUpdate[] = [];
  private errorInterceptor: ErrorInterceptor;
  private impactAnalyzer: ImpactAnalyzer;
  private storage: IssueStorage;
  private analyzer: IssueAnalyzer;

  private constructor() {
    super();
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.impactAnalyzer = ImpactAnalyzer.getInstance();
    this.storage = new IssueStorage();
    this.analyzer = new IssueAnalyzer();
    this.setupErrorHandlers();
  }

  public static getInstance(): IssueManager {
    if (!IssueManager.instance) {
      IssueManager.instance = new IssueManager();
    }
    return IssueManager.instance;
  }

  private setupErrorHandlers(): void {
    this.errorInterceptor.on('error', async (error: Error) => {
      const id = await this.createIssue({
        type: 'error',
        title: error.name,
        description: error.message,
        severity: 'high',
        source: 'runtime'
      });

      const impact = await this.impactAnalyzer.analyzeError(error);
      if (impact) {
        this.updateIssue(id, { impactMetrics: impact });
      }
    });
  }

  public async initialize(): Promise<void> {
    try {
      const { issues, updates } = await this.storage.loadState();
      this.issues = issues;
      this.updates = updates;
    } catch (error) {
      console.error('Failed to initialize issue manager:', error);
    }
  }

  public createIssue(params: Omit<Issue, 'id' | 'status' | 'timestamp' | 'lastUpdated'>): string {
    const id = Math.random().toString(36).substring(2, 15);
    const now = Date.now();

    const issue: Issue = {
      ...params,
      id,
      status: 'open',
      timestamp: now,
      lastUpdated: now
    };

    this.issues.set(id, issue);
    this.emit('issueCreated', issue);
    this.storage.saveState(this.issues, this.updates);

    return id;
  }

  public updateIssue(id: string, changes: Partial<Issue>): void {
    const issue = this.issues.get(id);
    if (!issue) {
      throw new Error('Issue not found');
    }

    const updatedIssue: Issue = {
      ...issue,
      ...changes,
      id,
      lastUpdated: Date.now()
    };

    this.issues.set(id, updatedIssue);

    const update: IssueUpdate = {
      id,
      changes,
      timestamp: Date.now()
    };

    this.updates.push(update);
    this.emit('issueUpdated', updatedIssue);
    this.storage.saveState(this.issues, this.updates);
  }

  public getIssue(id: string): Issue | undefined {
    return this.issues.get(id);
  }

  public getAllIssues(): Issue[] {
    return Array.from(this.issues.values());
  }

  public getIssuesByStatus(status: Issue['status']): Issue[] {
    return this.getAllIssues().filter(i => i.status === status);
  }

  public getIssuesByType(type: Issue['type']): Issue[] {
    return this.getAllIssues().filter(i => i.type === type);
  }

  public getIssuesBySeverity(severity: Issue['severity']): Issue[] {
    return this.getAllIssues().filter(i => i.severity === severity);
  }

  public getRelatedIssues(id: string): Issue[] {
    return this.analyzer.getRelatedIssues(id, this.issues);
  }

  public linkIssues(id1: string, id2: string): void {
    this.analyzer.linkIssues(id1, id2, this.issues, (id, changes) => this.updateIssue(id, changes));
  }

  public unlinkIssues(id1: string, id2: string): void {
    this.analyzer.unlinkIssues(id1, id2, this.issues, (id, changes) => this.updateIssue(id, changes));
  }
}
