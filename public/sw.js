// Service Worker for Krushi Sathi
// Provides offline functionality and caching

const CACHE_NAME = 'krushi-sathi-v1';
const STATIC_CACHE = 'krushi-static-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/placeholder.svg'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching static files');
      return cache.addAll(STATIC_FILES);
    }).catch(err => {
      console.error('Service Worker: Failed to cache static files', err);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response;
      }

      // For API requests, try network first, then provide fallback
      if (event.request.url.includes('/api/')) {
        return fetch(event.request).catch(() => {
          // Provide offline fallback for API requests
          if (event.request.url.includes('/api/advisory')) {
            return new Response(JSON.stringify({
              title: 'Offline Advisory',
              text: 'You are currently offline. Please check your internet connection and try again for AI-powered advice.',
              steps: [
                'Check your internet connection',
                'Retry when online for AI analysis',
                'Use basic farming practices in the meantime',
                'Save your question to ask later'
              ],
              lang: 'en',
              source: 'offline'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          if (event.request.url.includes('/api/updates')) {
            return new Response(JSON.stringify({
              weather: {
                temperatureC: null,
                windKph: null,
                description: 'Weather unavailable offline'
              },
              market: [
                { crop: 'Tomato', pricePerKgInr: 'N/A' },
                { crop: 'Onion', pricePerKgInr: 'N/A' }
              ],
              schemes: [
                { title: 'Government Schemes', status: 'Check online for updates' }
              ]
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          return new Response('Offline', { status: 503 });
        });
      }

      // For other requests, try network and cache successful responses
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If request fails, show offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/') || new Response('Offline', { status: 503 });
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for saving advisories when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'save-advisory') {
    console.log('Service Worker: Background sync - save advisory');
    // Implementation would sync saved data when back online
  }
});

// Push notification support
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'krushi-notification',
    actions: [
      {
        action: 'view',
        title: 'View Details'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});