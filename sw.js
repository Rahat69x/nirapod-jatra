/**
 * sw.js - Service Worker for Nirapod Jatra (নিরাপদ যাত্রা) PWA
 * Caches app shell, deterministic fare engine, MRT-6 data, and fonts for offline commute
 */

const CACHE_NAME = 'nirapod-jatra-v1.2.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './fare_engine.js',
  './manifest.json',
  './favicon.ico',
  './favicon.svg',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline app shell & transit data');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache item failed, continuing anyway:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // For external dynamic APIs (OSRM router, Open-Meteo), try network first then fallback
  if (url.hostname.includes('project-osrm.org') || url.hostname.includes('open-meteo.com')) {
    event.respondWith(
      fetch(req).catch(() => {
        // Return 503 or empty json so client-side fallback handles it smoothly
        return new Response(JSON.stringify({ error: 'offline_mode' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Cache-first strategy for local assets and CDN resources
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback to index.html if navigating
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
