/**
 * Privacy Controls and Consent Management Service
 * Provides granular privacy controls and consent management for user data
 */

export interface PrivacyPreference {
  id: string;
  category: PrivacyCategory;
  name: string;
  description: string;
  enabled: boolean;
  required: boolean;
  dataTypes: DataType[];
  processingPurposes: ProcessingPurpose[];
  retentionPeriod: number; // in days
  lastUpdated: Date;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  preferenceId: string;
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  method: 'explicit' | 'implicit' | 'legitimate_interest';
}

export interface DataProcessingActivity {
  id: string;
  name: string;
  description: string;
  dataTypes: DataType[];
  purposes: ProcessingPurpose[];
  legalBasis: LegalBasis;
  requiredConsent: boolean;
  retentionPeriod: number;
  thirdPartySharing: boolean;
  automatedDecisionMaking: boolean;
}

export type PrivacyCategory = 
  | 'essential'
  | 'analytics'
  | 'personalization'
  | 'ai_training'
  | 'collaboration'
  | 'marketing'
  | 'third_party';

export type DataType = 
  | 'behavioral_patterns'
  | 'task_data'
  | 'productivity_metrics'
  | 'collaboration_data'
  | 'content_data'
  | 'usage_analytics'
  | 'device_information'
  | 'location_data'
  | 'biometric_data';

export type ProcessingPurpose = 
  | 'service_provision'
  | 'personalization'
  | 'analytics'
  | 'ai_improvement'
  | 'security'
  | 'legal_compliance'
  | 'marketing'
  | 'research';

export type LegalBasis = 
  | 'consent'
  | 'contract'
  | 'legal_obligation'
  | 'vital_interests'
  | 'public_task'
  | 'legitimate_interests';

export interface PrivacyDashboardData {
  preferences: PrivacyPreference[];
  consentHistory: ConsentRecord[];
  dataProcessingActivities: DataProcessingActivity[];
  dataExportRequests: DataExportRequest[];
  dataDeletionRequests: DataDeletionRequest[];
  privacyScore: number;
}

export interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dataTypes: DataType[];
  format: 'json' | 'csv' | 'xml';
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface DataDeletionRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  dataTypes: DataType[];
  reason: string;
  completedAt?: Date;
}

export class PrivacyControlsService {
  private preferences: Map<string, PrivacyPreference> = new Map();
  private consentRecords: ConsentRecord[] = [];
  private processingActivities: Map<string, DataProcessingActivity> = new Map();
  private exportRequests: Map<string, DataExportRequest> = new Map();
  private deletionRequests: Map<string, DataDeletionRequest> = new Map();

  constructor() {
    this.initializeDefaultPreferences();
    this.loadStoredPreferences();
  }

  /**
   * Initialize default privacy preferences
   */
  private initializeDefaultPreferences(): void {
    const defaultPreferences: PrivacyPreference[] = [
      {
        id: 'essential-functionality',
        category: 'essential',
        name: 'Essential Functionality',
        description: 'Core application features and user authentication',
        enabled: true,
        required: true,
        dataTypes: ['task_data', 'device_information'],
        processingPurposes: ['service_provision', 'security'],
        retentionPeriod: 365,
        lastUpdated: new Date()
      },
      {
        id: 'ai-personalization',
        category: 'personalization',
        name: 'AI Personalization',
        description: 'Use AI to personalize your workspace and predict your needs',
        enabled: true,
        required: false,
        dataTypes: ['behavioral_patterns', 'task_data', 'productivity_metrics'],
        processingPurposes: ['personalization', 'ai_improvement'],
        retentionPeriod: 180,
        lastUpdated: new Date()
      },
      {
        id: 'usage-analytics',
        category: 'analytics',
        name: 'Usage Analytics',
        description: 'Collect anonymous usage data to improve the application',
        enabled: false,
        required: false,
        dataTypes: ['usage_analytics', 'device_information'],
        processingPurposes: ['analytics', 'ai_improvement'],
        retentionPeriod: 90,
        lastUpdated: new Date()
      },
      {
        id: 'collaboration-features',
        category: 'collaboration',
        name: 'Collaboration Features',
        description: 'Enable real-time collaboration and team features',
        enabled: false,
        required: false,
        dataTypes: ['collaboration_data', 'content_data'],
        processingPurposes: ['service_provision', 'personalization'],
        retentionPeriod: 365,
        lastUpdated: new Date()
      },
      {
        id: 'ai-training',
        category: 'ai_training',
        name: 'AI Model Training',
        description: 'Use your data to improve AI models (anonymized)',
        enabled: false,
        required: false,
        dataTypes: ['behavioral_patterns', 'content_data', 'productivity_metrics'],
        processingPurposes: ['ai_improvement', 'research'],
        retentionPeriod: 730,
        lastUpdated: new Date()
      },
      {
        id: 'biometric-data',
        category: 'personalization',
        name: 'Biometric Data Processing',
        description: 'Process gesture and voice data for multi-modal interaction',
        enabled: false,
        required: false,
        dataTypes: ['biometric_data'],
        processingPurposes: ['service_provision', 'personalization'],
        retentionPeriod: 30,
        lastUpdated: new Date()
      }
    ];

    defaultPreferences.forEach(pref => {
      this.preferences.set(pref.id, pref);
    });
  }

  /**
   * Get all privacy preferences
   */
  getPrivacyPreferences(): PrivacyPreference[] {
    return Array.from(this.preferences.values());
  }

  /**
   * Update privacy preference
   */
  async updatePrivacyPreference(
    preferenceId: string,
    enabled: boolean,
    userId: string
  ): Promise<void> {
    const preference = this.preferences.get(preferenceId);
    if (!preference) {
      throw new Error(`Privacy preference ${preferenceId} not found`);
    }

    if (preference.required && !enabled) {
      throw new Error('Cannot disable required privacy preference');
    }

    // Update preference
    preference.enabled = enabled;
    preference.lastUpdated = new Date();

    // Record consent
    const consentRecord: ConsentRecord = {
      id: crypto.randomUUID(),
      userId,
      preferenceId,
      granted: enabled,
      timestamp: new Date(),
      version: '1.0',
      method: 'explicit'
    };

    this.consentRecords.push(consentRecord);

    // Save to storage
    await this.savePreferences();
    await this.saveConsentRecords();

    console.log(`Privacy preference ${preferenceId} updated: ${enabled}`);
  }

  /**
   * Check if data processing is allowed
   */
  isDataProcessingAllowed(
    dataType: DataType,
    purpose: ProcessingPurpose
  ): boolean {
    for (const preference of this.preferences.values()) {
      if (preference.enabled && 
          preference.dataTypes.includes(dataType) &&
          preference.processingPurposes.includes(purpose)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get consent status for specific data processing
   */
  getConsentStatus(dataTypes: DataType[], purposes: ProcessingPurpose[]): {
    allowed: boolean;
    requiredConsents: string[];
    missingConsents: string[];
  } {
    const requiredConsents: string[] = [];
    const missingConsents: string[] = [];

    for (const preference of this.preferences.values()) {
      const hasMatchingDataType = dataTypes.some(dt => preference.dataTypes.includes(dt));
      const hasMatchingPurpose = purposes.some(p => preference.processingPurposes.includes(p));

      if (hasMatchingDataType && hasMatchingPurpose) {
        requiredConsents.push(preference.id);
        if (!preference.enabled) {
          missingConsents.push(preference.id);
        }
      }
    }

    return {
      allowed: missingConsents.length === 0,
      requiredConsents,
      missingConsents
    };
  }

  /**
   * Request data export
   */
  async requestDataExport(
    userId: string,
    dataTypes: DataType[],
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    const exportRequest: DataExportRequest = {
      id: crypto.randomUUID(),
      userId,
      requestedAt: new Date(),
      status: 'pending',
      dataTypes,
      format
    };

    this.exportRequests.set(exportRequest.id, exportRequest);
    
    // Start export process (would be handled by background service)
    this.processDataExport(exportRequest.id);

    await this.saveExportRequests();
    return exportRequest.id;
  }

  /**
   * Request data deletion
   */
  async requestDataDeletion(
    userId: string,
    dataTypes: DataType[],
    reason: string
  ): Promise<string> {
    const deletionRequest: DataDeletionRequest = {
      id: crypto.randomUUID(),
      userId,
      requestedAt: new Date(),
      status: 'pending',
      dataTypes,
      reason
    };

    this.deletionRequests.set(deletionRequest.id, deletionRequest);
    
    // Start deletion process (would be handled by background service)
    this.processDataDeletion(deletionRequest.id);

    await this.saveDeletionRequests();
    return deletionRequest.id;
  }

  /**
   * Get privacy dashboard data
   */
  getPrivacyDashboard(userId: string): PrivacyDashboardData {
    const userConsentHistory = this.consentRecords.filter(
      record => record.userId === userId
    );

    const userExportRequests = Array.from(this.exportRequests.values())
      .filter(request => request.userId === userId);

    const userDeletionRequests = Array.from(this.deletionRequests.values())
      .filter(request => request.userId === userId);

    return {
      preferences: this.getPrivacyPreferences(),
      consentHistory: userConsentHistory,
      dataProcessingActivities: Array.from(this.processingActivities.values()),
      dataExportRequests: userExportRequests,
      dataDeletionRequests: userDeletionRequests,
      privacyScore: this.calculatePrivacyScore()
    };
  }

  /**
   * Calculate privacy score based on user's privacy settings
   */
  private calculatePrivacyScore(): number {
    // const totalPreferences = this.preferences.size;
    const enabledOptionalPreferences = Array.from(this.preferences.values())
      .filter(pref => !pref.required && pref.enabled).length;
    
    const optionalPreferences = Array.from(this.preferences.values())
      .filter(pref => !pref.required).length;

    if (optionalPreferences === 0) return 100;

    // Higher score means more privacy (fewer optional features enabled)
    const privacyRatio = 1 - (enabledOptionalPreferences / optionalPreferences);
    return Math.round(privacyRatio * 100);
  }

  /**
   * Process data export request
   */
  private async processDataExport(requestId: string): Promise<void> {
    const request = this.exportRequests.get(requestId);
    if (!request) return;

    try {
      request.status = 'processing';
      
      // Simulate export processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate download URL (would be actual file in real implementation)
      request.downloadUrl = `data:application/json;base64,${btoa(JSON.stringify({
        exportId: requestId,
        userId: request.userId,
        dataTypes: request.dataTypes,
        exportedAt: new Date().toISOString(),
        data: 'Exported user data would be here'
      }))}`;
      
      request.status = 'completed';
      request.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      await this.saveExportRequests();
      console.log(`Data export completed for request ${requestId}`);
    } catch (error) {
      request.status = 'failed';
      console.error(`Data export failed for request ${requestId}:`, error);
    }
  }

  /**
   * Process data deletion request
   */
  private async processDataDeletion(requestId: string): Promise<void> {
    const request = this.deletionRequests.get(requestId);
    if (!request) return;

    try {
      request.status = 'processing';
      
      // Simulate deletion processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real implementation, would delete actual data
      console.log(`Deleting data types: ${request.dataTypes.join(', ')}`);
      
      request.status = 'completed';
      request.completedAt = new Date();
      
      await this.saveDeletionRequests();
      console.log(`Data deletion completed for request ${requestId}`);
    } catch (error) {
      request.status = 'failed';
      console.error(`Data deletion failed for request ${requestId}:`, error);
    }
  }

  /**
   * Load stored preferences
   */
  private async loadStoredPreferences(): Promise<void> {
    try {
      const stored = localStorage.getItem('privacy_preferences');
      if (stored) {
        const preferences: PrivacyPreference[] = JSON.parse(stored);
        preferences.forEach(pref => {
          pref.lastUpdated = new Date(pref.lastUpdated);
          this.preferences.set(pref.id, pref);
        });
      }

      const storedConsent = localStorage.getItem('consent_records');
      if (storedConsent) {
        this.consentRecords = JSON.parse(storedConsent).map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load stored privacy preferences:', error);
    }
  }

  /**
   * Save preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      const preferences = Array.from(this.preferences.values());
      localStorage.setItem('privacy_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save privacy preferences:', error);
    }
  }

  /**
   * Save consent records to storage
   */
  private async saveConsentRecords(): Promise<void> {
    try {
      localStorage.setItem('consent_records', JSON.stringify(this.consentRecords));
    } catch (error) {
      console.error('Failed to save consent records:', error);
    }
  }

  /**
   * Save export requests to storage
   */
  private async saveExportRequests(): Promise<void> {
    try {
      const requests = Array.from(this.exportRequests.values());
      localStorage.setItem('export_requests', JSON.stringify(requests));
    } catch (error) {
      console.error('Failed to save export requests:', error);
    }
  }

  /**
   * Save deletion requests to storage
   */
  private async saveDeletionRequests(): Promise<void> {
    try {
      const requests = Array.from(this.deletionRequests.values());
      localStorage.setItem('deletion_requests', JSON.stringify(requests));
    } catch (error) {
      console.error('Failed to save deletion requests:', error);
    }
  }

  /**
   * Clear all privacy data
   */
  async clearAllPrivacyData(): Promise<void> {
    this.preferences.clear();
    this.consentRecords = [];
    this.exportRequests.clear();
    this.deletionRequests.clear();

    localStorage.removeItem('privacy_preferences');
    localStorage.removeItem('consent_records');
    localStorage.removeItem('export_requests');
    localStorage.removeItem('deletion_requests');

    this.initializeDefaultPreferences();
    console.log('All privacy data cleared');
  }
}

// Singleton instance
export const privacyControlsService = new PrivacyControlsService();