// src/utils/offlineQueue.js
// ─── Offline-First Queue System ───────────────────────────────────────────────
// Stores messages/symptoms locally when offline, auto-syncs when back online
// UPDATED: voice sync handler now uploads audio to Cloudinary before Firestore

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const QUEUE_KEY = 'helixa_offline_queue';

const CLOUDINARY_CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

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

// ── Cloudinary audio upload helper ───────────────────────────────────────────
const uploadAudioToCloudinary = async (audioBase64) => {
  if (!audioBase64) return null;

  let blob;
  if (audioBase64.startsWith('data:')) {
    const res  = await fetch(audioBase64);
    blob       = await res.blob();
  } else if (audioBase64.startsWith('blob:')) {
    const res  = await fetch(audioBase64);
    blob       = await res.blob();
  } else {
    const bytes = atob(audioBase64);
    const arr   = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    blob = new Blob([arr], { type: 'audio/webm' });
  }

  const formData = new FormData();
  formData.append('file',           blob, 'voice.webm');
  formData.append('upload_preset',  CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder',         'voice_messages');
  formData.append('resource_type',  'video');

  const res  = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const data = await res.json();
  return data.secure_url;
};

// ── Sync handlers per type ────────────────────────────────────────────────────
const syncHandlers = {
  message: async (data) => {
    await addDoc(collection(db, 'conversations', data.convId, 'messages'), {
      senderId:      data.senderId,
      senderName:    data.senderName,
      text:          data.text,
      type:          data.msgType || 'text',
      audioBase64:   data.audioBase64   || null,
      audioDuration: data.audioDuration || null,
      videoUrl:      data.videoUrl      || null,
      videoDuration: data.videoDuration || null,
      createdAt:     serverTimestamp(),
      syncedAt:      serverTimestamp(),
      status:        'sent',
    });
  },

  voice: async (data) => {
    let audioUrl = data.audioBase64 || null;

    if (audioUrl) {
      try {
        audioUrl = await uploadAudioToCloudinary(audioUrl);
      } catch (err) {
        console.warn('[offlineQueue] Cloudinary audio upload failed, storing base64 fallback:', err);
      }
    }

    await addDoc(collection(db, 'conversations', data.convId, 'messages'), {
      senderId:      data.senderId,
      senderName:    data.senderName,
      text:          '🎤 Voice message',
      type:          'voice',
      audioBase64:   audioUrl,
      audioDuration: data.audioDuration || null,
      createdAt:     serverTimestamp(),
      syncedAt:      serverTimestamp(),
      status:        'sent',
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
      } else {
        console.warn(`[offlineQueue] No handler for type "${item.type}" — discarding.`);
        removeFromQueue(item.id);
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
    console.log('[Helixa] Back online — syncing queue…');
    await syncQueue();
  });
};