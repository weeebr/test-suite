import { cpus } from 'os';

export class ResourceMonitor {
  public static calculateCPULoad(times: { user: number; nice: number; sys: number; idle: number; irq: number }): number {
    const total = Object.values(times).reduce((a, b) => a + b, 0);
    const idle = times.idle;
    return 1 - idle / total;
  }

  public static getIOOperations(): number {
    try {
      const fs = require('fs');
      const stats = fs.statSync('/proc/self/io');
      return stats.size;
    } catch {
      return 0;
    }
  }

  public static getNetworkBandwidth(): number {
    try {
      const fs = require('fs');
      const stats = fs.statSync('/proc/self/net/dev');
      return stats.size;
    } catch {
      return 0;
    }
  }

  public static getCPULoad(): number[] {
    return cpus().map(cpu => this.calculateCPULoad(cpu.times));
  }
} 
