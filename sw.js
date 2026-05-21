/**
 * Service Worker — מעקב תזונה ערן
 * Cache-first strategy for full offline support
 */

const CACHE_NAME = 'eran-nutrition-v1';
const ASSETS = [
  './eran-nutrition-tracker.html',
  './manifest.json',
  './sw.js',
  './icon.svg',
];

// ── Install: cache all static assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first, fallback to network ────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests (skip Sheets API calls)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache, but update in background (stale-while-revalidate)
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, networkResponse.clone())
            );
          }
          return networkResponse;
        }).catch(() => {/* offline — already served from cache */});

        return cachedResponse;
      }

      // Not in cache — try network
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) =>
          cache.put(event.request, responseClone)
        );
        return response;
      });
    })
  );
});
