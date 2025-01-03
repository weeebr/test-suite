import { PortConfig } from '../config';
import { createServer } from 'net';

export class PortManager {
  private usedPorts: Set<number>;
  private config: PortConfig;

  constructor(config: PortConfig) {
    this.config = config;
    this.usedPorts = new Set(config.reservedPorts);
  }

  public async findAvailablePort(serviceName: string): Promise<number> {
    const service = this.config.services[serviceName];
    if (service?.port) {
      if (await this.isPortAvailable(service.port)) {
        this.usedPorts.add(service.port);
        return service.port;
      }
    }

    for (let port = this.config.basePort; port <= this.config.maxPort; port++) {
      if (!this.usedPorts.has(port) && await this.isPortAvailable(port)) {
        this.usedPorts.add(port);
        return port;
      }
    }

    throw new Error(`No available ports between ${this.config.basePort} and ${this.config.maxPort}`);
  }

  public async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, '127.0.0.1');
    });
  }

  public releasePort(port: number): void {
    this.usedPorts.delete(port);
  }

  public getServiceConfig(serviceName: string) {
    return this.config.services[serviceName];
  }

  public async allocatePort(serviceName: string, preferredPort?: number): Promise<number> {
    if (preferredPort) {
      if (await this.isPortAvailable(preferredPort)) {
        this.usedPorts.add(preferredPort);
        return preferredPort;
      }
    }

    return this.findAvailablePort(serviceName);
  }

  public getUsedPorts(): number[] {
    return Array.from(this.usedPorts);
  }

  public reset(): void {
    this.usedPorts = new Set(this.config.reservedPorts);
  }
} 
