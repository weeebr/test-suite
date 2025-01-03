import { PortManager } from './portManager';
import { PortConfig } from '../config';
import { TestResult } from '../state';

export async function runTest(): Promise<TestResult> {
  try {
    const config: PortConfig = {
      port: 8080,
      basePort: 9000,
      minPort: 8000,
      maxPort: 10000,
      reservedPorts: [8080, 8081],
      services: {
        test: {
          port: 9001,
          host: 'localhost',
          protocol: 'http',
          priority: 1
        }
      }
    };

    const portManager = new PortManager(config);

    // Test 1: Reserved ports are respected
    const usedPorts = portManager.getUsedPorts();
    if (!config.reservedPorts.every(port => usedPorts.includes(port))) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Reserved ports not properly initialized'
      };
    }

    // Test 2: Service port allocation
    const servicePort = await portManager.findAvailablePort('test');
    if (servicePort !== config.services.test.port) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Service port not properly allocated'
      };
    }

    // Test 3: Port availability check
    const isAvailable = await portManager.isPortAvailable(9000);
    if (typeof isAvailable !== 'boolean') {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Port availability check failed'
      };
    }

    // Test 4: Port release
    portManager.releasePort(servicePort);
    if (portManager.getUsedPorts().includes(servicePort)) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Port not properly released'
      };
    }

    // Test 5: Port allocation with preferred port
    const preferredPort = 9004;
    const allocatedPort = await portManager.allocatePort('test', preferredPort);
    if (allocatedPort !== preferredPort) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Preferred port allocation failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Port manager tests passed'
    };
  } catch (error) {
    return {
      file: __filename,
      type: 'runtime',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error)
    };
  }
} 
