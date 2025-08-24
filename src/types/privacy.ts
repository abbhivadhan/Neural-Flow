/**
 * Privacy-related type definitions for Neural Flow
 */

export interface PrivacySettings {
  localInferenceEnabled: boolean;
  encryptionEnabled: boolean;
  dataRetentionPeriod: number;
  anonymousAnalytics: boolean;
  biometricDataProcessing: boolean;
  thirdPartySharing: boolean;
  aiModelTraining: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  event: SecurityEvent;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type SecurityEvent = 
  | 'encryption_key_generated'
  | 'encryption_key_used'
  | 'data_encrypted'
  | 'data_decrypted'
  | 'privacy_preference_changed'
  | 'data_export_requested'
  | 'data_deletion_requested'
  | 'unauthorized_access_attempt'
  | 'model_inference_performed'
  | 'consent_granted'
  | 'consent_revoked';

export interface PrivacyCompliance {
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  hipaaCompliant: boolean;
  lastAuditDate: Date;
  complianceScore: number;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  id: string;
  type: 'data_retention' | 'consent_missing' | 'encryption_required' | 'audit_trail';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  deadline?: Date;
}

export interface DataProcessingRecord {
  id: string;
  dataType: string;
  purpose: string;
  legalBasis: string;
  processingDate: Date;
  retentionPeriod: number;
  encrypted: boolean;
  anonymized: boolean;
  thirdPartyShared: boolean;
}

export interface PrivacyImpactAssessment {
  id: string;
  feature: string;
  riskLevel: 'low' | 'medium' | 'high';
  dataTypes: string[];
  mitigationMeasures: string[];
  approvalRequired: boolean;
  approvedBy?: string;
  approvalDate?: Date;
}

export interface UserConsentPreferences {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
  aiTraining: boolean;
  thirdPartyIntegrations: boolean;
  biometricProcessing: boolean;
  locationTracking: boolean;
}

export interface PrivacyDashboardMetrics {
  totalDataPoints: number;
  encryptedDataPercentage: number;
  localProcessingPercentage: number;
  dataRetentionCompliance: number;
  consentCoverage: number;
  privacyScore: number;
  lastUpdated: Date;
}