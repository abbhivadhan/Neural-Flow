import React, { useEffect, useState } from 'react';
import { useServiceWorker, useBackgroundSync } from '../../hooks/useServiceWorker';
import { useAppStore } from '../../store';

interface OfflineManagerProps {
  children: React.ReactNode;
}

export const OfflineManager: React.FC<OfflineManagerProps> = ({ children }) => {
  const {
    isSupported,
    isRegistered,
    isUpdateAvailable,
    isOffline,
    register,
    skipWaiting,
    invalidateCache,
  } = useServiceWorker();

  const { offline, processSyncQueue } = useAppStore();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  // Initialize background sync
  useBackgroundSync();

  useEffect(() => {
    // Show update prompt when available
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [isUpdateAvailable]);

  useEffect(() => {
    // Show offline notice when going offline
    if (isOffline && !showOfflineNotice) {
      setShowOfflineNotice(true);
      setTimeout(() => setShowOfflineNotice(false), 5000);
    }
  }, [isOffline, showOfflineNotice]);

  useEffect(() => {
    // Process sync queue when coming back online
    if (!isOffline && offline.syncQueue.length > 0) {
      processSyncQueue();
    }
  }, [isOffline, offline.syncQueue.length, processSyncQueue]);

  const handleUpdate = () => {
    skipWaiting();
    setShowUpdatePrompt(false);
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  const handleClearCache = () => {
    invalidateCache('');
    window.location.reload();
  };

  return (
    <>
      {children}
      
      {/* Update Available Prompt */}
      {showUpdatePrompt && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium">Update Available</h3>
              <p className="text-sm text-blue-100 mt-1">
                A new version of Neural Flow is ready to install.
              </p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleUpdate}
                  className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Update Now
                </button>
                <button
                  onClick={handleDismissUpdate}
                  className="text-blue-100 px-3 py-1 rounded text-sm hover:text-white transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offline Notice */}
      {showOfflineNotice && (
        <div className="fixed top-4 left-4 z-50 bg-orange-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium">You're Offline</h3>
              <p className="text-sm text-orange-100 mt-1">
                Don't worry! Your changes will sync when you're back online.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status */}
      {offline.syncInProgress && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white p-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm">Syncing changes...</span>
          </div>
        </div>
      )}

      {/* Pending Changes Indicator */}
      {offline.pendingChanges > 0 && !offline.syncInProgress && (
        <div className="fixed bottom-4 left-4 z-50 bg-yellow-600 text-white p-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">
              {offline.pendingChanges} change{offline.pendingChanges !== 1 ? 's' : ''} pending sync
            </span>
          </div>
        </div>
      )}

      {/* Service Worker Status (Development) */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-40 bg-gray-800 text-white p-2 rounded text-xs opacity-75">
          <div>SW: {isSupported ? (isRegistered ? '✓' : '✗') : 'Not Supported'}</div>
          <div>Network: {isOffline ? 'Offline' : 'Online'}</div>
          <div>Cache: {offline.pendingChanges} pending</div>
          {isSupported && (
            <button
              onClick={handleClearCache}
              className="mt-1 text-blue-300 hover:text-blue-100 underline"
            >
              Clear Cache
            </button>
          )}
        </div>
      )}
    </>
  );
};

// Cache Status Component
export const CacheStatus: React.FC = () => {
  const { cache } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed top-4 left-4 z-40">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-gray-800 text-white p-2 rounded text-xs opacity-75 hover:opacity-100"
      >
        Cache Info
      </button>
      
      {isVisible && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800 text-white p-3 rounded text-xs min-w-48">
          <div className="space-y-1">
            <div>Entries: {cache.metadata.entryCount}</div>
            <div>Size: {formatBytes(cache.metadata.totalSize)}</div>
            <div>Hit Rate: {(cache.metadata.hitRate * 100).toFixed(1)}%</div>
            <div>Last Cleanup: {new Date(cache.metadata.lastCleanup).toLocaleTimeString()}</div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-600">
            <button
              onClick={() => useAppStore.getState().clearExpiredCache()}
              className="text-blue-300 hover:text-blue-100 underline mr-2"
            >
              Clean Expired
            </button>
            <button
              onClick={() => useAppStore.getState().clearAllCache()}
              className="text-red-300 hover:text-red-100 underline"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}