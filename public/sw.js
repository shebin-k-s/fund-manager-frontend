self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json();
  } catch (e) {
    data = {
      title: 'Velo',
      body: event.data?.text() || 'New notification',
      url: '/'
    };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Velo', {
      body: data.body || 'You have a new notification',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'velo-notification',
      vibrate: [300, 200, 300],
      renotify: true,
      requireInteraction: true,
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('📌 Notification clicked');
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification closed');
});