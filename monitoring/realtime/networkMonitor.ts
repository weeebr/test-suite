import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import { ErrorInterceptor } from './errorInterceptor';
import { NetworkEvent, ActiveRequest } from './networkTypes';
import { NetworkEventTracker } from './networkEventTracker';

export class NetworkMonitor extends EventEmitter {
  private static instance: NetworkMonitor;
  private events: NetworkEvent[] = [];
  private activeRequests = new Map<string, ActiveRequest>();
  private errorInterceptor: ErrorInterceptor;
  private eventTracker: NetworkEventTracker;

  private constructor() {
    super();
    this.errorInterceptor = ErrorInterceptor.getInstance();
    this.eventTracker = new NetworkEventTracker(
      this.events,
      this.activeRequests,
      this.errorInterceptor,
      (event) => this.emit('networkEvent', event)
    );
    this.setupGlobalHandlers();
  }

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') {
      // Node.js environment
      this.setupNodeHandlers();
    } else {
      // Browser environment
      this.setupBrowserHandlers();
    }
  }

  private setupNodeHandlers(): void {
    const http = require('http');
    const https = require('https');
    const WebSocket = require('ws');

    const originalHttpRequest = http.request;
    const originalHttpsRequest = https.request;
    const originalWsConnect = WebSocket.prototype.connect;

    const monitorRequest = (protocol: 'http' | 'https') => {
      return (url: string | URL, options: any, callback?: (res: IncomingMessage) => void) => {
        const startTime = Date.now();
        const requestId = `${protocol}-${startTime}-${Math.random()}`;

        const req = (protocol === 'http' ? originalHttpRequest : originalHttpsRequest)(url, options, (res: IncomingMessage) => {
          this.eventTracker.trackResponse(requestId, res);
          if (callback) callback(res);
        });

        this.eventTracker.trackRequest(requestId, req, protocol);
        return req;
      };
    };

    http.request = monitorRequest('http');
    https.request = monitorRequest('https');

    WebSocket.prototype.connect = function(...args: any[]) {
      const startTime = Date.now();
      const requestId = `ws-${startTime}-${Math.random()}`;
      
      this.on('open', () => {
        this.eventTracker.trackRequest(requestId, this, 'ws');
      });

      this.on('close', () => {
        this.eventTracker.trackResponse(requestId, this);
      });

      return originalWsConnect.apply(this, args);
    };
  }

  private setupBrowserHandlers(): void {
    const self = this;
    // Intercept fetch API
    const originalFetch = window.fetch;
    window.fetch = async function(input: string | URL | Request, init?: RequestInit): Promise<Response> {
      const startTime = Date.now();
      const requestId = `fetch-${startTime}-${Math.random()}`;

      try {
        const response = await originalFetch.call(window, input, init);
        self.eventTracker.trackResponse(requestId, response as any);
        return response;
      } catch (error) {
        self.errorInterceptor.trackError('network', error as Error);
        throw error;
      }
    };

    // Intercept WebSocket
    const originalWebSocket = window.WebSocket;
    (window as any).WebSocket = class extends originalWebSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        const startTime = Date.now();
        const requestId = `ws-${startTime}-${Math.random()}`;

        this.addEventListener('open', () => {
          self.eventTracker.trackRequest(requestId, this as any, 'ws');
        });

        this.addEventListener('close', () => {
          self.eventTracker.trackResponse(requestId, this as any);
        });
      }
    };
  }

  private setupRequestHandlers(requestId: string, req: any): void {
    const originalEmit = req.emit.bind(req);
    req.emit = (event: string, ...args: any[]) => {
      if (event === 'error') {
        this.eventTracker.trackError(requestId, args[0]);
      } else if (event === 'timeout') {
        this.eventTracker.trackTimeout(requestId);
      }
      return originalEmit(event, ...args);
    };
  }

  public getEvents(): NetworkEvent[] {
    return this.events;
  }

  public getEventsByType(type: NetworkEvent['type']): NetworkEvent[] {
    return this.events.filter(e => e.type === type);
  }

  public clearEvents(): void {
    this.events = [];
  }

  public getActiveRequests(): number {
    return this.activeRequests.size;
  }
} 
