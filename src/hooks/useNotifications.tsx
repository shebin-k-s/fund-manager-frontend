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
    console.log('🔧 Setting up service worker message listener...');
    
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker not supported');
      return;
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, title, body, url } = event.data;
      console.log('📨 Message received from service worker:', { type, title, body });
      
      if (type === 'PUSH_NOTIFICATION') {
        console.log('🎯 Processing PUSH_NOTIFICATION');
        
        // Play sound for urgency
        const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
        audio.play().catch(() => {});
        
        // Show aggressive toast alert
        toast.custom((t) => (
          <div className="fixed top-4 left-4 right-4 z-[9999] w-auto bg-red-500 text-white p-6 rounded-lg shadow-2xl border-2 border-red-700 animate-bounce">
            <div className="font-bold text-xl mb-3">🔔 {title}</div>
            <div className="text-base whitespace-pre-wrap">{body}</div>
          </div>
        ));
        
        // Also show browser alert for absolute visibility on mobile
        setTimeout(() => {
          console.log('💬 Showing browser alert');
          alert(`${title}\n\n${body}`);
        }, 200);
      }
    };

    console.log('📌 Adding message event listener to service worker controller...');
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    console.log('✅ Message listener registered');
    
    return () => {
      console.log('🧹 Removing message listener');
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

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
