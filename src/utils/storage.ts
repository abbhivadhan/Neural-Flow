// Local storage utilities for Neural Flow data persistence
import { z } from 'zod';

// Storage configuration
export const STORAGE_CONFIG = {
  PREFIX: 'neural_flow_',
  VERSION: '1.0.0',
  ENCRYPTION_ENABLED: false, // Set to true for production
  COMPRESSION_ENABLED: true,
  MAX_STORAGE_SIZE: 50 * 1024 * 1024, // 50MB
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// Storage keys enum for type safety
export enum StorageKeys {
  USER_PROFILE = 'user_profile',
  USER_PREFERENCES = 'user_preferences',
  USER_BEHAVIOR_PATTERN = 'user_behavior_pattern',
  TASKS = 'tasks',
  PROJECTS = 'projects',
  AI_MODELS = 'ai_models',
  PREDICTIONS = 'predictions',
  SEARCH_HISTORY = 'search_history',
  ANALYTICS_CACHE = 'analytics_cache',
  COLLABORATION_DATA = 'collaboration_data',
  OFFLINE_QUEUE = 'offline_queue',
  SETTINGS = 'settings',
  CACHE_METADATA = 'cache_metadata',
}

// Storage metadata interface
interface StorageMetadata {
  version: string;
  timestamp: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  ttl?: number; // Time to live in milliseconds
}

// Storage result interface
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: StorageMetadata;
}

// Storage options interface
interface StorageOptions {
  ttl?: number;
  compress?: boolean;
  encrypt?: boolean;
  validate?: boolean;
  schema?: z.ZodSchema;
}

// Storage statistics interface
export interface StorageStats {
  totalSize: number;
  itemCount: number;
  oldestItem: number;
  newestItem: number;
  compressionRatio: number;
  items: Array<{
    key: string;
    size: number;
    timestamp: number;
    ttl?: number;
  }>;
}

class LocalStorageManager {
  private readonly prefix: string;
  private compressionEnabled: boolean;
  private encryptionEnabled: boolean;

  constructor() {
    this.prefix = STORAGE_CONFIG.PREFIX;
    this.compressionEnabled = STORAGE_CONFIG.COMPRESSION_ENABLED;
    this.encryptionEnabled = STORAGE_CONFIG.ENCRYPTION_ENABLED;
    
    // Initialize cleanup interval
    this.initializeCleanup();
  }

  /**
   * Store data in localStorage with metadata and optional compression/encryption
   */
  async set<T>(
    key: StorageKeys | string,
    data: T,
    options: StorageOptions = {}
  ): Promise<StorageResult<T>> {
    try {
      const fullKey = this.getFullKey(key);
      const timestamp = Date.now();
      
      // Validate data if schema provided
      if (options.validate && options.schema) {
        const validation = options.schema.safeParse(data);
        if (!validation.success) {
          return {
            success: false,
            error: `Validation failed: ${validation.error.message}`,
          };
        }
      }

      // Serialize data
      let serializedData = JSON.stringify(data);
      let compressed = false;
      let encrypted = false;

      // Compress if enabled
      if (options.compress ?? this.compressionEnabled) {
        serializedData = await this.compress(serializedData);
        compressed = true;
      }

      // Encrypt if enabled
      if (options.encrypt ?? this.encryptionEnabled) {
        serializedData = await this.encrypt(serializedData);
        encrypted = true;
      }

      // Create metadata
      const metadata: StorageMetadata = {
        version: STORAGE_CONFIG.VERSION,
        timestamp,
        size: serializedData.length,
        compressed,
        encrypted,
        ttl: options.ttl || 0,
      };

      // Create storage object
      const storageObject = {
        data: serializedData,
        metadata,
      };

      // Check storage size limits
      const storageSize = JSON.stringify(storageObject).length;
      if (storageSize > STORAGE_CONFIG.MAX_STORAGE_SIZE) {
        return {
          success: false,
          error: 'Data exceeds maximum storage size limit',
        };
      }

      // Store in localStorage
      localStorage.setItem(fullKey, JSON.stringify(storageObject));

      return {
        success: true,
        data,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown storage error',
      };
    }
  }

  /**
   * Retrieve data from localStorage with automatic decompression/decryption
   */
  async get<T>(
    key: StorageKeys | string,
    options: StorageOptions = {}
  ): Promise<StorageResult<T>> {
    try {
      const fullKey = this.getFullKey(key);
      const stored = localStorage.getItem(fullKey);

      if (!stored) {
        return {
          success: false,
          error: 'Item not found',
        };
      }

      const storageObject = JSON.parse(stored);
      const { data: serializedData, metadata } = storageObject;

      // Check TTL
      if (metadata.ttl && Date.now() > metadata.timestamp + metadata.ttl) {
        this.remove(key);
        return {
          success: false,
          error: 'Item expired',
        };
      }

      let data = serializedData;

      // Decrypt if needed
      if (metadata.encrypted) {
        data = await this.decrypt(data);
      }

      // Decompress if needed
      if (metadata.compressed) {
        data = await this.decompress(data);
      }

      // Parse JSON
      const parsedData = JSON.parse(data);

      // Validate if schema provided
      if (options.validate && options.schema) {
        const validation = options.schema.safeParse(parsedData);
        if (!validation.success) {
          return {
            success: false,
            error: `Validation failed: ${validation.error.message}`,
          };
        }
      }

      return {
        success: true,
        data: parsedData,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown retrieval error',
      };
    }
  }

  /**
   * Remove item from localStorage
   */
  remove(key: StorageKeys | string): boolean {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Error removing item from storage:', error);
      return false;
    }
  }

  /**
   * Check if item exists in localStorage
   */
  exists(key: StorageKeys | string): boolean {
    const fullKey = this.getFullKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * Clear all Neural Flow data from localStorage
   */
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage);
      const neuralFlowKeys = keys.filter(key => key.startsWith(this.prefix));
      
      neuralFlowKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    const keys = Object.keys(localStorage);
    const neuralFlowKeys = keys.filter(key => key.startsWith(this.prefix));
    
    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    let totalUncompressedSize = 0;
    
    const items = neuralFlowKeys.map(key => {
      const value = localStorage.getItem(key);
      const size = value ? value.length : 0;
      totalSize += size;
      
      try {
        const storageObject = JSON.parse(value || '{}');
        const metadata = storageObject.metadata;
        
        if (metadata?.timestamp) {
          oldestTimestamp = Math.min(oldestTimestamp, metadata.timestamp);
          newestTimestamp = Math.max(newestTimestamp, metadata.timestamp);
        }
        
        // Estimate uncompressed size for compression ratio
        if (metadata?.compressed) {
          totalUncompressedSize += size * 2; // Rough estimate
        } else {
          totalUncompressedSize += size;
        }
        
        return {
          key: key.replace(this.prefix, ''),
          size,
          timestamp: metadata?.timestamp || 0,
          ttl: metadata?.ttl,
        };
      } catch {
        return {
          key: key.replace(this.prefix, ''),
          size,
          timestamp: 0,
        };
      }
    });
    
    return {
      totalSize,
      itemCount: items.length,
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp,
      compressionRatio: totalUncompressedSize > 0 ? totalSize / totalUncompressedSize : 1,
      items,
    };
  }

  /**
   * Cleanup expired items
   */
  cleanup(): number {
    const keys = Object.keys(localStorage);
    const neuralFlowKeys = keys.filter(key => key.startsWith(this.prefix));
    let cleanedCount = 0;
    
    neuralFlowKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const storageObject = JSON.parse(value);
          const metadata = storageObject.metadata;
          
          if (metadata?.ttl && Date.now() > metadata.timestamp + metadata.ttl) {
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      } catch (error) {
        // Remove corrupted items
        localStorage.removeItem(key);
        cleanedCount++;
      }
    });
    
    return cleanedCount;
  }

  /**
   * Export all Neural Flow data
   */
  async exportData(): Promise<{ [key: string]: any }> {
    const keys = Object.keys(localStorage);
    const neuralFlowKeys = keys.filter(key => key.startsWith(this.prefix));
    const exportData: { [key: string]: any } = {};
    
    for (const key of neuralFlowKeys) {
      const shortKey = key.replace(this.prefix, '');
      const result = await this.get(shortKey);
      if (result.success) {
        exportData[shortKey] = result.data;
      }
    }
    
    return exportData;
  }

  /**
   * Import data into Neural Flow storage
   */
  async importData(data: { [key: string]: any }): Promise<number> {
    let importedCount = 0;
    
    for (const [key, value] of Object.entries(data)) {
      const result = await this.set(key, value);
      if (result.success) {
        importedCount++;
      }
    }
    
    return importedCount;
  }

  // Private helper methods
  private getFullKey(key: StorageKeys | string): string {
    return `${this.prefix}${key}`;
  }

  private async compress(data: string): Promise<string> {
    // Simple compression using built-in compression
    // In production, consider using a proper compression library
    try {
      const compressed = btoa(data);
      return compressed.length < data.length ? compressed : data;
    } catch {
      return data;
    }
  }

  private async decompress(data: string): Promise<string> {
    try {
      return atob(data);
    } catch {
      return data;
    }
  }

  private async encrypt(data: string): Promise<string> {
    // Placeholder for encryption - implement proper encryption in production
    // Consider using Web Crypto API for real encryption
    return btoa(data);
  }

  private async decrypt(data: string): Promise<string> {
    // Placeholder for decryption
    try {
      return atob(data);
    } catch {
      return data;
    }
  }

  private initializeCleanup(): void {
    // Run cleanup on initialization
    this.cleanup();
    
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, STORAGE_CONFIG.CLEANUP_INTERVAL);
  }
}

// Create singleton instance
export const storage = new LocalStorageManager();

// Convenience functions for common operations
export const storageUtils = {
  // User data operations
  async saveUserProfile(profile: any): Promise<boolean> {
    const result = await storage.set(StorageKeys.USER_PROFILE, profile);
    return result.success;
  },

  async getUserProfile(): Promise<any | null> {
    const result = await storage.get(StorageKeys.USER_PROFILE);
    return result.success ? result.data : null;
  },

  async saveUserPreferences(preferences: any): Promise<boolean> {
    const result = await storage.set(StorageKeys.USER_PREFERENCES, preferences);
    return result.success;
  },

  async getUserPreferences(): Promise<any | null> {
    const result = await storage.get(StorageKeys.USER_PREFERENCES);
    return result.success ? result.data : null;
  },

  // Task operations
  async saveTasks(tasks: any[]): Promise<boolean> {
    const result = await storage.set(StorageKeys.TASKS, tasks);
    return result.success;
  },

  async getTasks(): Promise<any[]> {
    const result = await storage.get(StorageKeys.TASKS);
    return result.success ? (Array.isArray(result.data) ? result.data : []) : [];
  },

  // Project operations
  async saveProjects(projects: any[]): Promise<boolean> {
    const result = await storage.set(StorageKeys.PROJECTS, projects);
    return result.success;
  },

  async getProjects(): Promise<any[]> {
    const result = await storage.get(StorageKeys.PROJECTS);
    return result.success ? (Array.isArray(result.data) ? result.data : []) : [];
  },

  // AI model operations
  async saveAIModels(models: any[]): Promise<boolean> {
    const result = await storage.set(StorageKeys.AI_MODELS, models);
    return result.success;
  },

  async getAIModels(): Promise<any[]> {
    const result = await storage.get(StorageKeys.AI_MODELS);
    return result.success ? (Array.isArray(result.data) ? result.data : []) : [];
  },

  // Cache operations with TTL
  async setCacheItem(key: string, data: any, ttlMinutes: number = 60): Promise<boolean> {
    const result = await storage.set(
      `cache_${key}`,
      data,
      { ttl: ttlMinutes * 60 * 1000 }
    );
    return result.success;
  },

  async getCacheItem(key: string): Promise<any | null> {
    const result = await storage.get(`cache_${key}`);
    return result.success ? result.data : null;
  },

  // Offline queue operations
  async addToOfflineQueue(action: any): Promise<boolean> {
    const queue = await this.getOfflineQueue();
    queue.push({ ...action, timestamp: Date.now() });
    const result = await storage.set(StorageKeys.OFFLINE_QUEUE, queue);
    return result.success;
  },

  async getOfflineQueue(): Promise<any[]> {
    const result = await storage.get(StorageKeys.OFFLINE_QUEUE);
    return result.success ? (Array.isArray(result.data) ? result.data : []) : [];
  },

  async clearOfflineQueue(): Promise<boolean> {
    return storage.remove(StorageKeys.OFFLINE_QUEUE);
  },

  // Storage management
  getStorageStats(): StorageStats {
    return storage.getStats();
  },

  async exportAllData(): Promise<{ [key: string]: any }> {
    return storage.exportData();
  },

  async importAllData(data: { [key: string]: any }): Promise<number> {
    return storage.importData(data);
  },

  clearAllData(): boolean {
    return storage.clear();
  },

  cleanupExpiredItems(): number {
    return storage.cleanup();
  },
};

// Export storage instance and utilities
export default storage;