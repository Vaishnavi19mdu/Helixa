// src/components/NotificationsPanel.jsx
// Real-time notifications from Firestore
// Structure: notifications/{userId}/items/{notifId}
// → { title, message, type, read, createdAt }

import React, { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  updateDoc, deleteDoc, doc, writeBatch
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, X, Check, Trash2, BellOff,
  Activity, Calendar, MessageSquare, AlertTriangle, Info
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (ts) => {
  if (!ts) return '';
  const d   = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)   return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const typeConfig = {
  message:     { icon: MessageSquare, color: 'text-helixa-teal',  bg: 'bg-helixa-teal/10'  },
  appointment: { icon: Calendar,      color: 'text-helixa-green', bg: 'bg-helixa-green/10' },
  alert:       { icon: AlertTriangle, color: 'text-red-500',      bg: 'bg-red-50'          },
  result:      { icon: Activity,      color: 'text-amber-500',    bg: 'bg-amber-50'        },
  info:        { icon: Info,          color: 'text-blue-500',     bg: 'bg-blue-50'         },
};

// ── Hook: get unread notification count ───────────────────────────────────────
export const useNotificationCount = (userId) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'notifications', userId, 'items'));
    const unsub = onSnapshot(q, snap => {
      setCount(snap.docs.filter(d => !d.data().read).length);
    });
    return () => unsub();
  }, [userId]);

  return count;
};

// ── Panel ─────────────────────────────────────────────────────────────────────
export const NotificationsPanel = ({ user, onClose }) => {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'notifications', user.id, 'items'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user?.id]);

  const markRead = async (notifId) => {
    await updateDoc(doc(db, 'notifications', user.id, 'items', notifId), { read: true });
  };

  const deleteNotif = async (notifId) => {
    await deleteDoc(doc(db, 'notifications', user.id, 'items', notifId));
  };

  const markAllRead = async () => {
    const batch = writeBatch(db);
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', user.id, 'items', n.id), { read: true });
    });
    await batch.commit();
  };

  const clearAll = async () => {
    const batch = writeBatch(db);
    notifs.forEach(n => {
      batch.delete(doc(db, 'notifications', user.id, 'items', n.id));
    });
    await batch.commit();
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border-color)] flex-shrink-0">
        <div>
          <h3 className="font-black text-lg text-[var(--text-primary)]">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-[var(--text-secondary)] font-bold">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-black text-helixa-green hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              <Check size={12} /> Mark all read
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs font-black text-helixa-alert hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              <Trash2 size={12} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-helixa-green/30 border-t-helixa-green rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-4 px-6 py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center">
              <BellOff size={28} className="text-[var(--text-secondary)]" />
            </div>
            <p className="font-black text-[var(--text-primary)] text-center">You're all caught up!</p>
            <p className="text-xs text-[var(--text-secondary)] text-center leading-relaxed">
              No notifications right now. We'll let you know when something comes up.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {notifs.map(notif => {
              const cfg = typeConfig[notif.type] || typeConfig.info;
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-3 px-5 py-4 border-b border-[var(--border-color)] group transition-colors ${
                    notif.read ? 'opacity-60' : 'bg-[var(--bg-secondary)]'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                    <Icon size={16} className={cfg.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-grow min-w-0" onClick={() => !notif.read && markRead(notif.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${notif.read ? 'font-medium text-[var(--text-secondary)]' : 'font-black text-[var(--text-primary)]'}`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-helixa-green rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1.5">
                      {formatTime(notif.createdAt)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteNotif(notif.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-helixa-alert flex-shrink-0"
                  >
                    <X size={14} className="text-[var(--text-secondary)]" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};