import { TestResult } from '../../core/state';
import { MetricsManager } from './metricsManager';

export async function runTest(): Promise<TestResult> {
  try {
    const metricsManager = MetricsManager.getInstance();

    // Test metrics collection
    const testMetrics = {
      duration: 100,
      memory: 1024 * 1024,
      cpu: 0.5
    };

    metricsManager.trackMetrics('test-1', testMetrics);
    const metrics = metricsManager.getMetrics('test-1');

    if (!metrics || metrics.duration !== testMetrics.duration) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Metrics tracking failed'
      };
    }

    // Test aggregate metrics
    const aggregateMetrics = metricsManager.getAggregateMetrics();
    if (aggregateMetrics.totalDuration !== testMetrics.duration) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Aggregate metrics calculation failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Metrics tests passed'
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
