/**
 * Error Tracker Tests
 * Tests for the error tracking and logging system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorTracker } from '../ErrorTracker';

// Mock console methods
const mockConsole = {
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn()
};

// Mock navigator
const mockNavigator = {
  userAgent: 'Test User Agent'
};

// Mock window location
const mockLocation = {
  href: 'https://test.example.com/test-page'
};

// Mock window with event listeners
const mockWindow = {
  location: mockLocation,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
};

// Setup global mocks
Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

// Mock process.env
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test'
  }
}));

describe('ErrorTracker', () => {
  let tracker: ErrorTracker;

  beforeEach(() => {
    vi.clearAllMocks();
    tracker = new ErrorTracker();
  });

  afterEach(() => {
    tracker.clearErrors();
  });

  describe('Error Capture', () => {
    it('should capture string errors', () => {
      const errorMessage = 'Test error message';
      const errorId = tracker.captureError(errorMessage);

      expect(errorId).toBeDefined();
      expect(typeof errorId).toBe('string');

      const errors = tracker.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toBe(errorMessage);
      expect(errors[0]?.level).toBe('error');
    });

    it('should capture Error objects', () => {
      const error = new Error('Test error object');
      tracker.captureError(error);

      const errors = tracker.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toBe('Test error object');
      expect(errors[0]?.stack).toBeDefined();
    });

    it('should capture errors with context', () => {
      const error = new Error('Test error');
      const context = {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123'
      };

      tracker.captureError(error, context);

      const errors = tracker.getErrors();
      expect(errors[0]?.context).toEqual(context);
      expect(errors[0]?.component).toBe('TestComponent');
      expect(errors[0]?.action).toBe('testAction');
    });

    it('should capture errors with different levels', () => {
      tracker.captureError('Error message', {}, 'error');
      tracker.captureError('Warning message', {}, 'warning');
      tracker.captureError('Info message', {}, 'info');
      tracker.captureError('Debug message', {}, 'debug');

      const errors = tracker.getErrors();
      expect(errors).toHaveLength(4);
      
      const levels = errors.map(e => e.level);
      expect(levels).toContain('error');
      expect(levels).toContain('warning');
      expect(levels).toContain('info');
      expect(levels).toContain('debug');
    });
  });

  describe('Specialized Error Capture', () => {
    it('should capture AI errors with specific context', () => {
      const error = new Error('AI model failed');
      const modelName = 'test-model';
      const operation = 'inference';
      const inputData = { input: 'test' };

      tracker.captureAIError(error, modelName, operation, inputData);

      const errors = tracker.getErrors();
      expect(errors[0]?.context?.['modelName']).toBe(modelName);
      expect(errors[0]?.context?.['operation']).toBe(operation);
      expect(errors[0]?.tags).toContain('ai');
      expect(errors[0]?.tags).toContain(modelName);
    });

    it('should capture network errors', () => {
      const error = new Error('Network request failed');
      const url = 'https://api.example.com/data';
      const method = 'GET';
      const statusCode = 500;

      tracker.captureNetworkError(error, url, method, statusCode);

      const errors = tracker.getErrors();
      expect(errors[0]?.context?.['url']).toBe(url);
      expect(errors[0]?.context?.['method']).toBe(method);
      expect(errors[0]?.context?.['statusCode']).toBe(statusCode);
      expect(errors[0]?.tags).toContain('network');
    });

    it('should capture component errors', () => {
      const error = new Error('Component render failed');
      const componentName = 'TestComponent';
      const props = { prop1: 'value1' };
      const state = { state1: 'value1' };

      tracker.captureComponentError(error, componentName, props, state);

      const errors = tracker.getErrors();
      expect(errors[0]?.component).toBe(componentName);
      expect(errors[0]?.tags).toContain('react');
      expect(errors[0]?.tags).toContain('component');
    });

    it('should capture performance errors', () => {
      const message = 'Performance threshold exceeded';
      const metric = 'render-time';
      const value = 100;
      const threshold = 50;

      tracker.capturePerformanceError(message, metric, value, threshold);

      const errors = tracker.getErrors();
      expect(errors[0]?.level).toBe('warning');
      expect(errors[0]?.context?.['metric']).toBe(metric);
      expect(errors[0]?.context?.['value']).toBe(value);
      expect(errors[0]?.context?.['threshold']).toBe(threshold);
      expect(errors[0]?.tags).toContain('performance');
    });
  });

  describe('Error Filtering', () => {
    beforeEach(() => {
      // Add test errors
      tracker.captureError('Error 1', { component: 'ComponentA' }, 'error');
      tracker.captureError('Warning 1', { component: 'ComponentB' }, 'warning');
      tracker.captureError('Error 2', { component: 'ComponentA', tags: ['critical'] }, 'error');
    });

    it('should filter errors by level', () => {
      const errorLevelErrors = tracker.getErrors({ level: 'error' });
      const warningLevelErrors = tracker.getErrors({ level: 'warning' });

      expect(errorLevelErrors).toHaveLength(2);
      expect(warningLevelErrors).toHaveLength(1);
    });

    it('should filter errors by component', () => {
      const componentAErrors = tracker.getErrors({ component: 'ComponentA' });
      const componentBErrors = tracker.getErrors({ component: 'ComponentB' });

      expect(componentAErrors).toHaveLength(2);
      expect(componentBErrors).toHaveLength(1);
    });

    it('should filter errors by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);

      const recentErrors = tracker.getErrors({
        timeRange: { start: oneHourAgo, end: now }
      });

      expect(recentErrors).toHaveLength(3); // All errors are recent
    });

    it('should filter errors by tags', () => {
      const criticalErrors = tracker.getErrors({ tags: ['critical'] });
      expect(criticalErrors).toHaveLength(1);
    });
  });

  describe('Error Statistics', () => {
    beforeEach(() => {
      tracker.captureError('TypeError: Cannot read property', {}, 'error');
      tracker.captureError('NetworkError: Failed to fetch', {}, 'error');
      tracker.captureError('Warning message', { component: 'TestComponent' }, 'warning');
    });

    it('should generate error statistics', () => {
      const stats = tracker.getErrorStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByLevel['error']).toBe(2);
      expect(stats.errorsByLevel['warning']).toBe(1);
      expect(stats.errorsByType['TypeError']).toBe(1);
      expect(stats.errorsByType['NetworkError']).toBe(1);
      expect(stats.errorsByComponent['TestComponent']).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('should calculate error rate', () => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const now = Date.now();

      const stats = tracker.getErrorStats({ start: oneHourAgo, end: now });
      expect(stats.errorRate).toBe(3); // 3 errors in 1 hour
    });
  });

  describe('Error Export', () => {
    beforeEach(() => {
      tracker.captureError('Test error', { component: 'TestComponent' });
    });

    it('should export errors as JSON', () => {
      const exported = tracker.exportErrors('json');
      const data = JSON.parse(exported);

      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('exportTime');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('errors');
      expect(data.errors).toHaveLength(1);
    });

    it('should export errors as CSV', () => {
      const exported = tracker.exportErrors('csv');
      const lines = exported.split('\n');

      expect(lines[0]).toContain('ID,Timestamp,Level,Message');
      expect(lines[1]).toContain('Test error');
    });
  });

  describe('Event Listeners', () => {
    it('should notify listeners when errors occur', () => {
      const listener = vi.fn();
      const unsubscribe = tracker.onError(listener);

      tracker.captureError('Test error');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          level: 'error'
        })
      );

      unsubscribe();
      tracker.captureError('Another error');

      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Health Check', () => {
    it('should report healthy status with few errors', () => {
      tracker.captureError('Single error');
      expect(tracker.isHealthy()).toBe(true);
    });

    it('should report unhealthy status with many errors', () => {
      // Add more than 10 errors in 5 minutes
      for (let i = 0; i < 12; i++) {
        tracker.captureError(`Error ${i}`, {}, 'error');
      }

      expect(tracker.isHealthy()).toBe(false);
    });

    it('should provide detailed health status', () => {
      tracker.captureError('Critical error', { tags: ['critical'] }, 'error');
      tracker.captureError('Regular error', {}, 'error');

      const health = tracker.getHealthStatus();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('errorRate');
      expect(health).toHaveProperty('recentErrorCount');
      expect(health).toHaveProperty('criticalErrors');
      expect(health.criticalErrors).toHaveLength(1);
    });
  });

  describe('Session Management', () => {
    it('should generate unique session IDs', () => {
      const tracker1 = new ErrorTracker();
      const tracker2 = new ErrorTracker();

      expect(tracker1.getSessionId()).not.toBe(tracker2.getSessionId());
    });

    it('should set user ID for all errors', () => {
      const userId = 'user123';
      
      tracker.captureError('Error before user ID');
      
      // Should not throw an error
      expect(() => tracker.setUserId(userId)).not.toThrow();
      
      tracker.captureError('Error after user ID');
      
      const errors = tracker.getErrors();
      expect(errors).toHaveLength(2);
    });
  });

  describe('Memory Management', () => {
    it('should limit stored errors to prevent memory leaks', () => {
      // Add more than the limit (1000)
      for (let i = 0; i < 1100; i++) {
        tracker.captureError(`Error ${i}`);
      }

      const errors = tracker.getErrors();
      expect(errors).toHaveLength(1000);
    });

    it('should clear all errors', () => {
      tracker.captureError('Test error');
      expect(tracker.getErrors()).toHaveLength(1);

      tracker.clearErrors();
      expect(tracker.getErrors()).toHaveLength(0);
    });
  });
});