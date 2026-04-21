self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json();
  } catch (e) {
    data = {
      title: 'New Notification',
      body: event.data?.text() || '',
      url: '/'
    };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', {
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