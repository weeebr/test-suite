import { IncomingMessage } from 'http';

export interface NetworkMetrics {
  requestSize?: number;
  responseSize?: number;
  bandwidth?: number;
  concurrentConnections?: number;
  timeToFirstByte?: number;
}

export interface NetworkEvent {
  type: 'request' | 'response' | 'error' | 'timeout' | 'websocket';
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  timestamp: number;
  error?: Error;
  headers?: Record<string, string | string[] | undefined>;
  metrics?: NetworkMetrics;
  protocol?: 'http' | 'https' | 'ws' | 'wss' | 'fetch';
}

export interface ActiveRequest {
  startTime: number;
  req: IncomingMessage;
  metrics: NetworkMetrics;
} 
