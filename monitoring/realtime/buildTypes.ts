export interface BuildEvent {
  type: 'start' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: number;
  file?: string;
  line?: number;
  column?: number;
  code?: string;
} 
