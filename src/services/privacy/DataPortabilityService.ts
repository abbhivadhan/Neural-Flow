/**
 * Data Portability Service
 * Handles secure data export and deletion functionality with comprehensive data mapping
 */

import { encryptionService } from './EncryptionService';
import { privacyControlsService, DataType } from './PrivacyControlsService';

export interface DataExportOptions {
  format: 'json' | 'csv' | 'xml';
  includeMetadata: boolean;
  anonymize: boolean;
  compress: boolean;
  encrypt: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface ExportedDataPackage {
  metadata: {
    exportId: string;
    userId: string;
    exportedAt: Date;
    version: string;
    format: string;
    totalRecords: number;
    dataTypes: DataType[];
    anonymized: boolean;
    encrypted: boolean;
  };
  data: {
    [key: string]: any;
  };
  integrity: {
    checksum: string;
    algorithm: string;
  };
}

export interface DataDeletionReport {
  deletionId: string;
  userId: string;
  requestedAt: Date;
  completedAt: Date;
  dataTypesDeleted: DataType[];
  recordsDeleted: {
    [dataType: string]: number;
  };
  retainedData: {
    dataType: DataType;
    reason: string;
    legalBasis: string;
    retentionPeriod: number;
  }[];
  verificationHash: string;
}

export interface DataInventory {
  dataType: DataType;
  storageLocation: string;
  recordCount: number;
  oldestRecord: Date;
  newestRecord: Date;
  sizeBytes: number;
  encrypted: boolean;
  retentionPeriod: number;
  legalBasis: string;
}

export class DataPortabilityService {
  // private readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks for large exports
  // private readonly MAX_EXPORT_SIZE = 100 * 1024 * 1024; // 100MB max export

  /**
   * Export user data with comprehensive options
   */
  async exportUserData(
    userId: string,
    dataTypes: DataType[],
    options: Partial<DataExportOptions> = {}
  ): Promise<ExportedDataPackage> {
    const exportOptions: DataExportOptions = {
      format: 'json',
      includeMetadata: true,
      anonymize: false,
      compress: false,
      encrypt: false,
      ...options
    };

    try {
      // Verify user has consent for data export
      await this.verifyExportPermissions(userId, dataTypes);

      // Collect data from all sources
      const collectedData = await this.collectUserData(userId, dataTypes, exportOptions);

      // Process data according to options
      let processedData = collectedData;
      if (exportOptions.anonymize) {
        processedData = await this.anonymizeData(processedData);
      }

      // Generate export package
      const exportPackage: ExportedDataPackage = {
        metadata: {
          exportId: crypto.randomUUID(),
          userId: exportOptions.anonymize ? 'anonymized' : userId,
          exportedAt: new Date(),
          version: '1.0',
          format: exportOptions.format,
          totalRecords: this.countRecords(processedData),
          dataTypes,
          anonymized: exportOptions.anonymize,
          encrypted: exportOptions.encrypt
        },
        data: processedData,
        integrity: {
          checksum: '',
          algorithm: 'SHA-256'
        }
      };

      // Generate integrity checksum
      exportPackage.integrity.checksum = await this.generateChecksum(exportPackage.data);

      // Encrypt if requested
      if (exportOptions.encrypt) {
        exportPackage.data = await this.encryptExportData(exportPackage.data);
      }

      // Convert to requested format
      if (exportOptions.format !== 'json') {
        exportPackage.data = await this.convertFormat(exportPackage.data, exportOptions.format);
      }

      console.log(`Data export completed for user ${userId}`);
      return exportPackage;
    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  }

  /**
   * Delete user data with comprehensive tracking
   */
  async deleteUserData(
    userId: string,
    dataTypes: DataType[],
    _reason: string
  ): Promise<DataDeletionReport> {
    try {
      // Verify deletion permissions
      await this.verifyDeletionPermissions(userId, dataTypes);

      const deletionId = crypto.randomUUID();
      const startTime = new Date();
      const recordsDeleted: { [dataType: string]: number } = {};
      const retainedData: DataDeletionReport['retainedData'] = [];

      // Process each data type
      for (const dataType of dataTypes) {
        const deletionResult = await this.deleteDataByType(userId, dataType);
        recordsDeleted[dataType] = deletionResult.deletedCount;
        
        if (deletionResult.retainedRecords > 0) {
          retainedData.push({
            dataType,
            reason: deletionResult.retentionReason,
            legalBasis: deletionResult.legalBasis,
            retentionPeriod: deletionResult.retentionPeriod
          });
        }
      }

      // Generate deletion report
      const deletionReport: DataDeletionReport = {
        deletionId,
        userId,
        requestedAt: startTime,
        completedAt: new Date(),
        dataTypesDeleted: dataTypes,
        recordsDeleted,
        retainedData,
        verificationHash: await this.generateDeletionHash(deletionId, recordsDeleted)
      };

      // Store deletion record for audit purposes
      await this.storeDeletionRecord(deletionReport);

      console.log(`Data deletion completed for user ${userId}`);
      return deletionReport;
    } catch (error) {
      console.error('Data deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive data inventory for user
   */
  async getDataInventory(userId: string): Promise<DataInventory[]> {
    const inventory: DataInventory[] = [];

    try {
      // Behavioral patterns data
      const behavioralData = await this.getBehavioralDataInventory(userId);
      if (behavioralData) inventory.push(behavioralData);

      // Task data
      const taskData = await this.getTaskDataInventory(userId);
      if (taskData) inventory.push(taskData);

      // Productivity metrics
      const metricsData = await this.getMetricsDataInventory(userId);
      if (metricsData) inventory.push(metricsData);

      // Collaboration data
      const collaborationData = await this.getCollaborationDataInventory(userId);
      if (collaborationData) inventory.push(collaborationData);

      // Content data
      const contentData = await this.getContentDataInventory(userId);
      if (contentData) inventory.push(contentData);

      // Usage analytics
      const analyticsData = await this.getAnalyticsDataInventory(userId);
      if (analyticsData) inventory.push(analyticsData);

      // Device information
      const deviceData = await this.getDeviceDataInventory(userId);
      if (deviceData) inventory.push(deviceData);

      return inventory;
    } catch (error) {
      console.error('Failed to generate data inventory:', error);
      throw error;
    }
  }

  /**
   * Verify export permissions
   */
  private async verifyExportPermissions(_userId: string, dataTypes: DataType[]): Promise<void> {
    // Check if user has necessary consents
    const consentStatus = privacyControlsService.getConsentStatus(
      dataTypes,
      ['service_provision']
    );

    if (!consentStatus.allowed) {
      throw new Error(`Missing consent for data types: ${consentStatus.missingConsents.join(', ')}`);
    }
  }

  /**
   * Verify deletion permissions
   */
  private async verifyDeletionPermissions(userId: string, dataTypes: DataType[]): Promise<void> {
    // Check for legal obligations that prevent deletion
    const protectedData = dataTypes.filter(dataType => {
      // Example: Some data might need to be retained for legal compliance
      return dataType === 'usage_analytics' && this.hasLegalRetentionRequirement(userId);
    });

    if (protectedData.length > 0) {
      console.warn(`Some data cannot be deleted due to legal requirements: ${protectedData.join(', ')}`);
    }
  }

  /**
   * Collect user data from all sources
   */
  private async collectUserData(
    userId: string,
    dataTypes: DataType[],
    options: DataExportOptions
  ): Promise<any> {
    const collectedData: any = {};

    for (const dataType of dataTypes) {
      switch (dataType) {
        case 'behavioral_patterns':
          collectedData.behavioralPatterns = await this.collectBehavioralData(userId, options);
          break;
        case 'task_data':
          collectedData.tasks = await this.collectTaskData(userId, options);
          break;
        case 'productivity_metrics':
          collectedData.productivityMetrics = await this.collectMetricsData(userId, options);
          break;
        case 'collaboration_data':
          collectedData.collaboration = await this.collectCollaborationData(userId, options);
          break;
        case 'content_data':
          collectedData.content = await this.collectContentData(userId, options);
          break;
        case 'usage_analytics':
          collectedData.analytics = await this.collectAnalyticsData(userId, options);
          break;
        case 'device_information':
          collectedData.deviceInfo = await this.collectDeviceData(userId, options);
          break;
        case 'location_data':
          collectedData.location = await this.collectLocationData(userId, options);
          break;
        case 'biometric_data':
          collectedData.biometric = await this.collectBiometricData(userId, options);
          break;
      }
    }

    return collectedData;
  }

  /**
   * Collect behavioral data
   */
  private async collectBehavioralData(userId: string, options: DataExportOptions): Promise<any> {
    // Simulate collecting behavioral patterns from storage
    const behavioralData = {
      userId,
      patterns: [
        {
          type: 'work_schedule',
          data: { preferredHours: '9-17', timezone: 'UTC' },
          confidence: 0.85,
          lastUpdated: new Date()
        },
        {
          type: 'task_preferences',
          data: { preferredTaskTypes: ['coding', 'writing'], focusTime: 120 },
          confidence: 0.92,
          lastUpdated: new Date()
        }
      ],
      collectedAt: new Date()
    };

    return this.filterByDateRange(behavioralData, options.dateRange);
  }

  /**
   * Collect task data
   */
  private async collectTaskData(userId: string, options: DataExportOptions): Promise<any> {
    // Simulate collecting task data from storage
    const taskData = {
      userId,
      tasks: [
        {
          id: 'task-1',
          title: 'Sample Task',
          description: 'This is a sample task',
          status: 'completed',
          createdAt: new Date(),
          completedAt: new Date()
        }
      ],
      projects: [
        {
          id: 'project-1',
          name: 'Sample Project',
          description: 'This is a sample project',
          createdAt: new Date()
        }
      ],
      collectedAt: new Date()
    };

    return this.filterByDateRange(taskData, options.dateRange);
  }

  /**
   * Collect other data types (simplified implementations)
   */
  private async collectMetricsData(_userId: string, _options: DataExportOptions): Promise<any> {
    return { userId: _userId, metrics: [], collectedAt: new Date() };
  }

  private async collectCollaborationData(_userId: string, _options: DataExportOptions): Promise<any> {
    return { userId: _userId, collaborations: [], collectedAt: new Date() };
  }

  private async collectContentData(_userId: string, _options: DataExportOptions): Promise<any> {
    return { userId: _userId, content: [], collectedAt: new Date() };
  }

  private async collectAnalyticsData(_userId: string, _options: DataExportOptions): Promise<any> {
    return { userId: _userId, analytics: [], collectedAt: new Date() };
  }

  private async collectDeviceData(_userId: string, _options: DataExportOptions): Promise<any> {
    return { userId: _userId, devices: [], collectedAt: new Date() };
  }

  private async collectLocationData(_userId: string, _options: DataExportOptions): Promise<any> {
    return { userId: _userId, locations: [], collectedAt: new Date() };
  }

  private async collectBiometricData(_userId: string, _options: DataExportOptions): Promise<any> {
    return { userId: _userId, biometric: [], collectedAt: new Date() };
  }

  /**
   * Anonymize data by removing or hashing identifiers
   */
  private async anonymizeData(data: any): Promise<any> {
    const anonymized = JSON.parse(JSON.stringify(data));
    
    // Replace user IDs with hashed versions
    const userIdHash = await this.hashValue(data.userId || 'unknown');
    
    function anonymizeRecursive(obj: any): any {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      for (const key in obj) {
        if (key === 'userId' || key === 'user_id') {
          obj[key] = userIdHash;
        } else if (key === 'email' || key === 'name' || key === 'username') {
          obj[key] = '[ANONYMIZED]';
        } else if (typeof obj[key] === 'object') {
          anonymizeRecursive(obj[key]);
        }
      }
      return obj;
    }

    return anonymizeRecursive(anonymized);
  }

  /**
   * Delete data by type
   */
  private async deleteDataByType(userId: string, dataType: DataType): Promise<{
    deletedCount: number;
    retainedRecords: number;
    retentionReason: string;
    legalBasis: string;
    retentionPeriod: number;
  }> {
    // Simulate data deletion
    const mockDeletionResult = {
      deletedCount: Math.floor(Math.random() * 100) + 1,
      retainedRecords: 0,
      retentionReason: '',
      legalBasis: '',
      retentionPeriod: 0
    };

    // Check if data needs to be retained for legal reasons
    if (this.hasLegalRetentionRequirement(userId) && dataType === 'usage_analytics') {
      mockDeletionResult.retainedRecords = 5;
      mockDeletionResult.retentionReason = 'Legal compliance requirement';
      mockDeletionResult.legalBasis = 'legal_obligation';
      mockDeletionResult.retentionPeriod = 2555; // 7 years
    }

    console.log(`Deleted ${mockDeletionResult.deletedCount} records of type ${dataType} for user ${userId}`);
    return mockDeletionResult;
  }

  /**
   * Generate data inventory for different data types
   */
  private async getBehavioralDataInventory(_userId: string): Promise<DataInventory | null> {
    return {
      dataType: 'behavioral_patterns',
      storageLocation: 'localStorage',
      recordCount: 25,
      oldestRecord: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      newestRecord: new Date(),
      sizeBytes: 1024 * 50, // 50KB
      encrypted: true,
      retentionPeriod: 180,
      legalBasis: 'consent'
    };
  }

  private async getTaskDataInventory(_userId: string): Promise<DataInventory | null> {
    return {
      dataType: 'task_data',
      storageLocation: 'localStorage',
      recordCount: 150,
      oldestRecord: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      newestRecord: new Date(),
      sizeBytes: 1024 * 200, // 200KB
      encrypted: true,
      retentionPeriod: 365,
      legalBasis: 'contract'
    };
  }

  private async getMetricsDataInventory(_userId: string): Promise<DataInventory | null> {
    return {
      dataType: 'productivity_metrics',
      storageLocation: 'localStorage',
      recordCount: 500,
      oldestRecord: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      newestRecord: new Date(),
      sizeBytes: 1024 * 100, // 100KB
      encrypted: true,
      retentionPeriod: 180,
      legalBasis: 'consent'
    };
  }

  private async getCollaborationDataInventory(_userId: string): Promise<DataInventory | null> {
    return null; // No collaboration data for this user
  }

  private async getContentDataInventory(_userId: string): Promise<DataInventory | null> {
    return null; // No content data for this user
  }

  private async getAnalyticsDataInventory(_userId: string): Promise<DataInventory | null> {
    return {
      dataType: 'usage_analytics',
      storageLocation: 'localStorage',
      recordCount: 1000,
      oldestRecord: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      newestRecord: new Date(),
      sizeBytes: 1024 * 300, // 300KB
      encrypted: false,
      retentionPeriod: 2555, // 7 years for legal compliance
      legalBasis: 'legal_obligation'
    };
  }

  private async getDeviceDataInventory(_userId: string): Promise<DataInventory | null> {
    return {
      dataType: 'device_information',
      storageLocation: 'localStorage',
      recordCount: 5,
      oldestRecord: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      newestRecord: new Date(),
      sizeBytes: 1024 * 5, // 5KB
      encrypted: false,
      retentionPeriod: 90,
      legalBasis: 'legitimate_interests'
    };
  }

  /**
   * Utility functions
   */
  private filterByDateRange(data: any, dateRange?: { start: Date; end: Date }): any {
    if (!dateRange) return data;
    // Simplified date filtering - would be more sophisticated in real implementation
    return data;
  }

  private countRecords(data: any): number {
    let count = 0;
    function countRecursive(obj: any): void {
      if (Array.isArray(obj)) {
        count += obj.length;
        obj.forEach(countRecursive);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.values(obj).forEach(countRecursive);
      }
    }
    countRecursive(data);
    return count;
  }

  private async generateChecksum(data: any): Promise<string> {
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async encryptExportData(data: any): Promise<any> {
    const dataString = JSON.stringify(data);
    const encryptedData = await encryptionService.encryptData(dataString);
    return {
      encrypted: true,
      data: Array.from(new Uint8Array(encryptedData.data)),
      iv: Array.from(new Uint8Array(encryptedData.iv)),
      keyId: encryptedData.keyId
    };
  }

  private async convertFormat(data: any, format: string): Promise<any> {
    // Simplified format conversion - would be more comprehensive in real implementation
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'xml':
        return this.convertToXML(data);
      default:
        return data;
    }
  }

  private convertToCSV(_data: any): string {
    // Simplified CSV conversion
    return 'CSV format not fully implemented in this demo';
  }

  private convertToXML(_data: any): string {
    // Simplified XML conversion
    return '<xml>XML format not fully implemented in this demo</xml>';
  }

  private async hashValue(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async generateDeletionHash(deletionId: string, recordsDeleted: any): Promise<string> {
    const combinedData = deletionId + JSON.stringify(recordsDeleted);
    return await this.hashValue(combinedData);
  }

  private async storeDeletionRecord(report: DataDeletionReport): Promise<void> {
    // Store deletion record for audit purposes
    const existingRecords = JSON.parse(localStorage.getItem('deletion_records') || '[]');
    existingRecords.push(report);
    localStorage.setItem('deletion_records', JSON.stringify(existingRecords));
  }

  private hasLegalRetentionRequirement(_userId: string): boolean {
    // Simplified check - in real implementation would check actual legal requirements
    return Math.random() > 0.7; // 30% chance of having legal retention requirement
  }
}

// Singleton instance
export const dataPortabilityService = new DataPortabilityService();