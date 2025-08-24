import { useEffect, useState } from 'react';
import { useAppStore } from '../store';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface ServiceWorkerActions {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  skipWaiting: () => void;
  invalidateCache: (pattern: string) => void;
  clearCache: (cacheName?: string) => void;
}

export function useServiceWorker(): ServiceWorkerState & ServiceWorkerActions {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    isOffline: !navigator.onLine,
    registration: null,
  });

  const { setOfflineStatus } = useAppStore();

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      setOfflineStatus(false);
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
      setOfflineStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Auto-register service worker in production
    if (state.isSupported && import.meta.env.PROD) {
      register();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus, state.isSupported]);

  const register = async (): Promise<void> => {
    if (!state.isSupported) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration,
      }));

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

      // Check if there's already a waiting service worker
      if (registration.waiting) {
        setState(prev => ({ ...prev, isUpdateAvailable: true }));
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const unregister = async (): Promise<void> => {
    if (!state.registration) return;

    try {
      const result = await state.registration.unregister();
      if (result) {
        setState(prev => ({
          ...prev,
          isRegistered: false,
          registration: null,
        }));
        console.log('Service Worker unregistered');
      }
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  };

  const update = async (): Promise<void> => {
    if (!state.registration) return;

    try {
      await state.registration.update();
      console.log('Service Worker update check completed');
    } catch (error) {
      console.error('Service Worker update failed:', error);
    }
  };

  const skipWaiting = (): void => {
    if (!state.registration?.waiting) return;

    // Send message to service worker to skip waiting
    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload page after service worker takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  };

  const invalidateCache = (pattern: string): void => {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_INVALIDATE',
      payload: { pattern },
    });
  };

  const clearCache = (cacheName?: string): void => {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_CLEAR',
      payload: { cacheName },
    });
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, payload } = event.data;

    switch (type) {
      case 'SYNC_OPERATIONS':
        // Trigger sync of offline operations
        useAppStore.getState().processSyncQueue();
        break;

      case 'CACHE_UPDATED':
        console.log('Cache updated:', payload);
        break;

      case 'OFFLINE_READY':
        console.log('App is ready to work offline');
        break;

      default:
        console.log('Unknown service worker message:', type, payload);
    }
  };

  return {
    ...state,
    register,
    unregister,
    update,
    skipWaiting,
    invalidateCache,
    clearCache,
  };
}

// Hook for background sync
export function useBackgroundSync() {
  const { processSyncQueue } = useAppStore();

  useEffect(() => {
    // Register for background sync when supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Register background sync
        return registration.sync.register('sync-operations');
      }).catch((error) => {
        console.error('Background sync registration failed:', error);
      });
    }

    // Fallback: sync when coming back online
    const handleOnline = () => {
      processSyncQueue();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [processSyncQueue]);
}

// Hook for push notifications
export function usePushNotifications() {
  const [isSupported] = useState('Notification' in window && 'serviceWorker' in navigator);
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : 'denied'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    // Get existing subscription
    navigator.serviceWorker.ready.then((registration) => {
      return registration.pushManager.getSubscription();
    }).then((sub) => {
      setSubscription(sub);
    });
  }, [isSupported]);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Notification permission request failed:', error);
      return false;
    }
  };

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          // Replace with your VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9LdNnC_NNPJ6Ck96SUBBj1Vz-yjSHPAKBqhfXpbWfqwRiZiXOVcE'
        ),
      });

      setSubscription(sub);
      
      // Send subscription to server
      await sendSubscriptionToServer(sub);
      
      return sub;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const result = await subscription.unsubscribe();
      if (result) {
        setSubscription(null);
        // Remove subscription from server
        await removeSubscriptionFromServer(subscription);
      }
      return result;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  // In a real app, send this to your server
  console.log('Sending subscription to server:', subscription);
  
  try {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  } catch (error) {
    console.error('Failed to send subscription to server:', error);
  }
}

async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  // In a real app, remove this from your server
  console.log('Removing subscription from server:', subscription);
  
  try {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });
  } catch (error) {
    console.error('Failed to remove subscription from server:', error);
  }
}