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
      tag: 'velo-notification',
      renotify: true,
      requireInteraction: true,
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