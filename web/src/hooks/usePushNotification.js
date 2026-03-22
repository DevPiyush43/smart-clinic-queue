import { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const usePushNotification = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast.error('Push notifications not supported on this browser.');
      return false;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        toast.error('Notification permission denied.');
        return false;
      }

      if (!VAPID_PUBLIC_KEY) {
        toast.success('Notifications enabled ✓ (dev mode)');
        setIsSubscribed(true);
        return true;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await api.post('/auth/register-web-push', { subscription });
      toast.success('Push notifications enabled ✓');
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscription error:', err);
      toast.error('Failed to enable push notifications.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSubscribed, isLoading, subscribeToPush };
};

export default usePushNotification;
