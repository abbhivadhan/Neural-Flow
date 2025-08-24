/**
 * Encryption Service Tests
 * Tests for end-to-end encryption functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EncryptionService } from '../EncryptionService';

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
      generateKey: vi.fn().mockResolvedValue({
        type: 'secret',
        algorithm: { name: 'AES-GCM', length: 256 }
      }),
      importKey: vi.fn().mockResolvedValue({
        type: 'secret',
        algorithm: { name: 'AES-GCM' }
      }),
      exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(64)),
      decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('decrypted data').buffer),
      deriveKey: vi.fn().mockResolvedValue({
        type: 'secret',
        algorithm: { name: 'AES-GCM', length: 256 }
      }),
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

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService();
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with master password', async () => {
      const masterPassword = 'test-master-password-123';
      
      await expect(encryptionService.initialize(masterPassword)).resolves.not.toThrow();
      
      // Should derive key from password
      expect(crypto.subtle.deriveKey).toHaveBeenCalled();
      
      const stats = encryptionService.getStats();
      expect(stats.isInitialized).toBe(true);
    });

    it('should handle initialization failure', async () => {
      vi.mocked(crypto.subtle.deriveKey).mockRejectedValueOnce(new Error('Crypto error'));
      
      await expect(encryptionService.initialize('password')).rejects.toThrow();
    });

    it('should not reinitialize if already initialized', async () => {
      await encryptionService.initialize('password1');
      await encryptionService.initialize('password2');
      
      // Should only call deriveKey once
      expect(crypto.subtle.deriveKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('Key Generation', () => {
    beforeEach(async () => {
      await encryptionService.initialize('test-password');
    });

    it('should generate encryption key', async () => {
      const keyId = await encryptionService.generateKey('encryption');
      
      expect(typeof keyId).toBe('string');
      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      const stats = encryptionService.getStats();
      expect(stats.keyCount).toBe(1);
    });

    it('should generate signing key', async () => {
      const keyId = await encryptionService.generateKey('signing');
      
      expect(typeof keyId).toBe('string');
      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'ECDSA', namedCurve: 'P-384' },
        true,
        ['sign', 'verify']
      );
    });

    it('should generate derivation key', async () => {
      const keyId = await encryptionService.generateKey('derivation');
      
      expect(typeof keyId).toBe('string');
      expect(crypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'ECDH', namedCurve: 'P-384' },
        true,
        ['deriveKey', 'deriveBits']
      );
    });

    it('should store generated keys securely', async () => {
      await encryptionService.generateKey('encryption');
      
      // Should encrypt and store the key
      expect(crypto.subtle.encrypt).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Data Encryption and Decryption', () => {
    beforeEach(async () => {
      await encryptionService.initialize('test-password');
    });

    it('should encrypt string data', async () => {
      const testData = 'sensitive information';
      
      const encryptedData = await encryptionService.encryptData(testData);
      
      expect(encryptedData).toHaveProperty('data');
      expect(encryptedData).toHaveProperty('iv');
      expect(encryptedData).toHaveProperty('keyId');
      expect(encryptedData).toHaveProperty('algorithm');
      expect(encryptedData).toHaveProperty('integrity');
      expect(encryptedData.algorithm).toBe('AES-GCM');
      
      expect(crypto.subtle.encrypt).toHaveBeenCalled();
    });

    it('should encrypt ArrayBuffer data', async () => {
      const testData = new TextEncoder().encode('test data').buffer;
      
      const encryptedData = await encryptionService.encryptData(testData);
      
      expect(encryptedData).toHaveProperty('data');
      expect(encryptedData).toHaveProperty('keyId');
    });

    it('should decrypt data correctly', async () => {
      const originalData = 'test message';
      const encryptedData = await encryptionService.encryptData(originalData);
      
      // Mock successful decryption
      vi.mocked(crypto.subtle.decrypt).mockResolvedValueOnce(
        new TextEncoder().encode(originalData).buffer
      );
      
      const decryptedData = await encryptionService.decryptData(encryptedData);
      const decryptedString = new TextDecoder().decode(decryptedData);
      
      expect(decryptedString).toBe(originalData);
      expect(crypto.subtle.decrypt).toHaveBeenCalled();
    });

    it('should fail decryption with invalid key', async () => {
      const encryptedData = {
        data: new ArrayBuffer(64),
        iv: new ArrayBuffer(12),
        keyId: 'invalid-key-id',
        algorithm: 'AES-GCM',
        timestamp: new Date(),
        integrity: 'test-hash'
      };
      
      await expect(encryptionService.decryptData(encryptedData)).rejects.toThrow();
    });

    it('should verify data integrity', async () => {
      const testData = 'test data';
      const encryptedData = await encryptionService.encryptData(testData);
      
      // Tamper with integrity hash
      encryptedData.integrity = 'tampered-hash';
      
      await expect(encryptionService.decryptData(encryptedData)).rejects.toThrow(
        'Data integrity verification failed'
      );
    });
  });

  describe('Secure Storage', () => {
    beforeEach(async () => {
      await encryptionService.initialize('test-password');
    });

    it('should store encrypted data in localStorage', async () => {
      const testData = { message: 'secret data', value: 42 };
      
      await encryptionService.storeEncrypted('test-key', testData);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'encrypted_test-key',
        expect.any(String)
      );
    });

    it('should retrieve and decrypt stored data', async () => {
      const testData = { message: 'secret data', value: 42 };
      
      // Mock stored encrypted data
      const mockStoredData = {
        encrypted: [1, 2, 3, 4],
        iv: [5, 6, 7, 8],
        keyId: 'test-key-id',
        algorithm: 'AES-GCM',
        timestamp: new Date().toISOString(),
        integrity: 'test-hash'
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredData));
      
      // Mock successful decryption
      vi.mocked(crypto.subtle.decrypt).mockResolvedValueOnce(
        new TextEncoder().encode(JSON.stringify(testData)).buffer
      );
      
      const retrievedData = await encryptionService.retrieveDecrypted('test-key');
      
      expect(retrievedData).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = await encryptionService.retrieveDecrypted('non-existent-key');
      
      expect(result).toBeNull();
    });
  });

  describe('Key Management', () => {
    beforeEach(async () => {
      await encryptionService.initialize('test-password');
    });

    it('should load stored keys on initialization', async () => {
      // Mock stored key data
      const mockKeyData = {
        id: 'test-key-id',
        algorithm: 'AES-GCM',
        purpose: 'encryption',
        created: new Date().toISOString(),
        encryptedKey: [1, 2, 3, 4],
        iv: [5, 6, 7, 8]
      };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'key_test-key-id') {
          return JSON.stringify(mockKeyData);
        }
        return null;
      });
      
      localStorageMock.key.mockImplementation((index) => {
        if (index === 0) return 'key_test-key-id';
        return null;
      });
      
      Object.defineProperty(localStorageMock, 'length', { value: 1 });
      
      await encryptionService.loadStoredKeys();
      
      expect(crypto.subtle.decrypt).toHaveBeenCalled();
      expect(crypto.subtle.importKey).toHaveBeenCalled();
    });

    it('should export key backup', async () => {
      await encryptionService.generateKey('encryption');
      
      const backup = await encryptionService.exportKeyBackup('backup-password');
      
      expect(typeof backup).toBe('string');
      expect(backup.length).toBeGreaterThan(0);
      
      // Should be valid JSON
      expect(() => JSON.parse(backup)).not.toThrow();
    });

    it('should delete all keys and data', async () => {
      await encryptionService.generateKey('encryption');
      await encryptionService.storeEncrypted('test', { data: 'test' });
      
      await encryptionService.deleteAllKeys();
      
      const stats = encryptionService.getStats();
      expect(stats.isInitialized).toBe(false);
      expect(stats.keyCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle uninitialized service', async () => {
      await expect(encryptionService.encryptData('test')).rejects.toThrow(
        'Encryption service not initialized'
      );
      
      await expect(encryptionService.generateKey()).rejects.toThrow(
        'Encryption service not initialized'
      );
    });

    it('should handle crypto API failures', async () => {
      await encryptionService.initialize('test-password');
      
      vi.mocked(crypto.subtle.encrypt).mockRejectedValueOnce(new Error('Crypto error'));
      
      await expect(encryptionService.encryptData('test')).rejects.toThrow();
    });

    it('should handle storage failures gracefully', async () => {
      await encryptionService.initialize('test-password');
      
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      // Should not throw, but log error
      await expect(encryptionService.storeEncrypted('key', {})).resolves.not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      const stats = encryptionService.getStats();
      
      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('keyCount');
      expect(stats).toHaveProperty('encryptionAlgorithm');
      
      expect(typeof stats.isInitialized).toBe('boolean');
      expect(typeof stats.keyCount).toBe('number');
      expect(stats.encryptionAlgorithm).toBe('AES-GCM-256');
    });

    it('should update key count when keys are generated', async () => {
      await encryptionService.initialize('test-password');
      
      let stats = encryptionService.getStats();
      expect(stats.keyCount).toBe(0);
      
      await encryptionService.generateKey('encryption');
      
      stats = encryptionService.getStats();
      expect(stats.keyCount).toBe(1);
    });
  });
});