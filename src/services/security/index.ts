/**
 * Security services index
 * Exports all security-related services and utilities
 */

import RequestThrottlingService from './RequestThrottling';

import RateLimitingService from './RateLimitingService';

import SecurityAuditService from './SecurityAuditService';

import ContentSecurityPolicyService from './ContentSecurityPolicy';

import SecureFileUploadService from './SecureFileUpload';

import InputValidationService from './InputValidationService';

export { InputValidationService } from './InputValidationService';
export type { ValidationRule, ValidationResult } from './InputValidationService';

export { ContentSecurityPolicyService } from './ContentSecurityPolicy';
export type { CSPDirective, CSPConfig } from './ContentSecurityPolicy';

export { SecureFileUploadService } from './SecureFileUpload';
export type { 
  FileValidationResult, 
  FileMetadata, 
  UploadConfig 
} from './SecureFileUpload';

export { RateLimitingService } from './RateLimitingService';
export type { 
  RateLimitConfig, 
  RateLimitResult, 
  RequestRecord, 
  AbusePattern 
} from './RateLimitingService';

export { RequestThrottlingService } from './RequestThrottling';
export type { 
  ThrottleConfig, 
  QueuedRequest, 
  ThrottleStats 
} from './RequestThrottling';

export { SecurityAuditService } from './SecurityAuditService';
export type { 
  SecurityEvent, 
  SecurityEventMetadata, 
  AnomalyPattern as SecurityAnomalyPattern, 
  ComplianceReport 
} from './SecurityAuditService';
export { SecurityEventType, SecuritySeverity } from './SecurityAuditService';

// Re-export commonly used validation functions
export const validateInput = (input: any, rules: any) => 
  InputValidationService.getInstance().validateInput(input, rules);

export const validateFile = (file: File, config?: any) => 
  SecureFileUploadService.getInstance().validateFile(file, config);

export const applyCSP = () => 
  ContentSecurityPolicyService.getInstance().applyPolicy();

export const logSecurityEvent = (type: any, severity: any, source: string, details: any) =>
  SecurityAuditService.getInstance().logEvent(type, severity, source, details);

export const checkRateLimit = (key: string, config: any) =>
  RateLimitingService.getInstance().checkRateLimit(key, config);

export const throttleRequest = <T>(requestFn: () => Promise<T>, config?: any) =>
  RequestThrottlingService.getInstance().throttle(requestFn, config);