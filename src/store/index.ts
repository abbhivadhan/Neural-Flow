import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';

// Enable Map and Set support in Immer
enableMapSet();
import { workspaceSlice, WorkspaceSlice } from './slices/workspaceSlice';
import { aiSlice, AISlice } from './slices/aiSlice';
import { collaborationSlice, CollaborationSlice } from './slices/collaborationSlice';
import { cacheSlice, CacheSlice } from './slices/cacheSlice';
import { offlineSlice, OfflineSlice } from './slices/offlineSlice';

// Combined store interface
export interface AppStore extends 
  WorkspaceSlice,
  AISlice,
  CollaborationSlice,
  CacheSlice,
  OfflineSlice {}

// Create the main store with all slices
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((...a) => ({
          ...workspaceSlice(...a),
          ...aiSlice(...a),
          ...collaborationSlice(...a),
          ...cacheSlice(...a),
          ...offlineSlice(...a),
        }))
      ),
      {
        name: 'neural-flow-store',
        partialize: (state) => ({
          // Only persist essential data
          workspace: {
            currentProject: state.workspace.currentProject,
            userPreferences: state.workspace.userPreferences,
            recentProjects: state.workspace.recentProjects,
          },
          ai: {
            modelSettings: state.ai.modelSettings,
            userPatterns: state.ai.userPatterns,
          },
          cache: {
            metadata: state.cache.metadata,
          },
          offline: {
            isOffline: state.offline.isOffline,
            syncQueue: state.offline.syncQueue,
          },
        }),
      }
    ),
    {
      name: 'neural-flow-store',
    }
  )
);

// Selector hooks for optimized re-renders
export const useWorkspace = () => useAppStore((state) => state.workspace);
export const useAI = () => useAppStore((state) => state.ai);
export const useCollaboration = () => useAppStore((state) => state.collaboration);
export const useCache = () => useAppStore((state) => state.cache);
export const useOffline = () => useAppStore((state) => state.offline);

// Action hooks
export const useWorkspaceActions = () => useAppStore((state) => ({
  setCurrentProject: state.setCurrentProject,
  updateUserPreferences: state.updateUserPreferences,
  addRecentProject: state.addRecentProject,
  createTask: state.createTask,
  updateTask: state.updateTask,
  deleteTask: state.deleteTask,
}));

export const useAIActions = () => useAppStore((state) => ({
  updateModelSettings: state.updateModelSettings,
  addPrediction: state.addPrediction,
  updateUserPatterns: state.updateUserPatterns,
  generateContent: state.generateContent,
}));

export const useCacheActions = () => useAppStore((state) => ({
  setCache: state.setCache,
  getCache: state.getCache,
  invalidateCache: state.invalidateCache,
  clearExpiredCache: state.clearExpiredCache,
}));

export const useOfflineActions = () => useAppStore((state) => ({
  setOfflineStatus: state.setOfflineStatus,
  addToSyncQueue: state.addToSyncQueue,
  processSyncQueue: state.processSyncQueue,
  clearSyncQueue: state.clearSyncQueue,
}));