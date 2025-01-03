import { TestResult } from '../../core/state';
import { ImpactAnalyzer } from './impactAnalyzer';

export async function runTest(): Promise<TestResult> {
  try {
    const analyzer = ImpactAnalyzer.getInstance();

    // Test component impact analysis
    const components = ['ComponentA', 'ComponentB', 'ComponentC', 'ComponentD'];
    components.forEach(component => {
      switch (component) {
        case 'ComponentA':
          analyzer.registerComponent(component, ['ComponentB', 'ComponentC']);
          break;
        case 'ComponentB':
          analyzer.registerComponent(component, ['ComponentD']);
          break;
        case 'ComponentC':
          analyzer.registerComponent(component, ['ComponentD']);
          break;
        case 'ComponentD':
          analyzer.registerComponent(component, []);
          break;
      }
    });

    // Create an error to analyze
    const error = new Error('Test error');
    Error.captureStackTrace(error, runTest);
    const impact = await analyzer.analyzeError(error);

    if (!impact) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Impact analysis failed - no impact metrics returned',
        code: 'ERR_NO_IMPACT'
      };
    }

    // Verify affected components
    const expectedAffected = ['ComponentA', 'ComponentB', 'ComponentC', 'ComponentD'];
    const actualAffected = impact.affectedComponents;

    if (!expectedAffected.every(c => actualAffected.includes(c))) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Impact analysis failed - incorrect affected components',
        code: 'ERR_IMPACT_COMPONENTS'
      };
    }

    // Verify severity calculation
    if (!['medium', 'high', 'critical'].includes(impact.severity)) {
      return {
        file: __filename,
        type: 'runtime',
        severity: 'error',
        message: 'Impact analysis failed - incorrect severity calculation',
        code: 'ERR_IMPACT_SEVERITY'
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
      message: error instanceof Error ? error.message : String(error),
      code: 'ERR_UNEXPECTED'
    };
  }
} 
