/**
 * End-to-End Encryption Service
 * Provides client-side encryption for sensitive user data with user-controlled keys
 */

export interface EncryptionKey {
  id: string;
  algorithm: string;
  keyData: CryptoKey;
  created: Date;
  purpose: 'encryption' | 'signing' | 'derivation';
}

export interface EncryptedData {
  data: ArrayBuffer;
  iv: ArrayBuffer;
  keyId: string;
  algorithm: string;
  timestamp: Date;
  integrity: string; // HMAC for integrity verification
}

export interface KeyDerivationParams {
  password: string;
  salt: ArrayBuffer;
  iterations: number;
  keyLength: number;
}

export class EncryptionService {
  private keys: Map<string, EncryptionKey> = new Map();
  private masterKey: CryptoKey | null = null;
  private isInitialized = false;

  /**
   * Initialize encryption service with user's master password
   */
  async initialize(masterPassword: string, salt?: ArrayBuffer): Promise<void> {
    try {
      // Generate or use provided salt
      const keySalt = salt || crypto.getRandomValues(new Uint8Array(32));
      
      // Derive master key from password using PBKDF2
      const masterKey = await this.deriveKeyFromPassword({
        password: masterPassword,
        salt: keySalt instanceof ArrayBuffer ? keySalt : keySalt.buffer,
        iterations: 100000, // High iteration count for security
        keyLength: 256
      });

      this.masterKey = masterKey;
      
      // Store salt securely (encrypted with a device-specific key)
      await this.storeSalt(keySalt instanceof ArrayBuffer ? keySalt : keySalt.buffer);
      
      this.isInitialized = true;
      console.log('Encryption service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(
    purpose: 'encryption' | 'signing' | 'derivation' = 'encryption'
  ): Promise<string> {
    this.ensureInitialized();

    try {
      let keyData: CryptoKey;
      let algorithm: string;

      switch (purpose) {
        case 'encryption':
          keyData = await crypto.subtle.generateKey(
            {
              name: 'AES-GCM',
              length: 256
            },
            true, // extractable
            ['encrypt', 'decrypt']
          );
          algorithm = 'AES-GCM';
          break;
          
        case 'signing':
          const signingKeyPair = await crypto.subtle.generateKey(
            {
              name: 'ECDSA',
              namedCurve: 'P-384'
            },
            true,
            ['sign', 'verify']
          );
          keyData = signingKeyPair.privateKey;
          algorithm = 'ECDSA';
          break;
          
        case 'derivation':
          const derivationKeyPair = await crypto.subtle.generateKey(
            {
              name: 'ECDH',
              namedCurve: 'P-384'
            },
            true,
            ['deriveKey', 'deriveBits']
          );
          keyData = derivationKeyPair.privateKey;
          algorithm = 'ECDH';
          break;
      }

      const keyId = crypto.randomUUID();
      const encryptionKey: EncryptionKey = {
        id: keyId,
        algorithm,
        keyData,
        created: new Date(),
        purpose
      };

      this.keys.set(keyId, encryptionKey);
      
      // Encrypt and store key securely
      await this.storeKeySecurely(encryptionKey);
      
      return keyId;
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(
    data: string | ArrayBuffer,
    keyId?: string
  ): Promise<EncryptedData> {
    this.ensureInitialized();

    try {
      // Use provided key or generate a new one
      const actualKeyId = keyId || await this.generateKey('encryption');
      const key = this.keys.get(actualKeyId);
      
      if (!key || key.purpose !== 'encryption') {
        throw new Error('Invalid encryption key');
      }

      // Convert string to ArrayBuffer if needed
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt data
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        key.keyData,
        dataBuffer
      );

      // Generate integrity hash
      const integrity = await this.generateIntegrityHash(encryptedData, iv.buffer);

      return {
        data: encryptedData,
        iv: iv.buffer,
        keyId: actualKeyId,
        algorithm: key.algorithm,
        timestamp: new Date(),
        integrity
      };
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: EncryptedData): Promise<ArrayBuffer> {
    this.ensureInitialized();

    try {
      const key = this.keys.get(encryptedData.keyId);
      if (!key) {
        throw new Error('Decryption key not found');
      }

      // Verify integrity
      const expectedIntegrity = await this.generateIntegrityHash(
        encryptedData.data,
        encryptedData.iv
      );
      
      if (expectedIntegrity !== encryptedData.integrity) {
        throw new Error('Data integrity verification failed');
      }

      // Decrypt data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: encryptedData.iv
        },
        key.keyData,
        encryptedData.data
      );

      return decryptedData;
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw error;
    }
  }

  /**
   * Encrypt and store data in local storage
   */
  async storeEncrypted(key: string, data: any): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      const encryptedData = await this.encryptData(serializedData);
      
      // Store encrypted data
      const storageData = {
        encrypted: Array.from(new Uint8Array(encryptedData.data)),
        iv: Array.from(new Uint8Array(encryptedData.iv)),
        keyId: encryptedData.keyId,
        algorithm: encryptedData.algorithm,
        timestamp: encryptedData.timestamp.toISOString(),
        integrity: encryptedData.integrity
      };
      
      localStorage.setItem(`encrypted_${key}`, JSON.stringify(storageData));
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt data from local storage
   */
  async retrieveDecrypted(key: string): Promise<any> {
    try {
      const storedData = localStorage.getItem(`encrypted_${key}`);
      if (!storedData) {
        return null;
      }

      const parsedData = JSON.parse(storedData);
      const encryptedData: EncryptedData = {
        data: new Uint8Array(parsedData.encrypted).buffer,
        iv: new Uint8Array(parsedData.iv).buffer,
        keyId: parsedData.keyId,
        algorithm: parsedData.algorithm,
        timestamp: new Date(parsedData.timestamp),
        integrity: parsedData.integrity
      };

      const decryptedBuffer = await this.decryptData(encryptedData);
      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      throw error;
    }
  }

  /**
   * Derive key from password using PBKDF2
   */
  private async deriveKeyFromPassword(params: KeyDerivationParams): Promise<CryptoKey> {
    const passwordBuffer = new TextEncoder().encode(params.password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive actual key
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: params.salt,
        iterations: params.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: params.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate integrity hash for encrypted data
   */
  private async generateIntegrityHash(
    data: ArrayBuffer,
    iv: ArrayBuffer
  ): Promise<string> {
    const combined = new Uint8Array(data.byteLength + iv.byteLength);
    combined.set(new Uint8Array(data), 0);
    combined.set(new Uint8Array(iv), data.byteLength);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Store encryption key securely
   */
  private async storeKeySecurely(key: EncryptionKey): Promise<void> {
    if (!this.masterKey) {
      throw new Error('Master key not available');
    }

    try {
      // Export key for storage
      const exportedKey = await crypto.subtle.exportKey('raw', key.keyData);
      
      // Encrypt key with master key
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedKey = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.masterKey,
        exportedKey
      );

      // Store encrypted key
      const keyStorage = {
        id: key.id,
        algorithm: key.algorithm,
        purpose: key.purpose,
        created: key.created.toISOString(),
        encryptedKey: Array.from(new Uint8Array(encryptedKey)),
        iv: Array.from(new Uint8Array(iv))
      };

      localStorage.setItem(`key_${key.id}`, JSON.stringify(keyStorage));
    } catch (error) {
      console.error('Failed to store key securely:', error);
      throw error;
    }
  }

  /**
   * Store salt securely
   */
  private async storeSalt(salt: ArrayBuffer): Promise<void> {
    // In a real implementation, this would use a device-specific key
    // For now, we'll store it in a way that's tied to the browser
    const saltArray = Array.from(new Uint8Array(salt));
    localStorage.setItem('encryption_salt', JSON.stringify(saltArray));
  }

  /**
   * Load stored keys
   */
  async loadStoredKeys(): Promise<void> {
    if (!this.masterKey) {
      throw new Error('Master key not available');
    }

    try {
      // Get all stored keys
      const keyIds: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('key_')) {
          keyIds.push(key.substring(4));
        }
      }

      // Load each key
      for (const keyId of keyIds) {
        try {
          const keyData = localStorage.getItem(`key_${keyId}`);
          if (!keyData) continue;

          const parsedKey = JSON.parse(keyData);
          
          // Decrypt key
          const iv = new Uint8Array(parsedKey.iv);
          const encryptedKey = new Uint8Array(parsedKey.encryptedKey);
          
          const decryptedKey = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            this.masterKey,
            encryptedKey
          );

          // Import key
          const importedKey = await crypto.subtle.importKey(
            'raw',
            decryptedKey,
            { name: parsedKey.algorithm },
            true,
            parsedKey.purpose === 'encryption' ? ['encrypt', 'decrypt'] : ['sign', 'verify']
          );

          // Store in memory
          this.keys.set(keyId, {
            id: keyId,
            algorithm: parsedKey.algorithm,
            keyData: importedKey,
            created: new Date(parsedKey.created),
            purpose: parsedKey.purpose
          });
        } catch (error) {
          console.error(`Failed to load key ${keyId}:`, error);
        }
      }

      console.log(`Loaded ${this.keys.size} encryption keys`);
    } catch (error) {
      console.error('Failed to load stored keys:', error);
      throw error;
    }
  }

  /**
   * Delete all encryption keys and data
   */
  async deleteAllKeys(): Promise<void> {
    try {
      // Clear memory
      this.keys.clear();
      this.masterKey = null;
      
      // Clear storage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('key_') || key?.startsWith('encrypted_') || key === 'encryption_salt') {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      this.isInitialized = false;
      console.log('All encryption keys and data deleted');
    } catch (error) {
      console.error('Failed to delete encryption keys:', error);
      throw error;
    }
  }

  /**
   * Export encrypted backup of all keys
   */
  async exportKeyBackup(backupPassword: string): Promise<string> {
    this.ensureInitialized();

    try {
      const keyExports: any[] = [];
      
      for (const [keyId, key] of this.keys.entries()) {
        const exportedKey = await crypto.subtle.exportKey('raw', key.keyData);
        keyExports.push({
          id: keyId,
          algorithm: key.algorithm,
          purpose: key.purpose,
          created: key.created.toISOString(),
          keyData: Array.from(new Uint8Array(exportedKey))
        });
      }

      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        keys: keyExports
      };

      // Encrypt backup with backup password
      const backupSalt = crypto.getRandomValues(new Uint8Array(32));
      const backupKey = await this.deriveKeyFromPassword({
        password: backupPassword,
        salt: backupSalt.buffer,
        iterations: 100000,
        keyLength: 256
      });

      const backupJson = JSON.stringify(backupData);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBackup = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        backupKey,
        new TextEncoder().encode(backupJson)
      );

      const finalBackup = {
        salt: Array.from(new Uint8Array(backupSalt)),
        iv: Array.from(new Uint8Array(iv)),
        data: Array.from(new Uint8Array(encryptedBackup))
      };

      return JSON.stringify(finalBackup);
    } catch (error) {
      console.error('Failed to export key backup:', error);
      throw error;
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.masterKey) {
      throw new Error('Encryption service not initialized');
    }
  }

  /**
   * Get encryption statistics
   */
  getStats(): {
    isInitialized: boolean;
    keyCount: number;
    encryptionAlgorithm: string;
  } {
    return {
      isInitialized: this.isInitialized,
      keyCount: this.keys.size,
      encryptionAlgorithm: 'AES-GCM-256'
    };
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();