self.addEventListener('push', (event) => {
  console.log('🔔 Push event received:', event);
  
  let data = {};
  try {
    data = event.data?.json();
    console.log('✅ Parsed JSON data:', data);
  } catch (e) {
    console.log('⚠️ Failed to parse JSON, using text:', e);
    data = {
      title: 'Velo',
      body: event.data?.text() || 'New notification',
      url: '/'
    };
  }

  const notificationOptions = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: 'velo-' + Date.now(),
    vibrate: [300, 200, 300],
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: { url: data.url || '/' },
  };

  console.log('📢 Showing notification with options:', notificationOptions);

  // Send push message to ALL clients immediately (highest priority)
  const notifyClientsPromise = self.clients.matchAll({ 
    type: 'window',
    includeUncontrolled: true 
  }).then((clients) => {
    console.log(`📱 Found ${clients.length} open window(s)`);
    const promises = clients.map((client) => {
      console.log('💬 Sending PUSH_NOTIFICATION message to:', client.url);
      return client.postMessage({
        type: 'PUSH_NOTIFICATION',
        title: data.title || 'Velo',
        body: data.body || 'You have a new notification',
        url: data.url || '/'
      }).catch(err => console.error('❌ Failed to send message:', err));
    });
    return Promise.all(promises);
  }).catch(err => console.error('❌ Failed to match clients:', err));

  event.waitUntil(
    notifyClientsPromise
      .then(() => self.registration.showNotification(data.title || 'Velo', notificationOptions))
      .then(() => console.log('✅ Notification shown successfully'))
      .catch((err) => console.error('❌ Failed to show notification:', err))
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