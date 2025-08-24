/**
 * Privacy Service Tests
 * Comprehensive tests for privacy-first AI architecture
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrivacyService } from '../PrivacyService';
// import { encryptionService } from '../EncryptionService';
// import { privacyControlsService } from '../PrivacyControlsService';

// Mock the crypto API for testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      generateKey: vi.fn().mockResolvedValue({}),
      importKey: vi.fn().mockResolvedValue({}),
      exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(64)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      deriveKey: vi.fn().mockResolvedValue({}),
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('PrivacyService', () => {
  let privacyService: PrivacyService;

  beforeEach(() => {
    privacyService = new PrivacyService({
      enableLocalInference: true,
      enableEncryption: true,
      auditLogging: true,
      complianceMode: 'balanced'
    });
    
    // Clear mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize privacy service with master password', async () => {
      const masterPassword = 'test-master-password-123';
      
      await expect(privacyService.initialize(masterPassword)).resolves.not.toThrow();
      
      const stats = privacyService.getStats();
      expect(stats.isInitialized).toBe(true);
      expect(stats.encryptionEnabled).toBe(true);
      expect(stats.localInferenceEnabled).toBe(true);
    });

    it('should handle initialization failure gracefully', async () => {
      // Mock crypto.subtle.deriveKey to throw an error
      vi.mocked(crypto.subtle.deriveKey).mockRejectedValueOnce(new Error('Crypto error'));
      
      await expect(privacyService.initialize('password')).rejects.toThrow();
      
      const stats = privacyService.getStats();
      expect(stats.isInitialized).toBe(false);
    });
  });

  describe('Data Processing Permissions', () => {
    beforeEach(async () => {
      await privacyService.initialize('test-password');
    });

    it('should check data processing permissions correctly', async () => {
      const allowed = await privacyService.checkDataProcessingPermission(
        ['task_data'],
        ['service_provision'],
        'test-user'
      );
      
      // Should be allowed for essential functionality
      expect(allowed).toBe(true);
    });

    it('should deny processing for non-consented data types', async () => {
      const allowed = await privacyService.checkDataProcessingPermission(
        ['biometric_data'],
        ['ai_improvement'],
        'test-user'
      );
      
      // Should be denied for non-essential, non-consented data
      expect(allowed).toBe(false);
    });

    it('should log security events when checking permissions', async () => {
      await privacyService.checkDataProcessingPermission(
        ['task_data'],
        ['service_provision'],
        'test-user'
      );
      
      const auditLogs = privacyService.getAuditLogs(10);
      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0]?.event).toBe('consent_granted');
    });
  });

  describe('Secure Data Storage', () => {
    beforeEach(async () => {
      await privacyService.initialize('test-password');
    });

    it('should store data securely with encryption', async () => {
      const testData = { message: 'sensitive information' };
      
      await expect(
        privacyService.storeSecureData('test-key', testData, 'test-user', 'task_data')
      ).resolves.not.toThrow();
      
      // Verify encryption was called
      expect(crypto.subtle.encrypt).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should retrieve and decrypt data correctly', async () => {
      // Mock encrypted data in localStorage
      const mockEncryptedData = {
        encrypted: [1, 2, 3, 4],
        iv: [5, 6, 7, 8],
        keyId: 'test-key-id',
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
        integrity: 'test-hash'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEncryptedData));
      
      // Mock decryption to return test data
      const testData = JSON.stringify({ message: 'decrypted data' });
      vi.mocked(crypto.subtle.decrypt).mockResolvedValueOnce(
        new TextEncoder().encode(testData).buffer
      );
      
      const result = await privacyService.retrieveSecureData('test-key', 'test-user', 'task_data');
      
      expect(result).toEqual({ message: 'decrypted data' });
      expect(crypto.subtle.decrypt).toHaveBeenCalled();
    });

    it('should deny storage for non-consented data types', async () => {
      await expect(
        privacyService.storeSecureData('test-key', {}, 'test-user', 'biometric_data')
      ).rejects.toThrow('Data storage not permitted');
    });
  });

  describe('Privacy Dashboard', () => {
    beforeEach(async () => {
      await privacyService.initialize('test-password');
    });

    it('should generate privacy dashboard metrics', async () => {
      const metrics = await privacyService.getPrivacyDashboard('test-user');
      
      expect(metrics).toHaveProperty('totalDataPoints');
      expect(metrics).toHaveProperty('encryptedDataPercentage');
      expect(metrics).toHaveProperty('localProcessingPercentage');
      expect(metrics).toHaveProperty('privacyScore');
      expect(metrics.localProcessingPercentage).toBe(100); // All processing is local
    });
  });

  describe('Data Export and Deletion', () => {
    beforeEach(async () => {
      await privacyService.initialize('test-password');
    });

    it('should export user data successfully', async () => {
      const exportResult = await privacyService.exportUserData(
        'test-user',
        ['task_data', 'behavioral_patterns'],
        'json'
      );
      
      expect(exportResult).toHaveProperty('metadata');
      expect(exportResult).toHaveProperty('data');
      expect(exportResult).toHaveProperty('integrity');
      expect(exportResult.metadata.format).toBe('json');
      expect(exportResult.metadata.dataTypes).toContain('task_data');
    });

    it('should delete user data and generate report', async () => {
      const deletionResult = await privacyService.deleteUserData(
        'test-user',
        ['task_data'],
        'User requested deletion'
      );
      
      expect(deletionResult).toHaveProperty('deletionId');
      expect(deletionResult).toHaveProperty('recordsDeleted');
      expect(deletionResult).toHaveProperty('verificationHash');
      expect(deletionResult.dataTypesDeleted).toContain('task_data');
    });

    it('should log data export and deletion events', async () => {
      await privacyService.exportUserData('test-user', ['task_data'], 'json');
      await privacyService.deleteUserData('test-user', ['task_data'], 'Test deletion');
      
      const auditLogs = privacyService.getAuditLogs(10);
      const exportLog = auditLogs.find(log => log.event === 'data_export_requested');
      const deletionLog = auditLogs.find(log => log.event === 'data_deletion_requested');
      
      expect(exportLog).toBeDefined();
      expect(deletionLog).toBeDefined();
    });
  });

  describe('Compliance and Audit', () => {
    beforeEach(async () => {
      await privacyService.initialize('test-password');
    });

    it('should provide compliance status', () => {
      const compliance = privacyService.getComplianceStatus();
      
      expect(compliance).toHaveProperty('gdprCompliant');
      expect(compliance).toHaveProperty('ccpaCompliant');
      expect(compliance).toHaveProperty('hipaaCompliant');
      expect(compliance).toHaveProperty('complianceScore');
      expect(typeof compliance.complianceScore).toBe('number');
    });

    it('should maintain audit logs', async () => {
      // Perform some operations to generate audit logs
      await privacyService.storeSecureData('test', {}, 'user', 'task_data');
      await privacyService.retrieveSecureData('test', 'user', 'task_data');
      
      const auditLogs = privacyService.getAuditLogs(10);
      expect(auditLogs.length).toBeGreaterThan(0);
      
      // Check audit log structure
      const log = auditLogs[0];
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('event');
      expect(log).toHaveProperty('severity');
    });

    it('should limit audit log size', async () => {
      // Generate many audit events
      for (let i = 0; i < 1100; i++) {
        await privacyService.checkDataProcessingPermission(['task_data'], ['service_provision']);
      }
      
      const auditLogs = privacyService.getAuditLogs(2000);
      expect(auditLogs.length).toBeLessThanOrEqual(1000); // Should be capped at 1000
    });
  });

  describe('Privacy Settings Management', () => {
    beforeEach(async () => {
      await privacyService.initialize('test-password');
    });

    it('should update privacy preferences', async () => {
      const preferences = {
        analytics: false,
        personalization: true,
        aiTraining: false
      };
      
      await expect(
        privacyService.updatePrivacyPreferences(preferences, 'test-user')
      ).resolves.not.toThrow();
      
      // Should log the preference change
      const auditLogs = privacyService.getAuditLogs(5);
      const prefLog = auditLogs.find(log => log.event === 'privacy_preference_changed');
      expect(prefLog).toBeDefined();
    });
  });

  describe('Service Statistics', () => {
    it('should provide accurate service statistics', () => {
      const stats = privacyService.getStats();
      
      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('encryptionEnabled');
      expect(stats).toHaveProperty('localInferenceEnabled');
      expect(stats).toHaveProperty('auditLogCount');
      expect(stats).toHaveProperty('complianceMode');
      
      expect(typeof stats.isInitialized).toBe('boolean');
      expect(typeof stats.auditLogCount).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle uninitialized service gracefully', async () => {
      const uninitializedService = new PrivacyService();
      
      await expect(
        uninitializedService.storeSecureData('key', {})
      ).rejects.toThrow('Privacy service not initialized');
      
      await expect(
        uninitializedService.retrieveSecureData('key')
      ).rejects.toThrow('Privacy service not initialized');
    });

    it('should handle encryption failures gracefully', async () => {
      await privacyService.initialize('test-password');
      
      // Mock encryption failure
      vi.mocked(crypto.subtle.encrypt).mockRejectedValueOnce(new Error('Encryption failed'));
      
      await expect(
        privacyService.storeSecureData('key', {}, 'user', 'task_data')
      ).rejects.toThrow();
    });
  });

  describe('Data Cleanup', () => {
    beforeEach(async () => {
      await privacyService.initialize('test-password');
    });

    it('should clear all privacy data', async () => {
      // Store some data first
      await privacyService.storeSecureData('test', {}, 'user', 'task_data');
      
      await expect(privacyService.clearAllPrivacyData()).resolves.not.toThrow();
      
      const stats = privacyService.getStats();
      expect(stats.isInitialized).toBe(false);
      expect(stats.auditLogCount).toBe(0);
    });
  });
});