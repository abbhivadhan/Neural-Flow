import { StateCreator } from 'zustand';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'project' | 'document' | 'user_preference';
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'syncing' | 'completed' | 'failed';
}

export interface OfflineState {
  isOffline: boolean;
  syncQueue: SyncOperation[];
  lastSync: number | null;
  syncInProgress: boolean;
  conflictResolution: 'client' | 'server' | 'manual';
  networkStatus: 'online' | 'offline' | 'slow' | 'unknown';
  dataVersion: number;
  pendingChanges: number;
}

export interface OfflineActions {
  setOfflineStatus: (isOffline: boolean) => void;
  setNetworkStatus: (status: OfflineState['networkStatus']) => void;
  addToSyncQueue: (operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => void;
  removeFromSyncQueue: (operationId: string) => void;
  updateSyncOperation: (operationId: string, updates: Partial<SyncOperation>) => void;
  processSyncQueue: () => Promise<void>;
  clearSyncQueue: () => void;
  incrementDataVersion: () => void;
  setConflictResolution: (strategy: OfflineState['conflictResolution']) => void;
  handleConflict: (operation: SyncOperation, serverData: any) => Promise<any>;
}

export interface OfflineSlice {
  offline: OfflineState;
  setOfflineStatus: OfflineActions['setOfflineStatus'];
  setNetworkStatus: OfflineActions['setNetworkStatus'];
  addToSyncQueue: OfflineActions['addToSyncQueue'];
  removeFromSyncQueue: OfflineActions['removeFromSyncQueue'];
  updateSyncOperation: OfflineActions['updateSyncOperation'];
  processSyncQueue: OfflineActions['processSyncQueue'];
  clearSyncQueue: OfflineActions['clearSyncQueue'];
  incrementDataVersion: OfflineActions['incrementDataVersion'];
  setConflictResolution: OfflineActions['setConflictResolution'];
  handleConflict: OfflineActions['handleConflict'];
}

export const offlineSlice: StateCreator<
  OfflineSlice,
  [['zustand/immer', never]],
  [],
  OfflineSlice
> = (set, get) => ({
  offline: {
    isOffline: !navigator.onLine,
    syncQueue: [],
    lastSync: null,
    syncInProgress: false,
    conflictResolution: 'client',
    networkStatus: navigator.onLine ? 'online' : 'offline',
    dataVersion: 1,
    pendingChanges: 0,
  },

  setOfflineStatus: (isOffline) =>
    set((state) => {
      state.offline.isOffline = isOffline;
      state.offline.networkStatus = isOffline ? 'offline' : 'online';
      
      // If coming back online, trigger sync
      if (!isOffline && state.offline.syncQueue.length > 0) {
        setTimeout(() => {
          get().processSyncQueue();
        }, 1000);
      }
    }),

  setNetworkStatus: (status) =>
    set((state) => {
      state.offline.networkStatus = status;
      state.offline.isOffline = status === 'offline';
    }),

  addToSyncQueue: (operationData) =>
    set((state) => {
      const operation: SyncOperation = {
        ...operationData,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };
      
      // Check for duplicate operations
      const existingIndex = state.offline.syncQueue.findIndex(
        op => op.entity === operation.entity && 
             op.entityId === operation.entityId && 
             op.type === operation.type
      );
      
      if (existingIndex !== -1) {
        // Update existing operation with latest data
        state.offline.syncQueue[existingIndex] = {
          ...state.offline.syncQueue[existingIndex],
          data: operation.data,
          timestamp: operation.timestamp,
        };
      } else {
        // Add new operation
        state.offline.syncQueue.push(operation);
      }
      
      // Sort by priority and timestamp
      state.offline.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });
      
      state.offline.pendingChanges = state.offline.syncQueue.length;
    }),

  removeFromSyncQueue: (operationId) =>
    set((state) => {
      state.offline.syncQueue = state.offline.syncQueue.filter(
        op => op.id !== operationId
      );
      state.offline.pendingChanges = state.offline.syncQueue.length;
    }),

  updateSyncOperation: (operationId, updates) =>
    set((state) => {
      const operationIndex = state.offline.syncQueue.findIndex(
        op => op.id === operationId
      );
      
      if (operationIndex !== -1) {
        state.offline.syncQueue[operationIndex] = {
          ...state.offline.syncQueue[operationIndex],
          ...updates,
        };
      }
    }),

  processSyncQueue: async () => {
    const state = get();
    
    if (state.offline.isOffline || state.offline.syncInProgress) {
      return;
    }
    
    set((state) => {
      state.offline.syncInProgress = true;
    });
    
    try {
      const pendingOperations = state.offline.syncQueue.filter(
        op => op.status === 'pending' || (op.status === 'failed' && op.retryCount < op.maxRetries)
      );
      
      for (const operation of pendingOperations) {
        try {
          set((state) => {
            const opIndex = state.offline.syncQueue.findIndex(op => op.id === operation.id);
            if (opIndex !== -1) {
              state.offline.syncQueue[opIndex].status = 'syncing';
            }
          });
          
          // Simulate API call
          await simulateSync(operation);
          
          // Mark as completed and remove from queue
          set((state) => {
            state.offline.syncQueue = state.offline.syncQueue.filter(
              op => op.id !== operation.id
            );
            state.offline.pendingChanges = state.offline.syncQueue.length;
          });
          
        } catch (error) {
          // Handle sync failure
          set((state) => {
            const opIndex = state.offline.syncQueue.findIndex(op => op.id === operation.id);
            if (opIndex !== -1) {
              state.offline.syncQueue[opIndex].retryCount++;
              
              if (state.offline.syncQueue[opIndex].retryCount >= operation.maxRetries) {
                state.offline.syncQueue[opIndex].status = 'failed';
              } else {
                state.offline.syncQueue[opIndex].status = 'pending';
              }
            }
          });
        }
      }
      
      set((state) => {
        state.offline.lastSync = Date.now();
        state.offline.syncInProgress = false;
      });
      
    } catch (error) {
      set((state) => {
        state.offline.syncInProgress = false;
      });
    }
  },

  clearSyncQueue: () =>
    set((state) => {
      state.offline.syncQueue = [];
      state.offline.pendingChanges = 0;
    }),

  incrementDataVersion: () =>
    set((state) => {
      state.offline.dataVersion++;
    }),

  setConflictResolution: (strategy) =>
    set((state) => {
      state.offline.conflictResolution = strategy;
    }),

  handleConflict: async (operation, serverData) => {
    const state = get();
    
    switch (state.offline.conflictResolution) {
      case 'client':
        // Client wins - keep local changes
        return operation.data;
        
      case 'server':
        // Server wins - use server data
        return serverData;
        
      case 'manual':
        // Manual resolution - would typically show a UI for user to choose
        // For now, we'll default to a merge strategy
        return mergeData(operation.data, serverData);
        
      default:
        return operation.data;
    }
  },
});

// Helper functions
async function simulateSync(operation: SyncOperation): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error('Sync failed');
  }
  
  console.log(`Synced ${operation.type} operation for ${operation.entity}:${operation.entityId}`);
}

function mergeData(clientData: any, serverData: any): any {
  // Simple merge strategy - in a real app, this would be more sophisticated
  if (typeof clientData === 'object' && typeof serverData === 'object') {
    return {
      ...serverData,
      ...clientData,
      // Prefer server timestamps for conflict resolution
      updatedAt: serverData.updatedAt || clientData.updatedAt,
    };
  }
  
  return clientData;
}

// Set up network status listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // This would be called from a React component or hook
    // get().setOfflineStatus(false);
  });
  
  window.addEventListener('offline', () => {
    // This would be called from a React component or hook
    // get().setOfflineStatus(true);
  });
}