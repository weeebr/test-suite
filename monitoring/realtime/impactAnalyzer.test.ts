import { ImpactAnalyzer } from './impactAnalyzer';
import { ErrorInterceptor } from './errorInterceptor';
import { TestResult } from '../../core/state';

export async function runTest(): Promise<TestResult> {
  try {
    const impactAnalyzer = ImpactAnalyzer.getInstance();
    const errorInterceptor = ErrorInterceptor.getInstance();
    impactAnalyzer.clearEvents();

    // Test 1: Component dependency tracking
    impactAnalyzer.registerComponent('ComponentA', ['ComponentB', 'ComponentC']);
    impactAnalyzer.registerComponent('ComponentB', ['ComponentD']);
    impactAnalyzer.registerComponent('ComponentC', ['ComponentD']);
    impactAnalyzer.registerComponent('ComponentD', []);

    // Test 2: Error impact analysis
    const error = new Error('Test runtime error');
    errorInterceptor.trackError('runtime', error, { source: 'ComponentD' });

    const events = impactAnalyzer.getEvents();
    if (events.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Impact analysis failed to track error'
      };
    }

    const impactEvent = events[0];
    if (impactEvent.metrics.affectedComponents.length < 4) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Cascade analysis failed to identify all affected components'
      };
    }

    // Test 3: Severity calculation
    if (impactEvent.metrics.severity !== 'critical') {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Severity calculation failed'
      };
    }

    // Test 4: Recovery steps
    if (impactEvent.metrics.recoverySteps.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Recovery steps generation failed'
      };
    }

    // Test 5: High severity event filtering
    const highSeverityEvents = impactAnalyzer.getHighSeverityEvents();
    if (highSeverityEvents.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'High severity event filtering failed'
      };
    }

    // Test 6: Component filtering
    const componentEvents = impactAnalyzer.getEventsByComponent('ComponentD');
    if (componentEvents.length === 0) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Component event filtering failed'
      };
    }

    // Test 7: Event emission
    let eventEmitted = false;
    impactAnalyzer.once('impact', () => {
      eventEmitted = true;
    });

    errorInterceptor.trackError('network', new Error('Test network error'), { source: 'ComponentA' });

    if (!eventEmitted) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Impact event emission failed'
      };
    }

    return {
      file: __filename,
      type: 'runtime',
      severity: 'info',
      message: 'Impact analyzer tests passed'
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
