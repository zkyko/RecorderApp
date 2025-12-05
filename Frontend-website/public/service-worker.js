// Service worker that immediately unregisters itself
// This prevents 404 errors when the browser tries to fetch service-worker.js

self.addEventListener('install', () => {
  // Skip waiting and activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Unregister this service worker
  event.waitUntil(
    self.registration.unregister().then(() => {
      // Clear all caches
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      });
    })
  );
});

// Don't handle any fetch events - just unregister
self.addEventListener('fetch', () => {
  // Do nothing
});

