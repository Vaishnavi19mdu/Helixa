// src/utils/offlineQueue.js
// ─── Offline-First Queue System ───────────────────────────────────────────────
// Stores messages/symptoms locally when offline, auto-syncs when back online

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const QUEUE_KEY = 'helixa_offline_queue';

// ── Queue CRUD ────────────────────────────────────────────────────────────────
export const getQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveQueue = (queue) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const addToQueue = (type, data, priority = 'normal') => {
  const queue = getQueue();
  const item = {
    id:        `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,      // 'message' | 'symptom' | 'voice'
    data,
    priority,  // 'urgent' | 'normal'
    status:    'queued',
    timestamp: Date.now(),
    retries:   0,
  };
  // urgent items go first
  if (priority === 'urgent') {
    queue.unshift(item);
  } else {
    queue.push(item);
  }
  saveQueue(queue);
  window.dispatchEvent(new CustomEvent('helixa:queue-updated', { detail: { count: queue.length } }));
  return item.id;
};

export const removeFromQueue = (id) => {
  const queue = getQueue().filter(item => item.id !== id);
  saveQueue(queue);
  window.dispatchEvent(new CustomEvent('helixa:queue-updated', { detail: { count: queue.length } }));
};

export const updateQueueItem = (id, updates) => {
  const queue = getQueue().map(item => item.id === id ? { ...item, ...updates } : item);
  saveQueue(queue);
};

export const getQueueCount = () => getQueue().length;

// ── Sync handlers per type ────────────────────────────────────────────────────
const syncHandlers = {
  message: async (data) => {
    await addDoc(collection(db, 'conversations', data.convId, 'messages'), {
      senderId:   data.senderId,
      senderName: data.senderName,
      text:       data.text,
      type:       data.msgType || 'text',
      audioBase64:data.audioBase64 || null,
      audioDuration: data.audioDuration || null,
      createdAt:  serverTimestamp(),
      syncedAt:   serverTimestamp(),
    });
  },

  symptom: async (data) => {
    await addDoc(collection(db, 'users', data.userId, 'symptomHistory'), {
      symptoms:  data.symptoms,
      result:    data.result,
      createdAt: serverTimestamp(),
      syncedAt:  serverTimestamp(),
    });
  },
};

// ── Auto sync ─────────────────────────────────────────────────────────────────
export const syncQueue = async () => {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      updateQueueItem(item.id, { status: 'syncing' });
      const handler = syncHandlers[item.type];
      if (handler) {
        await handler(item.data);
        removeFromQueue(item.id);
        synced++;
        window.dispatchEvent(new CustomEvent('helixa:item-synced', { detail: { id: item.id } }));
      }
    } catch (err) {
      console.error(`Failed to sync item ${item.id}:`, err);
      updateQueueItem(item.id, { status: 'failed', retries: (item.retries || 0) + 1 });
      failed++;
    }
  }

  window.dispatchEvent(new CustomEvent('helixa:sync-complete', { detail: { synced, failed } }));
  return { synced, failed };
};

// ── Register online listener ──────────────────────────────────────────────────
export const initOfflineSync = () => {
  window.addEventListener('online', async () => {
    console.log('[Helixa] Back online — syncing queue...');
    await syncQueue();
  });
};