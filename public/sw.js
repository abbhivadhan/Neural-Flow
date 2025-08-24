// Neural Flow Service Worker
// Implements offline-first architecture with intelligent caching

const CACHE_NAME = 'neural-flow-v1';
const STATIC_CACHE = 'neural-flow-static-v1';
const DYNAMIC_CACHE = 'neural-flow-dynamic-v1';
const API_CACHE = 'neural-flow-api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  // Add other static assets as needed
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/tasks',
  '/api/projects',
  '/api/user/preferences',
  '/api/analytics/metrics',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE),
      caches.open(API_CACHE),
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== API_CACHE
          ) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with fallback to cache
    event.respondWith(handleAPIRequest(request));
  } else if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    // Static assets - Cache First
    event.respondWith(handleStaticRequest(request));
  } else {
    // Dynamic content - Stale While Revalidate
    event.respondWith(handleDynamicRequest(request));
  }
});

// Handle API requests with Network First strategy
async function handleAPIRequest(request) {
  const cacheName = API_CACHE;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      
      // Add timestamp for cache invalidation
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...networkResponse.headers,
          'sw-cache-timestamp': Date.now().toString(),
        },
      });
      
      return responseWithTimestamp;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Network failed, try cache
    console.log('Service Worker: Network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to cached responses
      const offlineResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: {
          ...cachedResponse.headers,
          'sw-offline': 'true',
        },
      });
      
      return offlineResponse;
    }
    
    // Return offline fallback
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This request is not available offline',
        offline: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle static requests with Cache First strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Handle dynamic requests with Stale While Revalidate strategy
async function handleDynamicRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    networkResponsePromise.catch(() => {
      // Ignore network errors when we have cached content
    });
    
    return cachedResponse;
  }
  
  // No cached version, wait for network
  try {
    return await networkResponsePromise;
  } catch (error) {
    // Network failed and no cache available
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncOfflineOperations());
  }
});

// Sync offline operations when network is available
async function syncOfflineOperations() {
  try {
    // Get pending operations from IndexedDB or send message to main thread
    const clients = await self.clients.matchAll();
    
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_OPERATIONS',
        timestamp: Date.now(),
      });
    });
  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: 'You have new updates in Neural Flow',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-192x192.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png',
      },
    ],
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('Neural Flow', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_INVALIDATE':
      invalidateCache(payload.pattern);
      break;
      
    case 'CACHE_CLEAR':
      clearCache(payload.cacheName);
      break;
      
    default:
      console.log('Service Worker: Unknown message type:', type);
  }
});

// Invalidate cache entries matching a pattern
async function invalidateCache(pattern) {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes(pattern)) {
        await cache.delete(request);
        console.log('Service Worker: Invalidated cache for:', request.url);
      }
    }
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
    console.log('Service Worker: Cleared cache:', cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('Service Worker: Cleared all caches');
  }
}

// Periodic cache cleanup
setInterval(async () => {
  console.log('Service Worker: Running periodic cache cleanup');
  
  const cache = await caches.open(API_CACHE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    const response = await cache.match(request);
    const timestamp = response.headers.get('sw-cache-timestamp');
    
    if (timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const maxAge = 30 * 60 * 1000; // 30 minutes
      
      if (age > maxAge) {
        await cache.delete(request);
        console.log('Service Worker: Cleaned up expired cache for:', request.url);
      }
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes