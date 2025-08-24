import { StateCreator } from 'zustand';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
  tags: string[];
  size: number; // Approximate size in bytes
}

export interface CacheMetadata {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  lastCleanup: number;
}

export interface CacheState {
  entries: Map<string, CacheEntry>;
  metadata: CacheMetadata;
  maxSize: number; // Maximum cache size in bytes
  defaultTTL: number; // Default TTL in milliseconds
  cleanupInterval: number;
  isCleanupRunning: boolean;
}

export interface CacheActions {
  setCache: <T>(key: string, data: T, options?: { ttl?: number; tags?: string[] }) => void;
  getCache: <T>(key: string) => T | null;
  hasCache: (key: string) => boolean;
  invalidateCache: (key: string) => void;
  invalidateByTag: (tag: string) => void;
  clearExpiredCache: () => void;
  clearAllCache: () => void;
  updateCacheMetadata: () => void;
  startCleanupInterval: () => void;
  stopCleanupInterval: () => void;
}

export interface CacheSlice {
  cache: CacheState;
  setCache: CacheActions['setCache'];
  getCache: CacheActions['getCache'];
  hasCache: CacheActions['hasCache'];
  invalidateCache: CacheActions['invalidateCache'];
  invalidateByTag: CacheActions['invalidateByTag'];
  clearExpiredCache: CacheActions['clearExpiredCache'];
  clearAllCache: CacheActions['clearAllCache'];
  updateCacheMetadata: CacheActions['updateCacheMetadata'];
  startCleanupInterval: CacheActions['startCleanupInterval'];
  stopCleanupInterval: CacheActions['stopCleanupInterval'];
}

let cleanupIntervalId: NodeJS.Timeout | null = null;

export const cacheSlice: StateCreator<
  CacheSlice,
  [['zustand/immer', never]],
  [],
  CacheSlice
> = (set, get) => ({
  cache: {
    entries: new Map(),
    metadata: {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      missRate: 0,
      lastCleanup: Date.now(),
    },
    maxSize: 50 * 1024 * 1024, // 50MB default
    defaultTTL: 30 * 60 * 1000, // 30 minutes default
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    isCleanupRunning: false,
  },

  setCache: (key, data, options = {}) =>
    set((state) => {
      const now = Date.now();
      const ttl = options.ttl || state.cache.defaultTTL;
      const tags = options.tags || [];
      
      // Estimate size (rough approximation)
      const size = estimateSize(data);
      
      // Check if adding this entry would exceed max size
      if (state.cache.metadata.totalSize + size > state.cache.maxSize) {
        // Perform LRU eviction
        evictLRU(state, size);
      }
      
      const entry: CacheEntry = {
        key,
        data,
        timestamp: now,
        ttl,
        accessCount: 1,
        lastAccessed: now,
        tags,
        size,
      };
      
      // Remove existing entry if it exists
      const existingEntry = state.cache.entries.get(key);
      if (existingEntry) {
        state.cache.metadata.totalSize -= existingEntry.size;
        state.cache.metadata.entryCount--;
      }
      
      state.cache.entries.set(key, entry);
      state.cache.metadata.totalSize += size;
      state.cache.metadata.entryCount++;
    }),

  getCache: (key) => {
    const state = get();
    const entry = state.cache.entries.get(key);
    
    if (!entry) {
      // Cache miss
      set((state) => {
        state.cache.metadata.missRate++;
        updateHitRate(state);
      });
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      // Remove expired entry
      set((state) => {
        state.cache.entries.delete(key);
        state.cache.metadata.totalSize -= entry.size;
        state.cache.metadata.entryCount--;
        state.cache.metadata.missRate++;
        updateHitRate(state);
      });
      return null;
    }
    
    // Cache hit - update access info
    set((state) => {
      const currentEntry = state.cache.entries.get(key);
      if (currentEntry) {
        currentEntry.accessCount++;
        currentEntry.lastAccessed = now;
        state.cache.metadata.hitRate++;
        updateHitRate(state);
      }
    });
    
    return entry.data;
  },

  hasCache: (key) => {
    const state = get();
    const entry = state.cache.entries.get(key);
    
    if (!entry) return false;
    
    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Remove expired entry
      set((state) => {
        state.cache.entries.delete(key);
        state.cache.metadata.totalSize -= entry.size;
        state.cache.metadata.entryCount--;
      });
      return false;
    }
    
    return true;
  },

  invalidateCache: (key) =>
    set((state) => {
      const entry = state.cache.entries.get(key);
      if (entry) {
        state.cache.entries.delete(key);
        state.cache.metadata.totalSize -= entry.size;
        state.cache.metadata.entryCount--;
      }
    }),

  invalidateByTag: (tag) =>
    set((state) => {
      const keysToDelete: string[] = [];
      
      state.cache.entries.forEach((entry, key) => {
        if (entry.tags.includes(tag)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        const entry = state.cache.entries.get(key);
        if (entry) {
          state.cache.entries.delete(key);
          state.cache.metadata.totalSize -= entry.size;
          state.cache.metadata.entryCount--;
        }
      });
    }),

  clearExpiredCache: () =>
    set((state) => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      state.cache.entries.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        const entry = state.cache.entries.get(key);
        if (entry) {
          state.cache.entries.delete(key);
          state.cache.metadata.totalSize -= entry.size;
          state.cache.metadata.entryCount--;
        }
      });
      
      state.cache.metadata.lastCleanup = now;
    }),

  clearAllCache: () =>
    set((state) => {
      state.cache.entries.clear();
      state.cache.metadata = {
        totalSize: 0,
        entryCount: 0,
        hitRate: 0,
        missRate: 0,
        lastCleanup: Date.now(),
      };
    }),

  updateCacheMetadata: () =>
    set((state) => {
      let totalSize = 0;
      let entryCount = 0;
      
      state.cache.entries.forEach(entry => {
        totalSize += entry.size;
        entryCount++;
      });
      
      state.cache.metadata.totalSize = totalSize;
      state.cache.metadata.entryCount = entryCount;
    }),

  startCleanupInterval: () => {
    if (cleanupIntervalId) return;
    
    const { cache } = get();
    cleanupIntervalId = setInterval(() => {
      get().clearExpiredCache();
    }, cache.cleanupInterval);
    
    set((state) => {
      state.cache.isCleanupRunning = true;
    });
  },

  stopCleanupInterval: () => {
    if (cleanupIntervalId) {
      clearInterval(cleanupIntervalId);
      cleanupIntervalId = null;
    }
    
    set((state) => {
      state.cache.isCleanupRunning = false;
    });
  },
});

// Helper functions
function estimateSize(data: any): number {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    // Fallback estimation
    const str = String(data);
    return str.length * 2; // Rough estimate for UTF-16
  }
}

function evictLRU(state: any, requiredSize: number) {
  // Sort entries by last accessed time (LRU first)
  const entries = Array.from(state.cache.entries.entries()).sort(
    ([, a], [, b]) => a.lastAccessed - b.lastAccessed
  );
  
  let freedSize = 0;
  const keysToDelete: string[] = [];
  
  for (const [key, entry] of entries) {
    keysToDelete.push(key);
    freedSize += entry.size;
    
    if (freedSize >= requiredSize) break;
  }
  
  // Remove the selected entries
  keysToDelete.forEach(key => {
    const entry = state.cache.entries.get(key);
    if (entry) {
      state.cache.entries.delete(key);
      state.cache.metadata.totalSize -= entry.size;
      state.cache.metadata.entryCount--;
    }
  });
}

function updateHitRate(state: any) {
  const total = state.cache.metadata.hitRate + state.cache.metadata.missRate;
  if (total > 0) {
    state.cache.metadata.hitRate = state.cache.metadata.hitRate / total;
    state.cache.metadata.missRate = state.cache.metadata.missRate / total;
  }
}