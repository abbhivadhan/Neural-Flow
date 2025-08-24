/**
 * Main Privacy Service
 * Orchestrates all privacy-related functionality and provides a unified interface
 */

import { localModelInference } from './LocalModelInference';
import { encryptionService } from './EncryptionService';
import { privacyControlsService, DataType, ProcessingPurpose } from './PrivacyControlsService';
import { dataPortabilityService } from './DataPortabilityService';
import { 
  SecurityAuditLog, 
  SecurityEvent, 
  PrivacyCompliance,
  PrivacyDashboardMetrics,
  UserConsentPreferences 
} from '../../types/privacy';

export interface PrivacyServiceConfig {
  enableLocalInference: boolean;
  enableEncryption: boolean;
  auditLogging: boolean;
  complianceMode: 'strict' | 'balanced' | 'minimal';
  defaultRetentionPeriod: number;
}

export class PrivacyService {
  private auditLogs: SecurityAuditLog[] = [];
  private isInitialized = false;
  private config: PrivacyServiceConfig;

  constructor(config: Partial<PrivacyServiceConfig> = {}) {
    this.config = {
      enableLocalInference: true,
      enableEncryption: true,
      auditLogging: true,
      complianceMode: 'balanced',
      defaultRetentionPeriod: 365,
      ...config
    };
  }

  /**
   * Initialize the privacy service with user's master password
   */
  async initialize(masterPassword: string): Promise<void> {
    try {
      // Initialize encryption service
      if (this.config.enableEncryption) {
        await encryptionService.initialize(masterPassword);
        await encryptionService.loadStoredKeys();
        this.logSecurityEvent('encryption_key_generated', 'Encryption service initialized');
      }

      // Initialize local model inference
      if (this.config.enableLocalInference) {
        await localModelInference.initializeWasm();
        this.logSecurityEvent('model_inference_performed', 'Local inference initialized');
      }

      this.isInitialized = true;
      console.log('Privacy service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize privacy service:', error);
      throw error;
    }
  }

  /**
   * Check if data processing is allowed based on privacy preferences
   */
  async checkDataProcessingPermission(
    dataTypes: DataType[],
    purposes: ProcessingPurpose[],
    userId?: string
  ): Promise<boolean> {
    try {
      const consentStatus = privacyControlsService.getConsentStatus(dataTypes, purposes);
      
      if (this.config.auditLogging) {
        this.logSecurityEvent('consent_granted', 
          `Data processing check: ${consentStatus.allowed ? 'allowed' : 'denied'}`, 
          userId, 
          { dataTypes, purposes, consentStatus }
        );
      }

      return consentStatus.allowed;
    } catch (error) {
      console.error('Error checking data processing permission:', error);
      return false;
    }
  }

  /**
   * Perform AI inference with privacy controls
   */
  async performPrivateInference(
    modelName: string,
    inputData: Float32Array,
    userId?: string,
    options: { priority?: 'high' | 'normal' | 'low' } = {}
  ): Promise<any> {
    this.ensureInitialized();

    try {
      // Check if AI processing is allowed
      const allowed = await this.checkDataProcessingPermission(
        ['behavioral_patterns', 'task_data'],
        ['personalization', 'ai_improvement'],
        userId
      );

      if (!allowed) {
        throw new Error('AI inference not permitted based on privacy preferences');
      }

      // Perform local inference
      const result = await localModelInference.runInference(modelName, inputData, options);

      if (this.config.auditLogging) {
        this.logSecurityEvent('model_inference_performed', 
          `AI inference completed for model ${modelName}`, 
          userId,
          { modelName, processingTime: result.processingTime, confidence: result.confidence }
        );
      }

      return result;
    } catch (error) {
      console.error('Private inference failed:', error);
      throw error;
    }
  }

  /**
   * Store sensitive data with encryption
   */
  async storeSecureData(
    key: string,
    data: any,
    userId?: string,
    dataType?: DataType
  ): Promise<void> {
    this.ensureInitialized();

    try {
      // Check if data storage is allowed
      if (dataType) {
        const allowed = await this.checkDataProcessingPermission(
          [dataType],
          ['service_provision'],
          userId
        );

        if (!allowed) {
          throw new Error('Data storage not permitted based on privacy preferences');
        }
      }

      // Encrypt and store data
      await encryptionService.storeEncrypted(key, data);

      if (this.config.auditLogging) {
        this.logSecurityEvent('data_encrypted', 
          `Data stored securely with key ${key}`, 
          userId,
          { key, dataType }
        );
      }
    } catch (error) {
      console.error('Secure data storage failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt sensitive data
   */
  async retrieveSecureData(
    key: string,
    userId?: string,
    dataType?: DataType
  ): Promise<any> {
    this.ensureInitialized();

    try {
      // Check if data access is allowed
      if (dataType) {
        const allowed = await this.checkDataProcessingPermission(
          [dataType],
          ['service_provision'],
          userId
        );

        if (!allowed) {
          throw new Error('Data access not permitted based on privacy preferences');
        }
      }

      // Decrypt and retrieve data
      const data = await encryptionService.retrieveDecrypted(key);

      if (this.config.auditLogging) {
        this.logSecurityEvent('data_decrypted', 
          `Data retrieved securely with key ${key}`, 
          userId,
          { key, dataType }
        );
      }

      return data;
    } catch (error) {
      console.error('Secure data retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Update privacy preferences
   */
  async updatePrivacyPreferences(
    preferences: Partial<UserConsentPreferences>,
    userId: string
  ): Promise<void> {
    try {
      // Map preferences to privacy controls
      const preferenceMapping: { [key in keyof UserConsentPreferences]: string } = {
        essential: 'essential-functionality',
        analytics: 'usage-analytics',
        personalization: 'ai-personalization',
        marketing: 'marketing-communications',
        aiTraining: 'ai-training',
        thirdPartyIntegrations: 'third-party-integrations',
        biometricProcessing: 'biometric-data',
        locationTracking: 'location-tracking'
      };

      // Update each preference
      for (const [key, value] of Object.entries(preferences)) {
        const preferenceId = preferenceMapping[key as keyof UserConsentPreferences];
        if (preferenceId && typeof value === 'boolean') {
          await privacyControlsService.updatePrivacyPreference(preferenceId, value, userId);
        }
      }

      if (this.config.auditLogging) {
        this.logSecurityEvent('privacy_preference_changed', 
          'Privacy preferences updated', 
          userId,
          preferences
        );
      }
    } catch (error) {
      console.error('Failed to update privacy preferences:', error);
      throw error;
    }
  }

  /**
   * Export user data
   */
  async exportUserData(
    userId: string,
    dataTypes: DataType[],
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<any> {
    try {
      const exportResult = await dataPortabilityService.exportUserData(userId, dataTypes, {
        format,
        includeMetadata: true,
        anonymize: false,
        encrypt: this.config.enableEncryption
      });

      if (this.config.auditLogging) {
        this.logSecurityEvent('data_export_requested', 
          'User data export completed', 
          userId,
          { dataTypes, format, exportId: exportResult.metadata.exportId }
        );
      }

      return exportResult;
    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  }

  /**
   * Delete user data
   */
  async deleteUserData(
    userId: string,
    dataTypes: DataType[],
    reason: string
  ): Promise<any> {
    try {
      const deletionResult = await dataPortabilityService.deleteUserData(userId, dataTypes, reason);

      if (this.config.auditLogging) {
        this.logSecurityEvent('data_deletion_requested', 
          'User data deletion completed', 
          userId,
          { dataTypes, reason, deletionId: deletionResult.deletionId }
        );
      }

      return deletionResult;
    } catch (error) {
      console.error('Data deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get privacy dashboard metrics
   */
  async getPrivacyDashboard(userId: string): Promise<PrivacyDashboardMetrics> {
    try {
      const dashboardData = privacyControlsService.getPrivacyDashboard(userId);
      const dataInventory = await dataPortabilityService.getDataInventory(userId);
      
      const totalDataPoints = dataInventory.reduce((sum, item) => sum + item.recordCount, 0);
      const encryptedData = dataInventory.filter(item => item.encrypted);
      const encryptedDataPercentage = totalDataPoints > 0 
        ? (encryptedData.reduce((sum, item) => sum + item.recordCount, 0) / totalDataPoints) * 100 
        : 0;

      const metrics: PrivacyDashboardMetrics = {
        totalDataPoints,
        encryptedDataPercentage,
        localProcessingPercentage: this.config.enableLocalInference ? 100 : 0,
        dataRetentionCompliance: this.calculateRetentionCompliance(dataInventory),
        consentCoverage: this.calculateConsentCoverage(dashboardData.preferences),
        privacyScore: dashboardData.privacyScore,
        lastUpdated: new Date()
      };

      return metrics;
    } catch (error) {
      console.error('Failed to generate privacy dashboard:', error);
      throw error;
    }
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(): PrivacyCompliance {
    const preferences = privacyControlsService.getPrivacyPreferences();
    const enabledOptional = preferences.filter(p => !p.required && p.enabled).length;
    const totalOptional = preferences.filter(p => !p.required).length;
    
    const complianceScore = totalOptional > 0 
      ? Math.round(((totalOptional - enabledOptional) / totalOptional) * 100)
      : 100;

    return {
      gdprCompliant: complianceScore >= 80,
      ccpaCompliant: complianceScore >= 70,
      hipaaCompliant: this.config.enableEncryption && complianceScore >= 90,
      lastAuditDate: new Date(),
      complianceScore,
      issues: []
    };
  }

  /**
   * Get security audit logs
   */
  getAuditLogs(limit: number = 100): SecurityAuditLog[] {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all privacy data
   */
  async clearAllPrivacyData(): Promise<void> {
    try {
      await encryptionService.deleteAllKeys();
      await privacyControlsService.clearAllPrivacyData();
      this.auditLogs = [];
      
      // Clear local storage items related to privacy
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('privacy_') || key?.startsWith('audit_') || key?.startsWith('deletion_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      this.isInitialized = false;
      console.log('All privacy data cleared');
    } catch (error) {
      console.error('Failed to clear privacy data:', error);
      throw error;
    }
  }

  /**
   * Log security events for audit purposes
   */
  private logSecurityEvent(
    event: SecurityEvent,
    description: string,
    userId?: string,
    details?: any
  ): void {
    if (!this.config.auditLogging) return;

    const auditLog: SecurityAuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      event,
      userId: userId || 'unknown',
      details: {
        description,
        ...details
      },
      severity: this.getEventSeverity(event)
    };

    this.auditLogs.push(auditLog);

    // Keep only last 1000 logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    // Store audit logs persistently
    this.persistAuditLogs();
  }

  /**
   * Get event severity level
   */
  private getEventSeverity(event: SecurityEvent): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: { [key in SecurityEvent]: 'low' | 'medium' | 'high' | 'critical' } = {
      'encryption_key_generated': 'medium',
      'encryption_key_used': 'low',
      'data_encrypted': 'low',
      'data_decrypted': 'low',
      'privacy_preference_changed': 'medium',
      'data_export_requested': 'high',
      'data_deletion_requested': 'high',
      'unauthorized_access_attempt': 'critical',
      'model_inference_performed': 'low',
      'consent_granted': 'medium',
      'consent_revoked': 'medium'
    };

    return severityMap[event] || 'low';
  }

  /**
   * Calculate retention compliance score
   */
  private calculateRetentionCompliance(inventory: any[]): number {
    if (inventory.length === 0) return 100;
    
    const compliantItems = inventory.filter(item => {
      const daysSinceOldest = (Date.now() - item.oldestRecord.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceOldest <= item.retentionPeriod;
    });

    return Math.round((compliantItems.length / inventory.length) * 100);
  }

  /**
   * Calculate consent coverage score
   */
  private calculateConsentCoverage(preferences: any[]): number {
    if (preferences.length === 0) return 100;
    
    const requiredPreferences = preferences.filter(p => p.required);
    const enabledRequired = requiredPreferences.filter(p => p.enabled);
    
    return Math.round((enabledRequired.length / requiredPreferences.length) * 100);
  }

  /**
   * Persist audit logs to storage
   */
  private persistAuditLogs(): void {
    try {
      const recentLogs = this.auditLogs.slice(-100); // Keep last 100 logs in storage
      localStorage.setItem('audit_logs', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Failed to persist audit logs:', error);
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Privacy service not initialized. Call initialize() first.');
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    isInitialized: boolean;
    encryptionEnabled: boolean;
    localInferenceEnabled: boolean;
    auditLogCount: number;
    complianceMode: string;
  } {
    return {
      isInitialized: this.isInitialized,
      encryptionEnabled: this.config.enableEncryption,
      localInferenceEnabled: this.config.enableLocalInference,
      auditLogCount: this.auditLogs.length,
      complianceMode: this.config.complianceMode
    };
  }
}

// Singleton instance
export const privacyService = new PrivacyService();