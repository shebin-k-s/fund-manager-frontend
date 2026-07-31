// ============================================================
//  Velo PWA Service Worker
//  – Caches the app shell so it works fully offline
//  – Handles push notifications
// ============================================================

const CACHE_NAME = 'velo-cache-v1';
const API_BASE_URL = 'https://fund-manager-backend-1wb8.onrender.com/api/v1';

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
      badge: '/badge.svg',
      // Each chunk gets a distinct tag so a later chunk does not replace it.
      tag: data.tag,
      // Cron runs reuse the same chunk tags. Make an updated chunk alert the
      // user again instead of silently replacing yesterday's notification.
      renotify: Boolean(data.tag),
      // Supported desktop browsers keep each chunk visible until the user
      // interacts with it. Mobile platforms may choose to ignore this option.
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
    }).then(() => self.registration.pushManager.getSubscription()).then((subscription) => {
      // Real delivery confirmation — /trigger's "sent" count only means the
      // push service accepted the request, not that this device showed it.
      if (!subscription) return;
      return fetch(`${API_BASE_URL}/notifications/confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint, tag: data.tag }),
      }).catch(() => {}); // best-effort; a failed confirm shouldn't fail push handling
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// ---- Push subscription renewal ------------------------------
// Browsers can silently rotate/expire a push subscription in the
// background (independent of anything the page does). Without this,
// that leaves the server holding a dead endpoint until the user
// happens to reopen the app.
const VAPID_PUBLIC_KEY = 'BGdj8vtp8XO598GJ8HDwzt7IdQls4xvEoBYcj0eD3_vqkFMA-MtWuoEUwniGV5Lr50dOkUdzPMWIpG4siSWGIhk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const applicationServerKey = event.oldSubscription?.options?.applicationServerKey
        || urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      const newSubscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await fetch(`${API_BASE_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscription),
      });
    })()
  );
});
