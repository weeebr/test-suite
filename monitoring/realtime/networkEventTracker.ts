import { IncomingMessage } from 'http';
import { ErrorInterceptor } from './errorInterceptor';
import { NetworkEvent, ActiveRequest, NetworkMetrics } from './networkTypes';

export class NetworkEventTracker {
  private totalBandwidth = 0;
  private lastBandwidthUpdate = Date.now();
  private bandwidthWindow = 1000; // 1 second window for bandwidth calculation

  constructor(
    private events: NetworkEvent[],
    private activeRequests: Map<string, ActiveRequest>,
    private errorInterceptor: ErrorInterceptor,
    private emitEvent: (event: NetworkEvent) => void
  ) {}

  private calculateBandwidth(bytes: number): number {
    const now = Date.now();
    const timeDiff = now - this.lastBandwidthUpdate;
    
    if (timeDiff >= this.bandwidthWindow) {
      this.totalBandwidth = bytes;
      this.lastBandwidthUpdate = now;
    } else {
      this.totalBandwidth += bytes;
    }

    return this.totalBandwidth / (this.bandwidthWindow / 1000); // bytes per second
  }

  public trackRequest(requestId: string, req: IncomingMessage, protocol: 'http' | 'https' | 'ws' | 'wss' | 'fetch' = 'http'): void {
    const metrics: NetworkMetrics = {
      concurrentConnections: this.activeRequests.size + 1
    };

    let requestSize = 0;
    req.on('data', (chunk: Buffer) => {
      requestSize += chunk.length;
      metrics.requestSize = requestSize;
      metrics.bandwidth = this.calculateBandwidth(chunk.length);
    });

    const event: NetworkEvent = {
      type: 'request',
      method: req.method,
      url: req.url,
      timestamp: Date.now(),
      headers: req.headers,
      protocol,
      metrics
    };

    this.events.push(event);
    this.emitEvent(event);
    this.activeRequests.set(requestId, { startTime: Date.now(), req, metrics });
  }

  public trackResponse(requestId: string, res: IncomingMessage): void {
    const request = this.activeRequests.get(requestId);
    if (!request) return;

    const duration = Date.now() - request.startTime;
    const metrics = { ...request.metrics };

    let responseSize = 0;
    res.on('data', (chunk: Buffer) => {
      responseSize += chunk.length;
      metrics.responseSize = responseSize;
      metrics.bandwidth = this.calculateBandwidth(chunk.length);
    });

    res.once('readable', () => {
      metrics.timeToFirstByte = Date.now() - request.startTime;
    });

    const event: NetworkEvent = {
      type: 'response',
      method: request.req.method,
      url: request.req.url,
      statusCode: res.statusCode,
      duration,
      timestamp: Date.now(),
      headers: res.headers,
      metrics
    };

    this.events.push(event);
    this.emitEvent(event);
    this.activeRequests.delete(requestId);

    if (res.statusCode && res.statusCode >= 400) {
      this.errorInterceptor.trackError('network', new Error(`HTTP ${res.statusCode}`));
    }
  }

  public trackFetchResponse(requestId: string, response: Response, startTime: number): void {
    const duration = Date.now() - startTime;
    const event: NetworkEvent = {
      type: 'response',
      method: response.type,
      url: response.url,
      statusCode: response.status,
      duration,
      timestamp: Date.now(),
      headers: Object.fromEntries(response.headers.entries())
    };

    this.events.push(event);
    this.emitEvent(event);

    if (response.status >= 400) {
      this.errorInterceptor.trackError('network', new Error(`HTTP ${response.status}`));
    }
  }

  public trackError(requestId: string, error: Error): void {
    const request = this.activeRequests.get(requestId);
    const event: NetworkEvent = {
      type: 'error',
      method: request?.req.method,
      url: request?.req.url,
      timestamp: Date.now(),
      error
    };

    this.events.push(event);
    this.emitEvent(event);
    this.activeRequests.delete(requestId);
    this.errorInterceptor.trackError('network', error);
  }

  public trackTimeout(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (request) {
      const event: NetworkEvent = {
        type: 'timeout',
        method: request.req.method,
        url: request.req.url,
        timestamp: Date.now(),
        duration: Date.now() - request.startTime
      };
      this.events.push(event);
      this.emitEvent(event);
      this.activeRequests.delete(requestId);
    }
  }
} 
