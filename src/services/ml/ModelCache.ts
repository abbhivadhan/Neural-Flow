import { LlamaModelConfig } from './LlamaModelService';

export interface CachedModel {
  id: string;
  config: LlamaModelConfig;
  metadata: ModelMetadata;
  data?: ArrayBuffer;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface ModelMetadata {
  size: number;
  quantizationLevel: string;
  version: string;
  checksum: string;
  compressionRatio: number;
}

export interface CacheStats {
  totalSize: number;
  modelCount: number;
  hitRate: number;
  evictionCount: number;
}

export class ModelCache {
  private cache = new Map<string, CachedModel>();
  private maxCacheSize: number;
  private maxModelAge: number;
  private stats: CacheStats = {
    totalSize: 0,
    modelCount: 0,
    hitRate: 0,
    evictionCount: 0
  };
  private hitCount = 0;
  private missCount = 0;

  constructor(maxCacheSizeMB = 2048, maxModelAgeHours = 24) {
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // Convert to bytes
    this.maxModelAge = maxModelAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    
    // Initialize from persistent storage
    this.loadFromStorage();
    
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Get a cached model
   */
  async get(modelId: string): Promise<CachedModel | null> {
    const cached = this.cache.get(modelId);
    
    if (!cached) {
      this.missCount++;
      this.updateHitRate();
      return null;
    }

    // Check if model is expired
    if (this.isExpired(cached)) {
      this.cache.delete(modelId);
      this.stats.totalSize -= cached.metadata.size;
      this.stats.modelCount--;
      this.missCount++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    cached.accessCount++;
    cached.lastAccessed = Date.now();
    this.hitCount++;
    this.updateHitRate();

    return cached;
  }

  /**
   * Store a model in cache
   */
  async set(modelId: string, model: Omit<CachedModel, 'id' | 'timestamp' | 'accessCount' | 'lastAccessed'>): Promise<void> {
    const now = Date.now();
    const cachedModel: CachedModel = {
      ...model,
      id: modelId,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    };

    // Check if we need to make space
    await this.ensureSpace(cachedModel.metadata.size);

    // Store in memory cache
    this.cache.set(modelId, cachedModel);
    this.stats.totalSize += cachedModel.metadata.size;
    this.stats.modelCount++;

    // Persist to storage (without the actual model data for space efficiency)
    await this.persistToStorage(modelId, cachedModel);
  }

  /**
   * Remove a model from cache
   */
  async remove(modelId: string): Promise<boolean> {
    const cached = this.cache.get(modelId);
    if (!cached) return false;

    this.cache.delete(modelId);
    this.stats.totalSize -= cached.metadata.size;
    this.stats.modelCount--;

    // Remove from persistent storage
    await this.removeFromStorage(modelId);

    return true;
  }

  /**
   * Clear all cached models
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      totalSize: 0,
      modelCount: 0,
      hitRate: 0,
      evictionCount: 0
    };
    this.hitCount = 0;
    this.missCount = 0;

    // Clear persistent storage
    await this.clearStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cached model IDs
   */
  getCachedModelIds(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if a model is cached
   */
  has(modelId: string): boolean {
    const cached = this.cache.get(modelId);
    return cached !== undefined && !this.isExpired(cached);
  }

  /**
   * Preload models based on usage patterns
   */
  async preloadModels(modelIds: string[]): Promise<void> {
    const preloadPromises = modelIds.map(async (modelId) => {
      if (!this.has(modelId)) {
        // This would trigger model loading in the background
        console.log(`Preloading model: ${modelId}`);
      }
    });

    await Promise.all(preloadPromises);
  }

  /**
   * Get cache usage by model
   */
  getUsageStats(): Array<{ modelId: string; accessCount: number; lastAccessed: number; size: number }> {
    return Array.from(this.cache.entries()).map(([modelId, cached]) => ({
      modelId,
      accessCount: cached.accessCount,
      lastAccessed: cached.lastAccessed,
      size: cached.metadata.size
    }));
  }

  private async ensureSpace(requiredSize: number): Promise<void> {
    while (this.stats.totalSize + requiredSize > this.maxCacheSize && this.cache.size > 0) {
      await this.evictLeastUsed();
    }
  }

  private async evictLeastUsed(): Promise<void> {
    let leastUsed: { modelId: string; cached: CachedModel } | null = null;
    let minScore = Infinity;

    // Calculate eviction score (lower is more likely to be evicted)
    for (const [modelId, cached] of this.cache.entries()) {
      const age = Date.now() - cached.lastAccessed;
      const score = cached.accessCount / (age / 1000); // Access frequency per second
      
      if (score < minScore) {
        minScore = score;
        leastUsed = { modelId, cached };
      }
    }

    if (leastUsed) {
      await this.remove(leastUsed.modelId);
      this.stats.evictionCount++;
      console.log(`Evicted model: ${leastUsed.modelId}`);
    }
  }

  private isExpired(cached: CachedModel): boolean {
    return Date.now() - cached.timestamp > this.maxModelAge;
  }

  private updateHitRate(): void {
    const total = this.hitCount + this.missCount;
    this.stats.hitRate = total > 0 ? this.hitCount / total : 0;
  }

  private async cleanup(): Promise<void> {
    const expiredModels: string[] = [];
    
    for (const [modelId, cached] of this.cache.entries()) {
      if (this.isExpired(cached)) {
        expiredModels.push(modelId);
      }
    }

    for (const modelId of expiredModels) {
      await this.remove(modelId);
    }

    if (expiredModels.length > 0) {
      console.log(`Cleaned up ${expiredModels.length} expired models`);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const cacheData = localStorage.getItem('neural_flow_model_cache');
      if (!cacheData) return;

      const parsed = JSON.parse(cacheData);
      for (const [modelId, cachedModel] of Object.entries(parsed.models || {})) {
        const model = cachedModel as CachedModel;
        if (!this.isExpired(model)) {
          // Only load metadata, not the actual model data
          this.cache.set(modelId, { ...model, data: undefined });
          this.stats.totalSize += model.metadata.size;
          this.stats.modelCount++;
        }
      }

      // Restore stats
      if (parsed.stats) {
        this.stats = { ...this.stats, ...parsed.stats };
      }
    } catch (error) {
      console.warn('Failed to load model cache from storage:', error);
    }
  }

  private async persistToStorage(modelId: string, model: CachedModel): Promise<void> {
    try {
      const cacheData = localStorage.getItem('neural_flow_model_cache');
      const parsed = cacheData ? JSON.parse(cacheData) : { models: {}, stats: {} };
      
      // Store without the actual model data to save space
      parsed.models[modelId] = {
        ...model,
        data: undefined // Don't persist the actual model data
      };
      
      parsed.stats = this.stats;
      
      localStorage.setItem('neural_flow_model_cache', JSON.stringify(parsed));
    } catch (error) {
      console.warn('Failed to persist model cache:', error);
    }
  }

  private async removeFromStorage(modelId: string): Promise<void> {
    try {
      const cacheData = localStorage.getItem('neural_flow_model_cache');
      if (!cacheData) return;

      const parsed = JSON.parse(cacheData);
      delete parsed.models[modelId];
      parsed.stats = this.stats;
      
      localStorage.setItem('neural_flow_model_cache', JSON.stringify(parsed));
    } catch (error) {
      console.warn('Failed to remove model from storage:', error);
    }
  }

  private async clearStorage(): Promise<void> {
    try {
      localStorage.removeItem('neural_flow_model_cache');
    } catch (error) {
      console.warn('Failed to clear model cache storage:', error);
    }
  }

  /**
   * Export cache data for debugging
   */
  exportCacheData(): any {
    return {
      models: Array.from(this.cache.entries()).map(([id, model]) => ({
        id,
        config: model.config,
        metadata: model.metadata,
        timestamp: model.timestamp,
        accessCount: model.accessCount,
        lastAccessed: model.lastAccessed
      })),
      stats: this.stats,
      hitCount: this.hitCount,
      missCount: this.missCount
    };
  }

  /**
   * Import cache data (for testing or migration)
   */
  async importCacheData(data: any): Promise<void> {
    this.cache.clear();
    
    for (const modelData of data.models || []) {
      const cached: CachedModel = {
        id: modelData.id,
        config: modelData.config,
        metadata: modelData.metadata,
        timestamp: modelData.timestamp,
        accessCount: modelData.accessCount,
        lastAccessed: modelData.lastAccessed
      };
      
      this.cache.set(modelData.id, cached);
    }
    
    this.stats = data.stats || this.stats;
    this.hitCount = data.hitCount || 0;
    this.missCount = data.missCount || 0;
  }
}