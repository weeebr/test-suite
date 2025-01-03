import { NetworkMonitor } from './networkMonitor';
import { TestResult } from '../../core/state';
import { createServer, Server, IncomingMessage } from 'http';
import { AddressInfo } from 'net';

export async function runTest(): Promise<TestResult> {
  try {
    const networkMonitor = NetworkMonitor.getInstance();
    networkMonitor.clearEvents();

    // Setup test server
    const server = createServer((req, res) => {
      if (req.url === '/success') {
        res.writeHead(200);
        res.end('OK');
      } else if (req.url === '/error') {
        res.writeHead(500);
        res.end('Error');
      } else if (req.url === '/timeout') {
        // Don't respond, let it timeout
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(0, 'localhost', () => resolve());
    });

    const port = (server.address() as AddressInfo).port;

    try {
      // Test 1: Successful request
      const http = require('http');
      await new Promise<void>((resolve) => {
        http.get(`http://localhost:${port}/success`, (res: IncomingMessage) => {
          res.resume();
          resolve();
        });
      });

      const successEvents = networkMonitor.getEventsByType('response');
      if (successEvents.length === 0 || successEvents[0].statusCode !== 200) {
        return {
          file: __filename,
          type: 'runtime',
          severity: 'error',
          message: 'Success request tracking failed'
        };
      }

      // Test 2: Error request
      await new Promise<void>((resolve) => {
        http.get(`http://localhost:${port}/error`, (res: IncomingMessage) => {
          res.resume();
          resolve();
        });
      });

      const errorEvents = networkMonitor.getEventsByType('response');
      if (!errorEvents.some(e => e.statusCode === 500)) {
        return {
          file: __filename,
          type: 'runtime',
          severity: 'error',
          message: 'Error request tracking failed'
        };
      }

      // Test 3: Request tracking
      const requestEvents = networkMonitor.getEventsByType('request');
      if (requestEvents.length < 2) {
        return {
          file: __filename,
          type: 'runtime',
          severity: 'error',
          message: 'Request tracking failed'
        };
      }

      // Test 4: Timeout handling
      const timeoutPromise = new Promise<void>((resolve) => {
        const req = http.get(`http://localhost:${port}/timeout`, () => {});
        req.setTimeout(100);
        req.on('timeout', () => {
          req.destroy();
          resolve();
        });
      });

      await timeoutPromise;
      const timeoutEvents = networkMonitor.getEventsByType('timeout');
      if (timeoutEvents.length === 0) {
        return {
          file: __filename,
          type: 'runtime',
          severity: 'error',
          message: 'Timeout tracking failed'
        };
      }

      return {
        file: __filename,
        type: 'runtime',
        severity: 'info',
        message: 'Network monitor tests passed'
      };
    } finally {
      server.close();
    }
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
} 
