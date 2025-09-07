/**
 * Security audit logging and monitoring service
 * Implements comprehensive security event logging, anomaly detection, and compliance reporting
 */

export interface SecurityEvent {
  id: string;
  timestamp: number;
  type: SecurityEventType;
  severity: SecuritySeverity;
  source: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  metadata?: SecurityEventMetadata;
}

export interface SecurityEventMetadata {
  location?: string;
  deviceFingerprint?: string;
  riskScore?: number;
  correlationId?: string;
  tags?: string[];
}

export enum SecurityEventType {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_ACCESS = 'data_access',
  INPUT_VALIDATION = 'input_validation',
  RATE_LIMITING = 'rate_limiting',
  FILE_UPLOAD = 'file_upload',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PRIVACY_VIOLATION = 'privacy_violation',
  SYSTEM_SECURITY = 'system_security',
  COMPLIANCE = 'compliance'
}

export enum SecuritySeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AnomalyPattern {
  id: string;
  type: string;
  description: string;
  detectedAt: number;
  confidence: number;
  events: SecurityEvent[];
  riskScore: number;
  status: 'active' | 'resolved' | 'investigating';
}

export interface ComplianceReport {
  id: string;
  generatedAt: number;
  period: { start: number; end: number };
  eventsSummary: Record<SecurityEventType, number>;
  severitySummary: Record<SecuritySeverity, number>;
  anomalies: AnomalyPattern[];
  complianceScore: number;
  recommendations: string[];
}

export class SecurityAuditService {
  private static instance: SecurityAuditService;
  private events: SecurityEvent[] = [];
  private anomalies: AnomalyPattern[] = [];
  private maxEvents = 10000;
  private anomalyDetectionInterval: NodeJS.Timeout;
  private eventListeners: Map<SecurityEventType, ((event: SecurityEvent) => void)[]> = new Map();

  public static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  constructor() {
    this.anomalyDetectionInterval = setInterval(() => {
      this.detectAnomalies();
    }, 5 * 60 * 1000);

    Object.values(SecurityEventType).forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  /**
   * Log a security event
   */
  public logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    source: string,
    details: any,
    metadata?: Partial<SecurityEventMetadata>
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type,
      severity,
      source,
      details,
      metadata: {
        riskScore: this.calculateRiskScore(type, severity, details),
        correlationId: this.generateCorrelationId(),
        ...metadata
      }
    };

    if (typeof window !== 'undefined') {
      event.userAgent = navigator.userAgent;
      event.metadata!.deviceFingerprint = this.generateDeviceFingerprint();
    }

    this.events.push(event);

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    this.persistEvent(event);
    this.notifyEventListeners(event);

    if (severity === SecuritySeverity.CRITICAL) {
      this.checkImmediateAnomalies(event);
    }

    console.log(`Security Event [${severity.toUpperCase()}]: ${type} - ${source}`, event);
    return event;
  }

  /**
   * Log authentication events
   */
  public logAuthEvent(
    action: 'login' | 'logout' | 'failed_login' | 'password_change' | 'account_locked',
    userId?: string,
    details?: any
  ): SecurityEvent {
    const severity = action === 'failed_login' || action === 'account_locked' 
      ? SecuritySeverity.MEDIUM 
      : SecuritySeverity.INFO;

    return this.logEvent(
      SecurityEventType.AUTHENTICATION,
      severity,
      'auth_system',
      { action, userId, ...details }
    );
  }

  /**
   * Generate compliance report
   */
  public generateComplianceReport(
    startTime: number,
    endTime: number
  ): ComplianceReport {
    const periodEvents = this.events.filter(e => 
      e.timestamp >= startTime && e.timestamp <= endTime
    );

    const eventsSummary: Record<SecurityEventType, number> = {} as any;
    const severitySummary: Record<SecuritySeverity, number> = {} as any;

    Object.values(SecurityEventType).forEach(type => {
      eventsSummary[type] = 0;
    });
    Object.values(SecuritySeverity).forEach(severity => {
      severitySummary[severity] = 0;
    });

    periodEvents.forEach(event => {
      eventsSummary[event.type]++;
      severitySummary[event.severity]++;
    });

    const periodAnomalies = this.anomalies.filter(a => 
      a.detectedAt >= startTime && a.detectedAt <= endTime
    );

    const complianceScore = this.calculateComplianceScore(periodEvents, periodAnomalies);
    const recommendations = this.generateRecommendations(periodEvents, periodAnomalies, complianceScore);

    return {
      id: this.generateReportId(),
      generatedAt: Date.now(),
      period: { start: startTime, end: endTime },
      eventsSummary,
      severitySummary,
      anomalies: periodAnomalies,
      complianceScore,
      recommendations
    };
  }

  private detectAnomalies(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const recentEvents = this.events.filter(e => e.timestamp > oneHourAgo);

    this.detectAuthFailureAnomalies(recentEvents);
  }

  private detectAuthFailureAnomalies(events: SecurityEvent[]): void {
    const authFailures = events.filter(e => 
      e.type === SecurityEventType.AUTHENTICATION && 
      e.details.action === 'failed_login'
    );

    const failuresByUser = new Map<string, SecurityEvent[]>();
    authFailures.forEach(event => {
      const userId = event.userId || 'anonymous';
      if (!failuresByUser.has(userId)) {
        failuresByUser.set(userId, []);
      }
      failuresByUser.get(userId)!.push(event);
    });

    failuresByUser.forEach((failures, userId) => {
      if (failures.length >= 5) {
        this.createAnomaly({
          type: 'brute_force_attack',
          description: `Multiple authentication failures for user ${userId}`,
          confidence: Math.min(failures.length / 10, 1),
          events: failures,
          riskScore: Math.min(failures.length * 0.2, 1)
        });
      }
    });
  }

  private createAnomaly(anomalyData: Omit<AnomalyPattern, 'id' | 'detectedAt' | 'status'>): void {
    const anomaly: AnomalyPattern = {
      id: this.generateAnomalyId(),
      detectedAt: Date.now(),
      status: 'active',
      ...anomalyData
    };

    this.anomalies.push(anomaly);

    const sevenDaysAgo = Date.now() - 7 * 24 * 3600000;
    this.anomalies = this.anomalies.filter(a => a.detectedAt > sevenDaysAgo);

    console.warn('Security Anomaly Detected:', anomaly);

    if (anomaly.riskScore > 0.8) {
      this.escalateAnomaly(anomaly);
    }
  }

  private checkImmediateAnomalies(event: SecurityEvent): void {
    if (event.severity === SecuritySeverity.CRITICAL) {
      this.createAnomaly({
        type: 'critical_security_event',
        description: `Critical security event: ${event.type}`,
        confidence: 1.0,
        events: [event],
        riskScore: 1.0
      });
    }
  }

  private escalateAnomaly(anomaly: AnomalyPattern): void {
    console.error('HIGH RISK SECURITY ANOMALY - IMMEDIATE ATTENTION REQUIRED:', anomaly);
    
    this.logEvent(
      SecurityEventType.SYSTEM_SECURITY,
      SecuritySeverity.CRITICAL,
      'anomaly_detector',
      { anomalyId: anomaly.id, escalated: true }
    );
  }

  private calculateComplianceScore(events: SecurityEvent[], anomalies: AnomalyPattern[]): number {
    let score = 100;

    const criticalEvents = events.filter(e => e.severity === SecuritySeverity.CRITICAL);
    const highEvents = events.filter(e => e.severity === SecuritySeverity.HIGH);
    const mediumEvents = events.filter(e => e.severity === SecuritySeverity.MEDIUM);

    score -= criticalEvents.length * 10;
    score -= highEvents.length * 5;
    score -= mediumEvents.length * 2;
    score -= anomalies.length * 5;
    score -= anomalies.filter(a => a.riskScore > 0.8).length * 10;

    return Math.max(score, 0);
  }

  private generateRecommendations(
    events: SecurityEvent[],
    anomalies: AnomalyPattern[],
    complianceScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (complianceScore < 70) {
      recommendations.push('Immediate security review required - compliance score below acceptable threshold');
    }

    const authFailures = events.filter(e => 
      e.type === SecurityEventType.AUTHENTICATION && 
      e.details.action === 'failed_login'
    );
    if (authFailures.length > 50) {
      recommendations.push('Consider implementing stronger authentication measures (MFA, CAPTCHA)');
    }

    const highRiskAnomalies = anomalies.filter(a => a.riskScore > 0.7);
    if (highRiskAnomalies.length > 0) {
      recommendations.push('Investigate and resolve high-risk security anomalies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture is good - continue monitoring');
    }

    return recommendations;
  }

  private notifyEventListeners(event: SecurityEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in security event listener:', error);
      }
    });
  }

  private persistEvent(event: SecurityEvent): void {
    try {
      const key = `security_event_${event.id}`;
      const eventData = JSON.stringify({
        ...event,
        userAgent: event.userAgent ? '[REDACTED]' : undefined,
        ipAddress: event.ipAddress ? '[REDACTED]' : undefined
      });
      
      localStorage.setItem(key, eventData);
      this.cleanupOldStoredEvents();
    } catch (error) {
      console.warn('Failed to persist security event:', error);
    }
  }

  private cleanupOldStoredEvents(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('security_event_')
      );
      
      if (keys.length > 1000) {
        const eventsToRemove = keys.slice(0, keys.length - 1000);
        eventsToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to cleanup old security events:', error);
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnomalyId(): string {
    return `anom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeviceFingerprint(): string {
    if (typeof window === 'undefined') return 'server';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).substr(0, 16);
  }

  private calculateRiskScore(type: SecurityEventType, severity: SecuritySeverity, details: any): number {
    let score = 0;

    switch (severity) {
      case SecuritySeverity.CRITICAL: score = 1.0; break;
      case SecuritySeverity.HIGH: score = 0.8; break;
      case SecuritySeverity.MEDIUM: score = 0.5; break;
      case SecuritySeverity.LOW: score = 0.2; break;
      case SecuritySeverity.INFO: score = 0.1; break;
    }

    switch (type) {
      case SecurityEventType.AUTHENTICATION:
        if (details.action === 'failed_login') score += 0.2;
        break;
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        score += 0.3;
        break;
    }

    return Math.min(score, 1.0);
  }

  public getEvents(criteria?: {
    type?: SecurityEventType;
    severity?: SecuritySeverity;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (criteria) {
      if (criteria.type) {
        filteredEvents = filteredEvents.filter(e => e.type === criteria.type);
      }
      if (criteria.severity) {
        filteredEvents = filteredEvents.filter(e => e.severity === criteria.severity);
      }
      if (criteria.startTime) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= criteria.startTime!);
      }
      if (criteria.endTime) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= criteria.endTime!);
      }
    }

    filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

    if (criteria?.limit) {
      filteredEvents = filteredEvents.slice(0, criteria.limit);
    }

    return filteredEvents;
  }

  public getAnomalies(): AnomalyPattern[] {
    return [...this.anomalies];
  }

  public getStatistics() {
    const eventsByType: Record<SecurityEventType, number> = {} as any;
    const eventsBySeverity: Record<SecuritySeverity, number> = {} as any;

    Object.values(SecurityEventType).forEach(type => {
      eventsByType[type] = 0;
    });
    Object.values(SecuritySeverity).forEach(severity => {
      eventsBySeverity[severity] = 0;
    });

    this.events.forEach(event => {
      eventsByType[event.type]++;
      eventsBySeverity[event.severity]++;
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      activeAnomalies: this.anomalies.filter(a => a.status === 'active').length
    };
  }

  public destroy(): void {
    if (this.anomalyDetectionInterval) {
      clearInterval(this.anomalyDetectionInterval);
    }
    this.events = [];
    this.anomalies = [];
    this.eventListeners.clear();
  }
}

export default SecurityAuditService;