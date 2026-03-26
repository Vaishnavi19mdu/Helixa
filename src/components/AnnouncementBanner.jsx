// src/components/AnnouncementBanner.jsx
// Listens to Firestore 'announcements' collection in real-time
// and shows a dismissable banner for active/pinned announcements
// OFFLINE: last-fetched announcements are cached in localStorage and shown offline

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pin, AlertTriangle, Info, Wrench, Zap } from 'lucide-react';

const CACHE_KEY = 'helixa_announcements_cache';
const DISMISSED_KEY = 'helixa_dismissed_announcements';

// ── Type config ───────────────────────────────────────────────────────────────
const typeConfig = {
  info: {
    bg:     'bg-blue-50 border-blue-200',
    text:   'text-blue-800',
    sub:    'text-blue-600',
    icon:   Info,
    iconCl: 'text-blue-500',
    badge:  'bg-blue-100 text-blue-700',
  },
  alert: {
    bg:     'bg-red-50 border-red-200',
    text:   'text-red-800',
    sub:    'text-red-500',
    icon:   AlertTriangle,
    iconCl: 'text-red-500',
    badge:  'bg-red-100 text-red-700',
  },
  update: {
    bg:     'bg-helixa-green/5 border-helixa-green/30',
    text:   'text-helixa-teal',
    sub:    'text-helixa-green',
    icon:   Zap,
    iconCl: 'text-helixa-green',
    badge:  'bg-helixa-green/10 text-helixa-green',
  },
  maintenance: {
    bg:     'bg-amber-50 border-amber-200',
    text:   'text-amber-800',
    sub:    'text-amber-600',
    icon:   Wrench,
    iconCl: 'text-amber-500',
    badge:  'bg-amber-100 text-amber-700',
  },
};

// ── Cache helpers ─────────────────────────────────────────────────────────────
const readCache = () => {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); }
  catch { return []; }
};

const writeCache = (items) => {
  // Firestore Timestamps aren't JSON-safe — convert to millis before storing
  const serialisable = items.map(a => ({
    ...a,
    createdAt: a.createdAt?.toMillis?.() ?? a.createdAt ?? null,
  }));
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(serialisable)); }
  catch {}
};

const readDismissed = () => {
  try { return new Set(JSON.parse(sessionStorage.getItem(DISMISSED_KEY) || '[]')); }
  catch { return new Set(); }
};

// ── Single Banner ─────────────────────────────────────────────────────────────
const SingleBanner = ({ announcement, onDismiss }) => {
  const cfg = typeConfig[announcement.type] || typeConfig.info;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className={`relative flex items-start gap-4 px-5 py-4 rounded-2xl border ${cfg.bg}`}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <Icon size={18} className={cfg.iconCl} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {announcement.pinned && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.badge}`}>
              <Pin size={8} /> Pinned
            </span>
          )}
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.badge}`}>
            {announcement.type}
          </span>
          {/* Show a subtle "cached" indicator when offline */}
          {!navigator.onLine && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              cached
            </span>
          )}
        </div>
        <p className={`text-sm font-black ${cfg.text}`}>{announcement.title}</p>
        <p className={`text-xs font-medium leading-relaxed mt-0.5 ${cfg.sub}`}>{announcement.body}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(announcement.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors mt-0.5"
        aria-label="Dismiss announcement"
      >
        <X size={15} className={cfg.iconCl} />
      </button>
    </motion.div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const AnnouncementBanner = () => {
  // Seed from cache immediately so banners show instantly (even offline)
  const [announcements, setAnnouncements] = useState(readCache);
  const [dismissed, setDismissed]         = useState(readDismissed);

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true),
      orderBy('pinned', 'desc'),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(q, snap => {
      const fresh = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnnouncements(fresh);
      writeCache(fresh); // keep cache up to date for next offline visit
    });

    return () => unsub();
  }, []);

  const handleDismiss = (id) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <AnimatePresence mode="popLayout">
        {visible.map(a => (
          <SingleBanner key={a.id} announcement={a} onDismiss={handleDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};