import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success("Notifications enabled!");
      } else if (result === 'denied') {
        toast.error("Notifications were denied. Please enable them in your browser settings.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  }, []);

  // Listen for push messages from service worker (for mobile foreground notifications)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, title, body, url } = event.data;
      
      if (type === 'PUSH_NOTIFICATION') {
        console.log('📲 Received push message in foreground:', { title, body });
        
        // Show visual toast alert on mobile when app is in foreground
        toast.custom((t) => (
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg border-l-4 border-blue-500">
            <div className="font-bold text-lg mb-2">{title}</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{body}</div>
          </div>
        ));
        
        // Also try to show a standard notification if possible
        if (permission === 'granted') {
          setTimeout(() => {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, {
                body: body,
                icon: '/logo.png',
                badge: '/logo.png',
                tag: 'foreground-' + Date.now(),
                vibrate: [300, 200, 300],
                requireInteraction: true,
                renotify: true,
              });
            });
          }, 100);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [permission]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          ...options,
        } as any);
      });
    } else {
      // Fallback to basic Notification API
      new Notification(title, {
        icon: '/logo.png',
        ...options,
      });
    }
  }, [permission]);

  const checkAndNotifyDues = useCallback((dues: Array<{ id: string, name: string, date: Date, type: 'card' | 'fund' }>) => {
    // ... existing logic
  }, [permission, sendNotification]);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = useCallback(async () => {
    console.info("Attempting to subscribe to push...");
    if (permission !== 'granted') {
      console.warn("Permission not granted, skipping push subscription.");
      return;
    }
    if (!('serviceWorker' in navigator)) {
      console.warn("Service Worker not supported in this browser.");
      return;
    }

    try {
      console.info("Waiting for Service Worker to be ready...");
      const registration = await navigator.serviceWorker.ready;
      console.info("Service Worker ready.");
      
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        console.error("VAPID public key missing in .env (VITE_VAPID_PUBLIC_KEY)");
        return;
      }
      console.info("Found VAPID public key.");

      console.info("Requesting push subscription from browser...");
      
      // Clear existing subscription first (fixes many "push service errors")
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        console.info("Found existing subscription, clearing it first...");
        await existingSub.unsubscribe();
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
      console.info("Push subscription object generated:", subscription);

      console.info("Sending subscription to backend...");
      const response = await apiClient.post('/notifications/subscribe', subscription);
      console.info("Backend response:", response.data);
      console.log("Push subscription successful! 🎉");
      toast.success("Push notifications registered!");
    } catch (error: any) {
      console.error("Error subscribing to push:", error);
      toast.error(`Push Error: ${error.message || 'Unknown error'}`);
    }
  }, [permission]);

  const triggerPush = useCallback(async () => {
    try {
      toast.info("Triggering push notifications...");
      await apiClient.post('/notifications/trigger');
      toast.success("Push notifications triggered successfully");
    } catch (error: any) {
      console.error("Error triggering push:", error);
      toast.error(`Fail to trigger: ${error.message || 'Unknown error'}`);
    }
  }, []);

  useEffect(() => {
    if (permission === 'granted') {
      console.info("Permission is granted, triggering subscribeToPush...");
      subscribeToPush();
    }
  }, [permission, subscribeToPush]);

  return { 
    permission, 
    requestPermission, 
    sendNotification,
    checkAndNotifyDues,
    subscribeToPush,
    triggerPush
  };
}
