// ============================================================
//  Velo PWA Service Worker
//  – Caches the app shell so it works fully offline
//  – Handles push notifications
// ============================================================

const CACHE_NAME = 'velo-cache-v1';

// ---- Install: pre-cache the app shell ----------------------
self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        '/',
        '/index.html',
        '/logo.png',
        '/manifest.webmanifest',
      ])
    )
  );
});

// ---- Activate: remove old caches ---------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ---- Fetch: network-first for API, cache-first for assets --
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Let API requests go to the network only (no cache)
  if (url.pathname.startsWith('/api')) {
    return; // default browser behaviour
  }

  // Navigation requests (HTML pages) – network-first, fallback to /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() =>
          caches.match('/index.html').then((cached) => {
            if (cached) return cached;
            return new Response('<h1>You are offline</h1>', {
              headers: { 'Content-Type': 'text/html' },
            });
          })
        )
    );
    return;
  }

  // Static assets – cache-first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful, same-origin, non-range responses
        if (
          !response ||
          response.status !== 200 ||
          response.type === 'opaque'
        ) {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});

// ---- Push Notifications ------------------------------------
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json();
  } catch (e) {
    data = {
      title: 'Velo',
      body: event.data?.text() || '',
      url: '/'
    };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Velo', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});