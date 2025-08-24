/**
 * Performance Monitoring Hook
 * React hook for integrating performance monitoring into components
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '../services/monitoring/PerformanceMonitor';
import { errorTracker } from '../services/monitoring/ErrorTracker';
import { workerManager } from '../services/workers/WorkerManager';

interface UsePerformanceMonitoringOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackAI?: boolean;
  trackErrors?: boolean;
  autoOptimize?: boolean;
}

interface PerformanceHookReturn {
  startTimer: (name: string) => void;
  endTimer: (name: string) => number;
  recordMetric: (name: string, value: number, tags?: Record<string, string>) => void;
  recordError: (error: Error, context?: Record<string, any>) => void;
  recordAIInference: (modelName: string, duration: number) => void;
  getPerformanceScore: () => number;
  isHealthy: () => boolean;
}

export function usePerformanceMonitoring(
  options: UsePerformanceMonitoringOptions = {}
): PerformanceHookReturn {
  const {
    componentName = 'UnknownComponent',
    trackRenders = true,
    trackAI = true,
    trackErrors = true,
    autoOptimize = true
  } = options;

  const renderStartTime = useRef<number>(0);
  const mountTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);

  // Track component mount and unmount
  useEffect(() => {
    const mountDuration = Date.now() - mountTime.current;
    
    performanceMonitor.recordMetric({
      name: 'component-mount-time',
      value: mountDuration,
      timestamp: Date.now(),
      tags: { component: componentName, type: 'lifecycle' }
    });

    return () => {
      const totalLifetime = Date.now() - mountTime.current;
      
      performanceMonitor.recordMetric({
        name: 'component-lifetime',
        value: totalLifetime,
        timestamp: Date.now(),
        tags: { 
          component: componentName, 
          type: 'lifecycle',
          renderCount: renderCount.current.toString()
        }
      });
    };
  }, [componentName]);

  // Track renders
  useEffect(() => {
    if (trackRenders) {
      renderCount.current++;
      
      if (renderStartTime.current > 0) {
        const renderDuration = performance.now() - renderStartTime.current;
        performanceMonitor.recordComponentRender(componentName, renderDuration);
      }
      
      renderStartTime.current = performance.now();
    }
  });

  // Auto-optimization based on performance metrics
  useEffect(() => {
    if (!autoOptimize) return undefined;

    const checkPerformance = () => {
      const score = performanceMonitor.getPerformanceScore();
      const isHealthy = errorTracker.isHealthy();
      
      if (score < 70 || !isHealthy) {
        console.warn(`Performance degradation detected in ${componentName}:`, {
          score,
          isHealthy,
          suggestions: getOptimizationSuggestions(score, isHealthy)
        });
      }
    };

    const interval = setInterval(checkPerformance, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [componentName, autoOptimize]);

  const startTimer = useCallback((name: string) => {
    performanceMonitor.startTimer(`${componentName}-${name}`);
  }, [componentName]);

  const endTimer = useCallback((name: string): number => {
    return performanceMonitor.endTimer(`${componentName}-${name}`, {
      component: componentName
    });
  }, [componentName]);

  const recordMetric = useCallback((
    name: string, 
    value: number, 
    tags?: Record<string, string>
  ) => {
    performanceMonitor.recordMetric({
      name,
      value,
      timestamp: Date.now(),
      tags: { component: componentName, ...tags }
    });
  }, [componentName]);

  const recordError = useCallback((
    error: Error, 
    context?: Record<string, any>
  ) => {
    if (trackErrors) {
      errorTracker.captureComponentError(error, componentName, context);
    }
  }, [componentName, trackErrors]);

  const recordAIInference = useCallback((modelName: string, duration: number) => {
    if (trackAI) {
      performanceMonitor.recordAIInference(modelName, duration);
    }
  }, [trackAI]);

  const getPerformanceScore = useCallback(() => {
    return performanceMonitor.getPerformanceScore();
  }, []);

  const isHealthy = useCallback(() => {
    return errorTracker.isHealthy();
  }, []);

  return {
    startTimer,
    endTimer,
    recordMetric,
    recordError,
    recordAIInference,
    getPerformanceScore,
    isHealthy
  };
}

// Helper function for optimization suggestions
function getOptimizationSuggestions(score: number, isHealthy: boolean): string[] {
  const suggestions: string[] = [];

  if (score < 50) {
    suggestions.push('Consider lazy loading heavy components');
    suggestions.push('Optimize AI model inference times');
    suggestions.push('Reduce bundle size with code splitting');
  } else if (score < 70) {
    suggestions.push('Review component render performance');
    suggestions.push('Optimize image loading and caching');
  }

  if (!isHealthy) {
    suggestions.push('Review error logs for recurring issues');
    suggestions.push('Implement better error boundaries');
    suggestions.push('Add retry mechanisms for failed operations');
  }

  return suggestions;
}

// Higher-order component for automatic performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: UsePerformanceMonitoringOptions
) {
  const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  return function PerformanceMonitoredComponent(props: P) {
    const monitoring = usePerformanceMonitoring({
      componentName,
      ...options
    });

    // Add monitoring methods to props
    const enhancedProps = {
      ...props,
      performance: monitoring
    } as P & { performance: PerformanceHookReturn };

    return <WrappedComponent {...enhancedProps} />;
  };
}

// Hook for AI operations monitoring
export function useAIPerformanceMonitoring() {
  const recordAIOperation = useCallback(async (
    operation: () => Promise<any>,
    modelName: string,
    operationType: string
  ): Promise<any> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      performanceMonitor.recordAIInference(modelName, duration);
      performanceMonitor.recordMetric({
        name: 'ai-operation-success',
        value: duration,
        timestamp: Date.now(),
        tags: { 
          model: modelName, 
          operation: operationType,
          status: 'success'
        }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      errorTracker.captureAIError(
        error as Error,
        modelName,
        operationType
      );
      
      performanceMonitor.recordMetric({
        name: 'ai-operation-error',
        value: duration,
        timestamp: Date.now(),
        tags: { 
          model: modelName, 
          operation: operationType,
          status: 'error'
        }
      });
      
      throw error;
    }
  }, []);

  const recordWorkerTask = useCallback(async (
    taskType: string,
    payload: any
  ): Promise<any> => {
    const startTime = performance.now();
    
    try {
      const result = await workerManager.executeTask(taskType, payload);
      const duration = performance.now() - startTime;
      
      performanceMonitor.recordMetric({
        name: 'worker-task-time',
        value: duration,
        timestamp: Date.now(),
        tags: { 
          taskType,
          status: 'success'
        }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      errorTracker.captureError(error as Error, {
        component: 'WebWorker',
        taskType,
        payload: JSON.stringify(payload).slice(0, 500)
      });
      
      performanceMonitor.recordMetric({
        name: 'worker-task-error',
        value: duration,
        timestamp: Date.now(),
        tags: { 
          taskType,
          status: 'error'
        }
      });
      
      throw error;
    }
  }, []);

  return {
    recordAIOperation,
    recordWorkerTask
  };
}