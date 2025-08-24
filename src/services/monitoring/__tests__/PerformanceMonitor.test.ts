/**
 * Performance Monitor Tests
 * Tests for the performance monitoring system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../PerformanceMonitor';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

// Mock PerformanceObserver
const mockPerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));

// Setup global mocks
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

Object.defineProperty(global, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('Metric Recording', () => {
    it('should record custom metrics', () => {
      const metric = {
        name: 'test-metric',
        value: 100,
        timestamp: Date.now(),
        tags: { type: 'test' }
      };

      monitor.recordMetric(metric);
      const metrics = monitor.getMetrics();

      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    it('should limit metrics to prevent memory leaks', () => {
      // Record more than the limit (1000)
      for (let i = 0; i < 1100; i++) {
        monitor.recordMetric({
          name: `metric-${i}`,
          value: i,
          timestamp: Date.now()
        });
      }

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1000);
    });

    it('should filter metrics by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      monitor.recordMetric({
        name: 'old-metric',
        value: 1,
        timestamp: oneHourAgo - 1000
      });

      monitor.recordMetric({
        name: 'recent-metric',
        value: 2,
        timestamp: now - 1000
      });

      const recentMetrics = monitor.getMetrics({
        start: oneHourAgo,
        end: now
      });

      expect(recentMetrics).toHaveLength(1);
      expect(recentMetrics[0]?.name).toBe('recent-metric');
    });
  });

  describe('Timer Functions', () => {
    it('should measure timer duration', () => {
      const timerName = 'test-timer';
      
      mockPerformance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500);

      monitor.startTimer(timerName);
      const duration = monitor.endTimer(timerName);

      expect(duration).toBe(500);
      
      const metrics = monitor.getMetrics();
      const timerMetric = metrics.find(m => m.name === timerName);
      expect(timerMetric).toBeDefined();
      expect(timerMetric?.value).toBe(500);
    });

    it('should handle missing timer gracefully', () => {
      const duration = monitor.endTimer('non-existent-timer');
      expect(duration).toBe(0);
    });
  });

  describe('AI Inference Tracking', () => {
    it('should record AI inference metrics', () => {
      const modelName = 'test-model';
      const duration = 250;

      monitor.recordAIInference(modelName, duration);

      const metrics = monitor.getMetrics();
      const aiMetric = metrics.find(m => m.name === 'ai-inference-time');
      
      expect(aiMetric).toBeDefined();
      expect(aiMetric?.value).toBe(duration);
      expect(aiMetric?.tags?.['model']).toBe(modelName);
    });
  });

  describe('Component Render Tracking', () => {
    it('should record component render times', () => {
      const componentName = 'TestComponent';
      const duration = 16.5;

      monitor.recordComponentRender(componentName, duration);

      const metrics = monitor.getMetrics();
      const renderMetric = metrics.find(m => m.name === 'component-render-time');
      
      expect(renderMetric).toBeDefined();
      expect(renderMetric?.value).toBe(duration);
      expect(renderMetric?.tags?.['component']).toBe(componentName);
    });
  });

  describe('Error and Request Tracking', () => {
    it('should track error rates', () => {
      const error = new Error('Test error');
      
      monitor.recordError(error, 'test-context');
      monitor.recordRequest(true); // Success
      monitor.recordRequest(false); // Failure

      const metrics = monitor.getMetrics();
      const errorRateMetric = metrics.find(m => m.name === 'error-rate');
      const successRateMetric = metrics.find(m => m.name === 'success-rate');
      
      expect(errorRateMetric).toBeDefined();
      expect(successRateMetric).toBeDefined();
      expect(errorRateMetric?.value).toBeGreaterThan(0);
      expect(successRateMetric?.value).toBeLessThan(100);
    });
  });

  describe('Performance Score Calculation', () => {
    it('should calculate performance score', () => {
      // Add some mock metrics for score calculation
      monitor.recordMetric({
        name: 'largest-contentful-paint',
        value: 2000, // Good LCP
        timestamp: Date.now(),
        tags: { type: 'paint' }
      });

      monitor.recordMetric({
        name: 'first-input-delay',
        value: 50, // Good FID
        timestamp: Date.now(),
        tags: { type: 'interaction' }
      });

      monitor.recordMetric({
        name: 'cumulative-layout-shift',
        value: 0.05, // Good CLS
        timestamp: Date.now(),
        tags: { type: 'layout' }
      });

      const score = monitor.getPerformanceScore();
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('Metrics Export', () => {
    it('should export metrics as JSON', () => {
      monitor.recordMetric({
        name: 'test-metric',
        value: 100,
        timestamp: Date.now()
      });

      const exported = monitor.exportMetrics();
      const data = JSON.parse(exported);

      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('summary');
      expect(data.metrics).toHaveLength(1);
      expect(data.summary).toHaveProperty('totalMetrics', 1);
    });
  });

  describe('Cleanup', () => {
    it('should clear all metrics', () => {
      monitor.recordMetric({
        name: 'test-metric',
        value: 100,
        timestamp: Date.now()
      });

      expect(monitor.getMetrics()).toHaveLength(1);
      
      monitor.clearMetrics();
      
      expect(monitor.getMetrics()).toHaveLength(0);
    });

    it('should destroy observers on cleanup', () => {
      const disconnectSpy = vi.fn();
      mockPerformanceObserver.mockImplementation(() => ({
        observe: vi.fn(),
        disconnect: disconnectSpy
      }));

      const newMonitor = new PerformanceMonitor();
      newMonitor.destroy();

      // Should have called disconnect on observers
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});