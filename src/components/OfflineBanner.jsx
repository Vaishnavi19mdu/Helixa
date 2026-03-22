// src/components/OfflineBanner.jsx
// Shows offline status, queue count, sync progress, retry button

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, CloudOff, RotateCcw, CheckCircle2, Clock, Zap } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

// ── Full banner (used in Checker and Messaging) ───────────────────────────────
export const OfflineBanner = () => {
  const { isOffline, queueCount, syncing, lastSynced, retrySync } = useOffline();

  // Only show if offline OR there are queued items
  if (!isOffline && queueCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold mb-4 ${
          isOffline
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : syncing
            ? 'bg-blue-50 border border-blue-200 text-blue-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isOffline ? (
            <WifiOff size={16} className="flex-shrink-0" />
          ) : syncing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <RotateCcw size={16} className="flex-shrink-0" />
            </motion.div>
          ) : (
            <CheckCircle2 size={16} className="flex-shrink-0" />
          )}
          <span>
            {isOffline
              ? queueCount > 0
                ? `You're offline — ${queueCount} item${queueCount !== 1 ? 's' : ''} saved locally, will sync when back online`
                : "You're offline — new entries will be saved locally"
              : syncing
              ? `Syncing ${queueCount} item${queueCount !== 1 ? 's' : ''}...`
              : `All synced${lastSynced ? ` · ${lastSynced.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}`
            }
          </span>
        </div>

        {!isOffline && queueCount > 0 && !syncing && (
          <button
            onClick={retrySync}
            className="text-xs font-black underline hover:opacity-70 transition-opacity ml-3 flex-shrink-0"
          >
            Retry
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ── Mini status dot for topbar ────────────────────────────────────────────────
export const OfflineStatusDot = () => {
  const { isOffline, queueCount, syncing } = useOffline();

  if (!isOffline && queueCount === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black"
      style={{
        background: isOffline ? '#FEF3C7' : '#EFF6FF',
        color: isOffline ? '#92400E' : '#1D4ED8',
      }}
    >
      {isOffline ? (
        <><WifiOff size={11} /> Offline</>
      ) : syncing ? (
        <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <RotateCcw size={11} />
        </motion.div> Syncing...</>
      ) : (
        <><Clock size={11} /> {queueCount} pending</>
      )}
    </motion.div>
  );
};

// ── Message status indicator (WhatsApp style) ─────────────────────────────────
export const MessageStatus = ({ status }) => {
  // status: 'queued' | 'sending' | 'sent' | 'seen'
  const map = {
    queued:  { icon: '☁️', label: 'Saved offline', color: 'text-amber-500' },
    sending: { icon: '⏳', label: 'Sending...',    color: 'text-blue-400'  },
    sent:    { icon: '✅', label: 'Sent',           color: 'text-helixa-green' },
    seen:    { icon: '👀', label: 'Seen',           color: 'text-helixa-teal'  },
  };
  const s = map[status] || map.sent;
  return (
    <span className={`text-[10px] font-bold ${s.color}`} title={s.label}>
      {s.icon}
    </span>
  );
};

// ── Sync Toast (connection restored moment) ───────────────────────────────────
export const SyncToast = ({ show, syncing, count }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        exit={{   opacity: 0, y: 40,  scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#1a1a2e] text-white rounded-2xl shadow-2xl border border-white/10 text-sm font-bold whitespace-nowrap"
      >
        {syncing ? (
          <>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
              <RotateCcw size={16} className="text-helixa-green" />
            </motion.div>
            Connection restored. Syncing {count} message{count !== 1 ? 's' : ''}…
          </>
        ) : (
          <>
            <CheckCircle2 size={16} className="text-helixa-green" />
            All messages delivered ✅
          </>
        )}
      </motion.div>
    )}
  </AnimatePresence>
);

// ── Priority badge ────────────────────────────────────────────────────────────
export const PriorityBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px] font-black">
    <Zap size={9} /> Priority Sync
  </span>
);

// ── Works offline label ───────────────────────────────────────────────────────
export const WorksOfflineLabel = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-1 text-[10px] font-black text-helixa-green/70 ${className}`}>
    <WifiOff size={9} /> Works even without internet
  </span>
);