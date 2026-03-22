// src/hooks/useOffline.js
// Tracks online/offline status + queue count reactively

import { useState, useEffect } from 'react';
import { getQueueCount, syncQueue } from '../utils/offlineQueue';

export const useOffline = () => {
  const [isOffline,   setIsOffline]   = useState(!navigator.onLine);
  const [queueCount,  setQueueCount]  = useState(getQueueCount());
  const [syncing,     setSyncing]     = useState(false);
  const [lastSynced,  setLastSynced]  = useState(null);
  const [showToast,   setShowToast]   = useState(false);
  const [toastSyncing,setToastSyncing]= useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = async () => {
      setIsOffline(false);
      const count = getQueueCount();
      if (count > 0) {
        // Show "Connection restored. Syncing..." toast
        setToastSyncing(true);
        setShowToast(true);
        setSyncing(true);
        await syncQueue();
        setSyncing(false);
        setLastSynced(new Date());
        setQueueCount(getQueueCount());
        // Switch to "All messages delivered" toast
        setToastSyncing(false);
        setTimeout(() => setShowToast(false), 2500);
      }
    };

    const onQueueUpdate = (e) => setQueueCount(e.detail.count);
    const onSyncComplete = () => {
      setQueueCount(getQueueCount());
      setSyncing(false);
      setLastSynced(new Date());
    };

    window.addEventListener('offline',               goOffline);
    window.addEventListener('online',                goOnline);
    window.addEventListener('helixa:queue-updated',  onQueueUpdate);
    window.addEventListener('helixa:sync-complete',  onSyncComplete);

    return () => {
      window.removeEventListener('offline',               goOffline);
      window.removeEventListener('online',                goOnline);
      window.removeEventListener('helixa:queue-updated',  onQueueUpdate);
      window.removeEventListener('helixa:sync-complete',  onSyncComplete);
    };
  }, []);

  const retrySync = async () => {
    if (isOffline) return;
    setSyncing(true);
    await syncQueue();
    setSyncing(false);
    setLastSynced(new Date());
    setQueueCount(getQueueCount());
  };

  return { isOffline, queueCount, syncing, lastSynced, retrySync, showToast, toastSyncing };
};