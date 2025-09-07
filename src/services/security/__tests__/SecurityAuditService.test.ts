/**
 * Tests for SecurityAuditService
 */

import { SecurityAuditService, SecurityEventType, SecuritySeverity } from '../SecurityAuditService';

describe('SecurityAuditService', () => {
  let service: SecurityAuditService;

  beforeEach(() => {
    service = SecurityAuditService.getInstance();
    // Clear any existing data
    service.destroy();
    service = SecurityAuditService.getInstance();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Event logging', () => {
    test('should log security events correctly', () => {
      const event = service.logEvent(
        SecurityEventType.AUTHENTICATION,
        SecuritySeverity.INFO,
        'test_source',
        { action: 'login', userId: 'user123' }
      );

      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.type).toBe(SecurityEventType.AUTHENTICATION);
      expect(event.severity).toBe(SecuritySeverity.INFO);
      expect(event.source).toBe('test_source');
      expect(event.details.action).toBe('login');
      expect(event.details.userId).toBe('user123');
      expect(event.metadata?.riskScore).toBeDefined();
    });

    test('should generate unique event IDs', () => {
      const event1 = service.logEvent(
        SecurityEventType.AUTHENTICATION,
        SecuritySeverity.INFO,
        'source1',
        {}
      );
      
      const event2 = service.logEvent(
        SecurityEventType.AUTHENTICATION,
        SecuritySeverity.INFO,
        'source2',
        {}
      );

      expect(event1.id).not.toBe(event2.id);
    });

    test('should calculate risk scores correctly', () => {
      const criticalEvent = service.logEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        SecuritySeverity.CRITICAL,
        'test_source',
        {}
      );

      const infoEvent = service.logEvent(
        SecurityEventType.AUTHENTICATION,
        SecuritySeverity.INFO,
        'test_source',
        {}
      );

      expect(criticalEvent.metadata?.riskScore).toBeGreaterThan(
        infoEvent.metadata?.riskScore || 0
      );
    });
  });

  describe('Authentication event logging', () => {
    test('should log successful login with INFO severity', () => {
      const event = service.logAuthEvent('login', 'user123');

      expect(event.type).toBe(SecurityEventType.AUTHENTICATION);
      expect(event.severity).toBe(SecuritySeverity.INFO);
      expect(event.details.action).toBe('login');
      expect(event.details.userId).toBe('user123');
    });

    test('should log failed login with MEDIUM severity', () => {
      const event = service.logAuthEvent('failed_login', 'user123');

      expect(event.type).toBe(SecurityEventType.AUTHENTICATION);
      expect(event.severity).toBe(SecuritySeverity.MEDIUM);
      expect(event.details.action).toBe('failed_login');
    });

    test('should log account locked with MEDIUM severity', () => {
      const event = service.logAuthEvent('account_locked', 'user123');

      expect(event.severity).toBe(SecuritySeverity.MEDIUM);
      expect(event.details.action).toBe('account_locked');
    });
  });

  describe('Event filtering and retrieval', () => {
    beforeEach(() => {
      // Create test events
      service.logEvent(SecurityEventType.AUTHENTICATION, SecuritySeverity.INFO, 'auth', {});
      service.logEvent(SecurityEventType.AUTHENTICATION, SecuritySeverity.MEDIUM, 'auth', {});
      service.logEvent(SecurityEventType.DATA_ACCESS, SecuritySeverity.LOW, 'data', {});
      service.logEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, SecuritySeverity.HIGH, 'detector', {});
    });

    test('should retrieve all events when no filter is provided', () => {
      const events = service.getEvents();
      expect(events).toHaveLength(4);
    });

    test('should filter events by type', () => {
      const authEvents = service.getEvents({ type: SecurityEventType.AUTHENTICATION });
      expect(authEvents).toHaveLength(2);
      expect(authEvents.every(e => e.type === SecurityEventType.AUTHENTICATION)).toBe(true);
    });

    test('should filter events by severity', () => {
      const mediumEvents = service.getEvents({ severity: SecuritySeverity.MEDIUM });
      expect(mediumEvents).toHaveLength(1);
      expect(mediumEvents[0].severity).toBe(SecuritySeverity.MEDIUM);
    });

    test('should limit number of returned events', () => {
      const limitedEvents = service.getEvents({ limit: 2 });
      expect(limitedEvents).toHaveLength(2);
    });

    test('should filter events by time range', () => {
      const now = Date.now();
      const oneHourAgo = now - 3600000;
      
      const recentEvents = service.getEvents({ 
        startTime: oneHourAgo,
        endTime: now 
      });
      
      expect(recentEvents.every(e => e.timestamp >= oneHourAgo && e.timestamp <= now)).toBe(true);
    });

    test('should return events sorted by timestamp (newest first)', () => {
      const events = service.getEvents();
      
      for (let i = 1; i < events.length; i++) {
        expect(events[i - 1].timestamp).toBeGreaterThanOrEqual(events[i].timestamp);
      }
    });
  });

  describe('Anomaly detection', () => {
    test('should detect brute force attacks', () => {
      // Simulate multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        service.logAuthEvent('failed_login', 'user123');
      }

      // Trigger anomaly detection manually
      (service as any).detectAnomalies();

      const anomalies = service.getAnomalies();
      const bruteForceAnomaly = anomalies.find(a => a.type === 'brute_force_attack');
      
      expect(bruteForceAnomaly).toBeDefined();
      expect(bruteForceAnomaly?.events).toHaveLength(6);
      expect(bruteForceAnomaly?.riskScore).toBeGreaterThan(0);
    });

    test('should create immediate anomalies for critical events', () => {
      service.logEvent(
        SecurityEventType.SYSTEM_SECURITY,
        SecuritySeverity.CRITICAL,
        'test_source',
        { critical_issue: true }
      );

      const anomalies = service.getAnomalies();
      const criticalAnomaly = anomalies.find(a => a.type === 'critical_security_event');
      
      expect(criticalAnomaly).toBeDefined();
      expect(criticalAnomaly?.riskScore).toBe(1.0);
      expect(criticalAnomaly?.confidence).toBe(1.0);
    });

    test('should not detect anomalies with insufficient failed logins', () => {
      // Only 3 failed attempts (below threshold of 5)
      for (let i = 0; i < 3; i++) {
        service.logAuthEvent('failed_login', 'user123');
      }

      (service as any).detectAnomalies();

      const anomalies = service.getAnomalies();
      const bruteForceAnomaly = anomalies.find(a => a.type === 'brute_force_attack');
      
      expect(bruteForceAnomaly).toBeUndefined();
    });
  });

  describe('Compliance reporting', () => {
    beforeEach(() => {
      const now = Date.now();
      
      // Create events within the report period
      service.logEvent(SecurityEventType.AUTHENTICATION, SecuritySeverity.INFO, 'auth', {});
      service.logEvent(SecurityEventType.AUTHENTICATION, SecuritySeverity.MEDIUM, 'auth', {});
      service.logEvent(SecurityEventType.DATA_ACCESS, SecuritySeverity.LOW, 'data', {});
      service.logEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, SecuritySeverity.CRITICAL, 'detector', {});
    });

    test('should generate compliance report with correct structure', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      const report = service.generateComplianceReport(oneDayAgo, now);

      expect(report.id).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.period.start).toBe(oneDayAgo);
      expect(report.period.end).toBe(now);
      expect(report.eventsSummary).toBeDefined();
      expect(report.severitySummary).toBeDefined();
      expect(report.complianceScore).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    test('should count events correctly in summary', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      const report = service.generateComplianceReport(oneDayAgo, now);

      expect(report.eventsSummary[SecurityEventType.AUTHENTICATION]).toBe(2);
      expect(report.eventsSummary[SecurityEventType.DATA_ACCESS]).toBe(1);
      expect(report.eventsSummary[SecurityEventType.SUSPICIOUS_ACTIVITY]).toBe(1);
      
      expect(report.severitySummary[SecuritySeverity.INFO]).toBe(1);
      expect(report.severitySummary[SecuritySeverity.MEDIUM]).toBe(1);
      expect(report.severitySummary[SecuritySeverity.LOW]).toBe(1);
      expect(report.severitySummary[SecuritySeverity.CRITICAL]).toBe(1);
    });

    test('should calculate compliance score correctly', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      const report = service.generateComplianceReport(oneDayAgo, now);

      // Score should be reduced due to critical and medium events
      expect(report.complianceScore).toBeLessThan(100);
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
    });

    test('should generate appropriate recommendations', () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      
      const report = service.generateComplianceReport(oneDayAgo, now);

      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    beforeEach(() => {
      service.logEvent(SecurityEventType.AUTHENTICATION, SecuritySeverity.INFO, 'auth', {});
      service.logEvent(SecurityEventType.AUTHENTICATION, SecuritySeverity.MEDIUM, 'auth', {});
      service.logEvent(SecurityEventType.DATA_ACCESS, SecuritySeverity.LOW, 'data', {});
    });

    test('should provide accurate statistics', () => {
      const stats = service.getStatistics();

      expect(stats.totalEvents).toBe(3);
      expect(stats.eventsByType[SecurityEventType.AUTHENTICATION]).toBe(2);
      expect(stats.eventsByType[SecurityEventType.DATA_ACCESS]).toBe(1);
      expect(stats.eventsBySeverity[SecuritySeverity.INFO]).toBe(1);
      expect(stats.eventsBySeverity[SecuritySeverity.MEDIUM]).toBe(1);
      expect(stats.eventsBySeverity[SecuritySeverity.LOW]).toBe(1);
    });
  });

  describe('Utility functions', () => {
    test('should generate unique IDs', () => {
      const service1 = new (SecurityAuditService as any)();
      const service2 = new (SecurityAuditService as any)();
      
      const id1 = service1.generateEventId();
      const id2 = service2.generateEventId();
      
      expect(id1).not.toBe(id2);
    });

    test('should calculate risk scores within valid range', () => {
      const event = service.logEvent(
        SecurityEventType.AUTHENTICATION,
        SecuritySeverity.HIGH,
        'test',
        { action: 'failed_login' }
      );

      expect(event.metadata?.riskScore).toBeGreaterThanOrEqual(0);
      expect(event.metadata?.riskScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Event persistence', () => {
    test('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage full');
      });

      // Should not throw an error
      expect(() => {
        service.logEvent(SecurityEventType.AUTHENTICATION, SecuritySeverity.INFO, 'test', {});
      }).not.toThrow();

      // Restore original method
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Memory management', () => {
    test('should limit number of events in memory', () => {
      const maxEvents = (service as any).maxEvents;
      
      // Create more events than the limit
      for (let i = 0; i < maxEvents + 100; i++) {
        service.logEvent(SecurityEventType.AUTHENTICATION, SecuritySeverity.INFO, 'test', { index: i });
      }

      const events = service.getEvents();
      expect(events.length).toBeLessThanOrEqual(maxEvents);
    });
  });
});