/**
 * Monitoring Services Index
 * Exports all performance monitoring and error tracking services
 */

import { performanceMonitor } from './PerformanceMonitor';
import { errorTracker } from './ErrorTracker';
import { workerManager } from '../workers/WorkerManager';

export { PerformanceMonitor, performanceMonitor } from './PerformanceMonitor';
export { ErrorTracker, errorTracker } from './ErrorTracker';

// Re-export worker manager for convenience
export { WorkerManager, workerManager } from '../workers/WorkerManager';

// Note: Types are defined internally in the respective modules

// Utility functions for quick setup
export function initializeMonitoring(): void {
  // Performance monitoring is automatically initialized
  console.log('Performance monitoring initialized');
  
  // Error tracking is automatically initialized
  console.log('Error tracking initialized');
  
  // Set up global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      // Export final metrics before page unload
      const metrics = performanceMonitor.exportMetrics();
      const errors = errorTracker.exportErrors();
      
      // In a real app, you might want to send this to an analytics service
      console.log('Final metrics:', { metrics, errors });
    });
  }
}

// Health check function
export function getSystemHealth(): {
  performance: number;
  errors: boolean;
  workers: { pending: number; active: number; queue: number };
  overall: 'healthy' | 'warning' | 'critical';
} {
  const performanceScore = performanceMonitor.getPerformanceScore();
  const isHealthy = errorTracker.isHealthy();
  const workerStatus = workerManager.getQueueStatus();
  
  let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  if (performanceScore < 50 || !isHealthy) {
    overall = 'critical';
  } else if (performanceScore < 70 || workerStatus.queue > 10) {
    overall = 'warning';
  }
  
  return {
    performance: performanceScore,
    errors: isHealthy,
    workers: workerStatus,
    overall
  };
}