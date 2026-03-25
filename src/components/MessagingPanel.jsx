// src/components/MessagingPanel.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, addDoc,
  updateDoc, doc, serverTimestamp, orderBy,
  getDocs,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Send, Search, Plus, ArrowLeft, Users,
  MessageSquare, Check, Mic, Play, Pause,
  Video, Phone, ExternalLink, Square, WifiOff,
  VideoOff, Signal, AlertTriangle, Upload, Camera,
  Calendar, Clock, ChevronDown,
} from 'lucide-react';
import { addToQueue } from '../utils/offlineQueue';
import { useOffline } from '../hooks/useOffline';
import { useNetworkQuality, NETWORK_TIERS } from '../hooks/useNetworkQuality';
import {
  OfflineBanner, MessageStatus, WorksOfflineLabel, PriorityBadge,
} from '../components/OfflineBanner';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)    return 'now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatDuration = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const formatScheduledTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
};

// ── Network Quality Badge ─────────────────────────────────────────────────────
const NetworkBadge = ({ tier, downlink, apiSupported }) => {
  const map = {
    [NETWORK_TIERS.STRONG]:   { color: 'text-helixa-green',  bg: 'bg-helixa-green/10',  label: 'Strong',   icon: <Signal size={10} /> },
    [NETWORK_TIERS.MODERATE]: { color: 'text-amber-600',     bg: 'bg-amber-50',          label: 'Moderate', icon: <Signal size={10} /> },
    [NETWORK_TIERS.WEAK]:     { color: 'text-red-500',       bg: 'bg-red-50',            label: 'Weak',     icon: <AlertTriangle size={10} /> },
    [NETWORK_TIERS.OFFLINE]:  { color: 'text-red-600',       bg: 'bg-red-100',           label: 'Offline',  icon: <WifiOff size={10} /> },
  };
  const { color, bg, label, icon } = map[tier] || map[NETWORK_TIERS.STRONG];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${color} ${bg}`}>
      {icon}
      {apiSupported ? `${label}${downlink !== undefined ? ` · ${downlink} Mbps` : ''}` : 'Unknown signal'}
    </span>
  );
};

// ── Schedule Call Modal ───────────────────────────────────────────────────────
const ScheduleCallModal = ({ onClose, onSchedule, network, defaultMode = 'video' }) => {
  const [mode,     setMode]     = useState(defaultMode);
  const [date,     setDate]     = useState('');
  const [time,     setTime]     = useState('');
  const [note,     setNote]     = useState('');

  useEffect(() => {
    const soon = new Date(Date.now() + 60 * 60 * 1000);
    const pad  = n => String(n).padStart(2, '0');
    setDate(`${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`);
    setTime(`${pad(soon.getHours())}:${pad(soon.getMinutes())}`);
  }, []);

  const handleSchedule = () => {
    if (!date || !time) return;
    onSchedule({ mode, scheduledAt: `${date}T${time}`, note: note.trim() });
    onClose();
  };

  const tierLabel = {
    [NETWORK_TIERS.WEAK]:     'Weak signal detected',
    [NETWORK_TIERS.MODERATE]: 'Moderate signal — call quality may be poor',
    [NETWORK_TIERS.OFFLINE]:  'You\'re offline',
  }[network.tier];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 bg-black/40 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-[var(--bg-primary)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-helixa-green" />
            <h3 className="font-black text-[var(--text-primary)]">Schedule a Call</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[var(--border-color)] transition-colors">
            <X size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {tierLabel && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
              network.tier === NETWORK_TIERS.OFFLINE
                ? 'bg-red-50 border border-red-100 text-red-600'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              <AlertTriangle size={12} className="flex-shrink-0" />
              {tierLabel} — schedule for when you have better signal
            </div>
          )}

          <div>
            <p className="text-xs font-black text-[var(--text-secondary)] mb-2">Call Type</p>
            <div className="grid grid-cols-2 gap-2">
              {['voice', 'video'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-black transition-all ${
                    mode === m
                      ? 'bg-helixa-green/10 border-helixa-green text-helixa-green'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {m === 'voice' ? <Phone size={14} /> : <Video size={14} />}
                  {m === 'voice' ? 'Voice' : 'Video'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[var(--text-secondary)] mb-1.5">
                <span className="flex items-center gap-1"><Calendar size={10} /> Date</span>
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[var(--text-secondary)] mb-1.5">
                <span className="flex items-center gap-1"><Clock size={10} /> Time</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[var(--text-secondary)] mb-1.5">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Move to an open area for better signal"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)]"
            />
          </div>

          <button
            onClick={handleSchedule}
            disabled={!date || !time}
            className="w-full py-3 bg-helixa-green text-white rounded-xl font-black text-sm disabled:opacity-40 hover:bg-helixa-green/90 transition-colors flex items-center justify-center gap-2"
          >
            <Calendar size={14} />
            Send Scheduled Call Invite
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Voice Recorder ────────────────────────────────────────────────────────────
const VoiceRecorder = ({ onSend, onCancel }) => {
  const [recording,  setRecording]  = useState(false);
  const [duration,   setDuration]   = useState(0);
  const [audioBlob,  setAudioBlob]  = useState(null);
  const [audioUrl,   setAudioUrl]   = useState(null);
  const [playing,    setPlaying]    = useState(false);
  const mediaRef   = useRef(null);
  const chunksRef  = useRef([]);
  const timerRef   = useRef(null);
  const audioElRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      alert('Microphone access denied. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRef.current) mediaRef.current.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const togglePlay = () => {
    if (!audioElRef.current) return;
    if (playing) { audioElRef.current.pause(); setPlaying(false); }
    else         { audioElRef.current.play();  setPlaying(true);  }
  };

  const handleSend = () => {
    if (!audioBlob) return;
    const reader = new FileReader();
    reader.onloadend = () => onSend(reader.result, duration);
    reader.readAsDataURL(audioBlob);
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl"
    >
      {!audioBlob ? (
        <>
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              recording ? 'bg-red-500 hover:bg-red-600' : 'bg-helixa-green hover:bg-helixa-green/80'
            }`}
          >
            {recording ? <Square size={14} className="text-white" /> : <Mic size={16} className="text-white" />}
          </button>
          {recording ? (
            <div className="flex items-center gap-2 flex-grow">
              <motion.div className="w-2 h-2 bg-red-500 rounded-full"
                animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} />
              <span className="text-sm font-black text-[var(--text-primary)]">{formatDuration(duration)}</span>
              <div className="flex-grow h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                <motion.div className="h-full bg-red-400 rounded-full"
                  animate={{ width: ['0%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
              </div>
            </div>
          ) : (
            <span className="text-xs text-[var(--text-secondary)] font-bold flex-grow">Tap to record</span>
          )}
          <button onClick={onCancel} className="p-1.5 hover:text-helixa-alert transition-colors">
            <X size={16} className="text-[var(--text-secondary)]" />
          </button>
        </>
      ) : (
        <>
          <button onClick={togglePlay}
            className="w-9 h-9 rounded-xl bg-helixa-teal/10 flex items-center justify-center flex-shrink-0">
            {playing ? <Pause size={15} className="text-helixa-teal" /> : <Play size={15} className="text-helixa-teal" />}
          </button>
          <audio ref={audioElRef} src={audioUrl} onEnded={() => setPlaying(false)} className="hidden" />
          <div className="flex-grow">
            <div className="h-1.5 bg-[var(--border-color)] rounded-full">
              <div className="h-full bg-helixa-teal rounded-full" style={{ width: '100%', opacity: 0.4 }} />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1">{formatDuration(duration)}</p>
          </div>
          <button onClick={() => { setAudioBlob(null); setAudioUrl(null); setDuration(0); }}
            className="p-1.5 hover:text-helixa-alert transition-colors">
            <X size={14} className="text-[var(--text-secondary)]" />
          </button>
          <button onClick={handleSend}
            className="w-9 h-9 rounded-xl bg-helixa-green flex items-center justify-center hover:bg-helixa-green/80 transition-colors">
            <Send size={15} className="text-white" />
          </button>
        </>
      )}
    </motion.div>
  );
};

// ── Video Recorder ────────────────────────────────────────────────────────────
const VideoRecorder = ({ onSend, onCancel }) => {
  const [recording,  setRecording]  = useState(false);
  const [duration,   setDuration]   = useState(0);
  const [videoBlob,  setVideoBlob]  = useState(null);
  const [videoUrl,   setVideoUrl]   = useState(null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadPct,  setUploadPct]  = useState(0);
  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const liveRef     = useRef(null);
  const streamRef   = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveRef.current) { liveRef.current.srcObject = stream; liveRef.current.play(); }
      const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
      const mr = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        if (liveRef.current) liveRef.current.srcObject = null;
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      alert('Camera/microphone access denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRef.current) mediaRef.current.stop();
    clearInterval(timerRef.current);
    setRecording(false);
  };

  const discard = () => {
    setVideoBlob(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setDuration(0);
    setUploadPct(0);
  };

  const handleSend = async () => {
    if (!videoBlob) return;
    setUploading(true);
    try {
      const ext  = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const path = `video_messages/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const sRef = storageRef(storage, path);
      const task = uploadBytesResumable(sRef, videoBlob);
      await new Promise((resolve, reject) => {
        task.on('state_changed',
          snap => setUploadPct(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject, resolve);
      });
      const downloadUrl = await getDownloadURL(sRef);
      onSend(downloadUrl, duration);
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => onSend(reader.result, duration, true);
      reader.readAsDataURL(videoBlob);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
      className="flex flex-col gap-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl"
    >
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        {!videoBlob ? (
          <video ref={liveRef} muted playsInline className="w-full h-full object-cover" />
        ) : (
          <video src={videoUrl} controls playsInline className="w-full h-full object-cover" />
        )}
        {recording && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 rounded-full">
            <motion.div className="w-2 h-2 bg-red-500 rounded-full"
              animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} />
            <span className="text-white text-xs font-black">{formatDuration(duration)}</span>
          </div>
        )}
        {!recording && !videoBlob && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera size={28} className="text-white/40" />
          </div>
        )}
      </div>
      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-black text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><Upload size={10} /> Uploading…</span>
            <span>{uploadPct}%</span>
          </div>
          <div className="h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
            <motion.div className="h-full bg-helixa-green rounded-full"
              style={{ width: `${uploadPct}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        {!videoBlob ? (
          <>
            <button onClick={recording ? stopRecording : startRecording}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                recording ? 'bg-red-500 hover:bg-red-600' : 'bg-helixa-green hover:bg-helixa-green/80'
              }`}>
              {recording ? <Square size={14} className="text-white" /> : <Video size={16} className="text-white" />}
            </button>
            <span className="text-xs text-[var(--text-secondary)] font-bold flex-grow">
              {recording ? 'Recording — tap ■ to stop' : 'Tap to start recording'}
            </span>
            <button onClick={onCancel} className="p-1.5"><X size={16} className="text-[var(--text-secondary)]" /></button>
          </>
        ) : (
          <>
            <button onClick={discard} className="p-1.5"><X size={14} className="text-[var(--text-secondary)]" /></button>
            <span className="text-xs text-[var(--text-secondary)] font-bold flex-grow">
              {formatDuration(duration)} · ready to send
            </span>
            <button onClick={handleSend} disabled={uploading}
              className="w-9 h-9 rounded-xl bg-helixa-green flex items-center justify-center hover:bg-helixa-green/80 transition-colors disabled:opacity-50">
              <Send size={15} className="text-white" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ── Voice Bubble ──────────────────────────────────────────────────────────────
const VoiceBubble = ({ msg, isMe }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[85%] border ${
      isMe ? 'bg-helixa-green/10 border-helixa-green/20' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
    }`}>
      <button
        onClick={() => {
          if (!audioRef.current) return;
          if (playing) { audioRef.current.pause(); setPlaying(false); }
          else         { audioRef.current.play();  setPlaying(true);  }
        }}
        className="w-8 h-8 rounded-xl bg-helixa-teal flex items-center justify-center flex-shrink-0"
      >
        {playing ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white" />}
      </button>
      <audio ref={audioRef} src={msg.audioBase64} onEnded={() => setPlaying(false)} className="hidden" />
      <div className="flex-grow min-w-0">
        <div className="flex gap-0.5 items-end h-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-1 bg-helixa-teal/40 rounded-full"
              style={{ height: `${30 + Math.sin(i * 0.8) * 50}%` }} />
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-0.5">
          {msg.audioDuration ? formatDuration(msg.audioDuration) : 'Voice message'}
        </p>
      </div>
      <Mic size={13} className="text-[var(--text-secondary)] flex-shrink-0" />
    </div>
  );
};

// ── Video Bubble ──────────────────────────────────────────────────────────────
const VideoBubble = ({ msg, isMe }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const isPending = msg.status === 'queued' || msg.status === 'uploading';
  return (
    <div className={`rounded-2xl overflow-hidden max-w-[85%] border ${
      isMe ? 'bg-helixa-green/10 border-helixa-green/20' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
    }`}>
      {isPending ? (
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Upload size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-black text-[var(--text-primary)]">Video message</p>
            <p className="text-[10px] text-amber-600 font-bold">Queued — will upload when online</p>
          </div>
        </div>
      ) : !showPlayer ? (
        <button onClick={() => setShowPlayer(true)} className="relative block w-full">
          <video src={msg.videoUrl} className="w-full aspect-video object-cover" preload="metadata" />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
              <Play size={18} className="text-helixa-teal ml-0.5" />
            </div>
            {msg.videoDuration && (
              <span className="text-white text-[10px] font-black bg-black/40 px-2 py-0.5 rounded-full">
                {formatDuration(msg.videoDuration)}
              </span>
            )}
          </div>
        </button>
      ) : (
        <video src={msg.videoUrl} controls autoPlay playsInline className="w-full aspect-video object-cover" />
      )}
    </div>
  );
};

// ── Instant Call Bubble ───────────────────────────────────────────────────────
const CallBubble = ({ msg, isMe }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[85%] border ${
    isMe ? 'bg-helixa-green/10 border-helixa-green/20' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
  }`}>
    <div className="w-9 h-9 rounded-xl bg-helixa-green flex items-center justify-center flex-shrink-0">
      {msg.mode === 'video' ? <Video size={16} className="text-white" /> : <Phone size={16} className="text-white" />}
    </div>
    <div className="min-w-0 flex-grow">
      <p className="text-xs font-black text-[var(--text-primary)]">
        {msg.mode === 'video' ? 'Video Call' : 'Voice Call'}
      </p>
      <p className="text-[10px] text-[var(--text-secondary)] font-bold">
        Started by {isMe ? 'you' : msg.senderName?.split(' ')[0]}
      </p>
    </div>
    <a href={msg.meetUrl} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-1 px-3 py-1.5 bg-helixa-green text-white rounded-xl text-xs font-black hover:bg-helixa-green/80 transition-colors flex-shrink-0">
      Join <ExternalLink size={11} />
    </a>
  </div>
);

// ── Scheduled Call Bubble ─────────────────────────────────────────────────────
const ScheduledCallBubble = ({ msg, isMe }) => {
  const isPast = msg.scheduledAt && new Date(msg.scheduledAt) < new Date();

  const addToCalendar = () => {
    const start = new Date(msg.scheduledAt);
    const end   = new Date(start.getTime() + 30 * 60 * 1000);
    const fmt   = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const title = encodeURIComponent(`${msg.mode === 'video' ? 'Video' : 'Voice'} Call`);
    const url   = encodeURIComponent(msg.meetUrl);
    window.open(
      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&location=${url}`,
      '_blank',
    );
  };

  return (
    <div className={`rounded-2xl overflow-hidden max-w-[85%] border ${
      isMe ? 'bg-helixa-green/10 border-helixa-green/20' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
    }`}>
      <div className={`flex items-center gap-2 px-4 py-2 ${
        isMe ? 'bg-helixa-green/20' : 'bg-[var(--border-color)]/40'
      }`}>
        <Calendar size={12} className="text-helixa-green flex-shrink-0" />
        <span className="text-[10px] font-black text-helixa-green uppercase tracking-wide">
          Scheduled {msg.mode === 'video' ? 'Video' : 'Voice'} Call
        </span>
        {isPast && (
          <span className="ml-auto text-[9px] font-black text-[var(--text-secondary)] bg-[var(--border-color)] px-1.5 py-0.5 rounded-full">
            Past
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            msg.mode === 'video' ? 'bg-helixa-teal/10' : 'bg-helixa-green/10'
          }`}>
            {msg.mode === 'video'
              ? <Video size={15} className="text-helixa-teal" />
              : <Phone size={15} className="text-helixa-green" />}
          </div>
          <div>
            <p className="text-sm font-black text-[var(--text-primary)]">
              {formatScheduledTime(msg.scheduledAt)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold">
              Scheduled by {isMe ? 'you' : msg.senderName?.split(' ')[0]}
            </p>
          </div>
        </div>

        {msg.note && (
          <p className="text-xs text-[var(--text-secondary)] bg-[var(--border-color)]/40 rounded-xl px-3 py-2 italic">
            "{msg.note}"
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <a href={msg.meetUrl} target="_blank" rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black transition-colors ${
              isPast
                ? 'bg-[var(--border-color)] text-[var(--text-secondary)]'
                : 'bg-helixa-green text-white hover:bg-helixa-green/80'
            }`}>
            {msg.mode === 'video' ? <Video size={12} /> : <Phone size={12} />}
            Join Call
          </a>
          <button onClick={addToCalendar}
            className="flex items-center justify-center gap-1.5 px-3 py-2 border border-[var(--border-color)] rounded-xl text-xs font-black text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <Calendar size={12} />
            + Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── New Conversation Modal ────────────────────────────────────────────────────
const NewConvModal = ({ user, onClose, onCreated }) => {
  const [allUsers,   setAllUsers]   = useState([]);
  const [selected,   setSelected]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [groupName,  setGroupName]  = useState('');
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user.id));
      setLoading(false);
    };
    fetch();
  }, [user.id]);

  const toggle = (u) => setSelected(prev =>
    prev.find(s => s.id === u.id) ? prev.filter(s => s.id !== u.id) : [...prev, u]
  );

  const createConv = async () => {
    if (selected.length === 0) return;
    const isGroup      = selected.length > 1;
    const participants = [user.id, ...selected.map(s => s.id)];
    const name         = isGroup ? (groupName || selected.map(s => s.firstName).join(', ')) : null;

    if (!isGroup) {
      const q    = query(collection(db, 'conversations'), where('participants', 'array-contains', user.id));
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => {
        const p = d.data().participants;
        return p.length === 2 && p.includes(selected[0].id);
      });
      if (existing) { onCreated(existing.id); onClose(); return; }
    }

    const unread = {};
    participants.forEach(id => { unread[id] = 0; });

    const docRef = await addDoc(collection(db, 'conversations'), {
      participants, type: isGroup ? 'group' : 'direct', name,
      lastMessage: '', lastAt: serverTimestamp(), unread,
      createdBy: user.id,
      memberNames: [`${user.firstName} ${user.lastName}`, ...selected.map(s => `${s.firstName} ${s.lastName}`)],
    });
    onCreated(docRef.id);
    onClose();
  };

  const filtered = allUsers.filter(u =>
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[var(--bg-primary)] z-10 flex flex-col rounded-2xl">
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)]">
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[var(--border-color)] transition-colors">
          <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
        </button>
        <h3 className="font-black text-[var(--text-primary)]">New Message</h3>
      </div>
      <div className="p-3 border-b border-[var(--border-color)]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-8 pr-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)]" />
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selected.map(s => (
              <span key={s.id} className="flex items-center gap-1 px-2 py-1 bg-helixa-green/10 text-helixa-green rounded-full text-xs font-bold">
                {s.firstName}<button onClick={() => toggle(s)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
        {selected.length > 1 && (
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name (optional)"
            className="w-full mt-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)]" />
        )}
      </div>
      <div className="flex-grow overflow-y-auto p-2">
        {loading
          ? <p className="text-center text-xs text-[var(--text-secondary)] mt-8">Loading…</p>
          : filtered.map(u => (
            <button key={u.id} onClick={() => toggle(u)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selected.find(s => s.id === u.id) ? 'bg-helixa-green/10' : 'hover:bg-[var(--bg-secondary)]'}`}>
              <div className="w-9 h-9 rounded-full bg-helixa-teal/10 text-helixa-teal font-black text-sm flex items-center justify-center flex-shrink-0">
                {getInitials(`${u.firstName} ${u.lastName}`)}
              </div>
              <div className="flex-grow text-left min-w-0">
                <p className="text-sm font-black text-[var(--text-primary)] truncate">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-[var(--text-secondary)] capitalize">{u.role}</p>
              </div>
              {selected.find(s => s.id === u.id) && <Check size={16} className="text-helixa-green flex-shrink-0" />}
            </button>
          ))}
      </div>
      <div className="p-3 border-t border-[var(--border-color)]">
        <button onClick={createConv} disabled={selected.length === 0}
          className="w-full py-2.5 bg-helixa-green text-white rounded-xl font-black text-sm disabled:opacity-40 hover:bg-helixa-green/90 transition-colors">
          {selected.length > 1 ? 'Create Group' : 'Start Chat'}
        </button>
      </div>
    </motion.div>
  );
};

// ── Chat View ─────────────────────────────────────────────────────────────────
const ChatView = ({ conv, user, onBack }) => {
  const [messages,        setMessages]        = useState([]);
  const [input,           setInput]           = useState('');
  const [recorder,        setRecorder]        = useState(null);
  const [showVoiceTip,    setShowVoiceTip]    = useState(false);
  // FIX 3: state for mid-chat tier drop toast
  const [tierDropToast,   setTierDropToast]   = useState(null); // null | 'weak' | 'offline'
  const [scheduleModal,   setScheduleModal]   = useState(null);
  const { isOffline }    = useOffline();
  const network          = useNetworkQuality();
  const prevTierRef      = useRef(network.tier);
  const bottomRef        = useRef(null);
  const isDoctor         = user?.role === 'doctor';

  const chatName = conv.type === 'group'
    ? (conv.name || 'Group Chat')
    : conv.memberNames?.find(n => !n.includes(user.firstName)) || 'Chat';

  // FIX 3: watch for tier drops and show toast
  useEffect(() => {
    const prev = prevTierRef.current;
    const curr = network.tier;
    prevTierRef.current = curr;

    // Only fire when signal DROPS (not when it improves)
    if (prev === NETWORK_TIERS.STRONG && (curr === NETWORK_TIERS.WEAK || curr === NETWORK_TIERS.OFFLINE)) {
      setTierDropToast(curr);
      const t = setTimeout(() => setTierDropToast(null), 5000);
      return () => clearTimeout(t);
    }
    if (prev === NETWORK_TIERS.MODERATE && (curr === NETWORK_TIERS.WEAK || curr === NETWORK_TIERS.OFFLINE)) {
      setTierDropToast(curr);
      const t = setTimeout(() => setTierDropToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [network.tier]);

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', conv.id, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    updateDoc(doc(db, 'conversations', conv.id), { [`unread.${user.id}`]: 0 }).catch(() => {});
    return () => unsub();
  }, [conv.id, user.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const pushMessage = useCallback(async (fields) => {
    if (isOffline) {
      const offlineMsg = {
        id:         `offline_${Date.now()}`,
        senderId:   user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        type:       'text',
        createdAt:  { toDate: () => new Date() },
        status:     'queued',
        ...fields,
      };
      setMessages(prev => [...prev, offlineMsg]);
      addToQueue('message', {
        convId:        conv.id,
        senderId:      user.id,
        senderName:    `${user.firstName} ${user.lastName}`,
        text:          fields.text || '',
        msgType:       fields.type || 'text',
        audioBase64:   fields.audioBase64   || null,
        audioDuration: fields.audioDuration || null,
        videoUrl:      fields.videoUrl      || null,
        videoDuration: fields.videoDuration || null,
      }, 'normal');
      return;
    }
    await addDoc(collection(db, 'conversations', conv.id, 'messages'), {
      senderId:   user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      type:       'text',
      createdAt:  serverTimestamp(),
      status:     'sent',
      ...fields,
    });
    const unreadUpdate = {};
    conv.participants
      .filter(id => id !== user.id)
      .forEach(id => { unreadUpdate[`unread.${id}`] = (conv.unread?.[id] || 0) + 1; });
    await updateDoc(doc(db, 'conversations', conv.id), {
      lastMessage: fields.text || (fields.type === 'video' ? '🎥 Video message' : fields.type === 'scheduledCall' ? '📅 Call scheduled' : '🎤 Voice message'),
      lastAt: serverTimestamp(),
      ...unreadUpdate,
    });
  }, [isOffline, conv, user]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    await pushMessage({ type: 'text', text });
  };

  const sendVoice = async (audioBase64, audioDuration) => {
    setRecorder(null);
    await pushMessage({ type: 'voice', text: '🎤 Voice message', audioBase64, audioDuration });
  };

  const sendVideo = async (videoUrl, videoDuration, isOfflineFallback = false) => {
    setRecorder(null);
    if (isOfflineFallback) {
      const offlineMsg = {
        id: `offline_${Date.now()}`, senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        type: 'video', createdAt: { toDate: () => new Date() },
        status: 'queued', videoUrl, videoDuration, text: '🎥 Video message',
      };
      setMessages(prev => [...prev, offlineMsg]);
      addToQueue('message', {
        convId: conv.id, senderId: user.id,
        senderName: `${user.firstName} ${user.lastName}`,
        text: '🎥 Video message', msgType: 'video',
        videoBase64: videoUrl, videoDuration,
      }, 'normal');
      return;
    }
    await pushMessage({ type: 'video', text: '🎥 Video message', videoUrl, videoDuration });
  };

  // ── FIX 2: Jitsi config params based on signal tier ───────────────────────
  const startInstantCall = async (mode) => {
    const roomId = `helixa-${conv.id.slice(0, 8)}-${Date.now().toString(36)}`;
    let meetUrl  = `https://meet.jit.si/${roomId}`;

    // Moderate signal: mute video on join to save bandwidth, patient can unmute if they want
    if (network.tier === NETWORK_TIERS.MODERATE) {
      meetUrl += '#config.startWithVideoMuted=true';
    }
    // WEAK never reaches here — handleCallButton routes to schedule modal instead

    await pushMessage({
      type: 'call',
      text: `${mode === 'video' ? '🎥' : '🎙️'} Call started`,
      meetUrl,
      mode,
    });
    window.open(meetUrl, '_blank');
  };

  const handleCallButton = (mode) => {
    if (network.tier === NETWORK_TIERS.STRONG || network.tier === NETWORK_TIERS.MODERATE) {
      startInstantCall(mode);
    } else {
      setScheduleModal(mode);
    }
  };

  const sendScheduledCall = async ({ mode, scheduledAt, note }) => {
    const roomId  = `helixa-${conv.id.slice(0, 8)}-${Date.now().toString(36)}`;
    const meetUrl = `https://meet.jit.si/${roomId}`;
    await pushMessage({
      type:        'scheduledCall',
      text:        `📅 ${mode === 'video' ? 'Video' : 'Voice'} call scheduled for ${formatScheduledTime(scheduledAt)}`,
      meetUrl,
      mode,
      scheduledAt,
      note:        note || null,
    });
  };

  const openRecorder = (type) => {
    setRecorder(type);
    if (type === 'voice') {
      setShowVoiceTip(true);
      setTimeout(() => setShowVoiceTip(false), 3500);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <AnimatePresence>
        {scheduleModal && (
          <ScheduleCallModal
            network={network}
            defaultMode={scheduleModal}
            onClose={() => setScheduleModal(null)}
            onSchedule={sendScheduledCall}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-[var(--border-color)] transition-colors">
          <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
        </button>
        <div className="w-9 h-9 rounded-full bg-helixa-teal/10 text-helixa-teal font-black text-sm flex items-center justify-center flex-shrink-0">
          {conv.type === 'group' ? <Users size={16} /> : getInitials(chatName)}
        </div>
        <div className="flex-grow min-w-0">
          <p className="text-sm font-black text-[var(--text-primary)] truncate">{chatName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <NetworkBadge tier={network.tier} downlink={network.downlink} apiSupported={network.apiSupported} />
          </div>
        </div>

        {isDoctor && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="relative group">
              <button
                onClick={() => handleCallButton('voice')}
                title={network.tier === NETWORK_TIERS.STRONG ? 'Start voice call' : 'Schedule voice call'}
                className={`p-2 rounded-xl transition-colors ${
                  network.tier === NETWORK_TIERS.STRONG
                    ? 'hover:bg-helixa-green/10 text-[var(--text-secondary)] hover:text-helixa-green'
                    : 'hover:bg-amber-50 text-[var(--text-secondary)] hover:text-amber-600'
                }`}
              >
                <Phone size={16} />
                {network.tier !== NETWORK_TIERS.STRONG && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                )}
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => handleCallButton('video')}
                title={network.tier === NETWORK_TIERS.STRONG ? 'Start video call' : 'Schedule video call'}
                className={`p-2 rounded-xl transition-colors ${
                  network.tier === NETWORK_TIERS.STRONG
                    ? 'hover:bg-helixa-green/10 text-[var(--text-secondary)] hover:text-helixa-green'
                    : 'hover:bg-amber-50 text-[var(--text-secondary)] hover:text-amber-600'
                }`}
              >
                <Video size={16} />
                {network.tier !== NETWORK_TIERS.STRONG && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FIX 3: Mid-chat tier drop toast */}
      <AnimatePresence>
        {tierDropToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mx-4 mt-2"
          >
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold ${
              tierDropToast === NETWORK_TIERS.OFFLINE
                ? 'bg-red-50 border border-red-100 text-red-600'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              {tierDropToast === NETWORK_TIERS.OFFLINE
                ? <WifiOff size={12} className="flex-shrink-0" />
                : <AlertTriangle size={12} className="flex-shrink-0" />}
              {tierDropToast === NETWORK_TIERS.OFFLINE
                ? 'You went offline — messages are saving locally'
                : 'Signal dropped — try a voice message instead of a call'}
              <button onClick={() => setTierDropToast(null)} className="ml-auto flex-shrink-0">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing signal hint bars */}
      {isDoctor && network.tier === NETWORK_TIERS.MODERATE && (
        <div className="px-4 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
            <Signal size={12} />
            Moderate signal — calls will start audio-only to save bandwidth. Video can be unmuted inside the call.
          </div>
        </div>
      )}
      {isDoctor && (network.tier === NETWORK_TIERS.WEAK || network.tier === NETWORK_TIERS.OFFLINE) && (
        <div className="px-4 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
            <AlertTriangle size={12} />
            Weak signal — calls will be scheduled for later. Use video messages for now.
          </div>
        </div>
      )}

      {isOffline && (
        <div className="px-4 pt-2 space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
            <WifiOff size={12} /> Offline — messages saved locally, auto-sync when restored
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
            <MessageSquare size={28} className="text-[var(--text-secondary)]" />
            <p className="text-xs font-bold text-[var(--text-secondary)]">No messages yet. Say hi!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe     = msg.senderId === user.id;
          const showName = !isMe && conv.type === 'group';
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {showName && (
                <p className="text-[10px] font-black text-[var(--text-secondary)] mb-1 ml-1">{msg.senderName}</p>
              )}
              {msg.type === 'voice' ? (
                <VoiceBubble msg={msg} isMe={isMe} />
              ) : msg.type === 'video' ? (
                <VideoBubble msg={msg} isMe={isMe} />
              ) : msg.type === 'call' ? (
                <CallBubble msg={msg} isMe={isMe} />
              ) : msg.type === 'scheduledCall' ? (
                <ScheduledCallBubble msg={msg} isMe={isMe} />
              ) : (
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                  isMe
                    ? 'bg-helixa-green text-white rounded-br-sm'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1 mx-1">
                <p className="text-[10px] text-[var(--text-secondary)]">{formatTime(msg.createdAt)}</p>
                {isMe && <MessageStatus status={msg.status || 'sent'} />}
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-3 pt-0 pb-3 border-t border-[var(--border-color)] flex-shrink-0 space-y-2">
        <AnimatePresence>
          {showVoiceTip && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-2 px-3 py-2 mt-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700"
            >
              <Mic size={12} className="flex-shrink-0" />
              Keep voice clips concise for best delivery on low connectivity.
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {recorder === 'voice' && <VoiceRecorder onSend={sendVoice} onCancel={() => setRecorder(null)} />}
          {recorder === 'video' && <VideoRecorder onSend={sendVideo} onCancel={() => setRecorder(null)} />}
        </AnimatePresence>

        {!recorder && (
          <div className="flex gap-2 pt-2">
            <div className="flex flex-col items-center gap-0.5">
              <button onClick={() => openRecorder('voice')}
                className="w-10 h-10 rounded-xl hover:bg-helixa-teal/10 text-[var(--text-secondary)] hover:text-helixa-teal flex items-center justify-center transition-colors">
                <Mic size={18} />
              </button>
              <WorksOfflineLabel className="text-[8px] leading-none" />
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <button onClick={() => openRecorder('video')}
                className="w-10 h-10 rounded-xl hover:bg-helixa-teal/10 text-[var(--text-secondary)] hover:text-helixa-teal flex items-center justify-center transition-colors"
                title="Send a video message">
                <Camera size={18} />
              </button>
              <span className="text-[8px] leading-none text-[var(--text-secondary)] font-bold">async</span>
            </div>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message…"
              className="flex-grow bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)]"
            />
            <button onClick={sendMessage}
              className="w-10 h-10 bg-helixa-green rounded-xl flex items-center justify-center hover:bg-helixa-green/80 transition-colors flex-shrink-0">
              <Send size={16} className="text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Conversations List ────────────────────────────────────────────────────────
const ConvList = ({ conversations, user, onSelect, onNew }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] flex-shrink-0">
      <h3 className="font-black text-lg text-[var(--text-primary)]">Messages</h3>
      <button onClick={onNew}
        className="w-8 h-8 bg-helixa-green/10 hover:bg-helixa-green/20 rounded-xl flex items-center justify-center transition-colors">
        <Plus size={16} className="text-helixa-green" />
      </button>
    </div>
    <div className="flex-grow overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60 p-6">
          <MessageSquare size={32} className="text-[var(--text-secondary)]" />
          <p className="text-sm font-black text-[var(--text-primary)]">No conversations yet</p>
          <p className="text-xs text-[var(--text-secondary)] text-center">Click + to start a new message</p>
        </div>
      ) : conversations.map(conv => {
        const unread   = conv.unread?.[user.id] || 0;
        const convName = conv.type === 'group'
          ? (conv.name || 'Group Chat')
          : conv.memberNames?.find(n => !n.includes(user.firstName)) || 'Chat';
        return (
          <button key={conv.id} onClick={() => onSelect(conv)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--bg-secondary)] transition-colors border-b border-[var(--border-color)]/50">
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-full bg-helixa-teal/10 text-helixa-teal font-black text-sm flex items-center justify-center">
                {conv.type === 'group' ? <Users size={18} /> : getInitials(convName)}
              </div>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-helixa-green rounded-full text-[10px] font-black text-white flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <div className="flex-grow min-w-0 text-left">
              <div className="flex items-center justify-between mb-0.5">
                <p className={`text-sm truncate ${unread > 0 ? 'font-black' : 'font-bold'} text-[var(--text-primary)]`}>{convName}</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold flex-shrink-0 ml-2">{formatTime(conv.lastAt)}</p>
              </div>
              <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                {conv.lastMessage || 'No messages yet'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

// ── Main Panel ────────────────────────────────────────────────────────────────
export const MessagingPanel = ({ user, onClose, initialConvId }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConv,    setActiveConv]    = useState(null);
  const [showNewConv,   setShowNewConv]   = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.id),
    );
    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.lastAt?.seconds || 0) - (a.lastAt?.seconds || 0));
      setConversations(convs);
      if (initialConvId) {
        const target = convs.find(c => c.id === initialConvId);
        if (target) setActiveConv(target);
      }
    });
    return () => unsub();
  }, [user?.id, initialConvId]);

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {showNewConv ? (
          <NewConvModal key="new" user={user} onClose={() => setShowNewConv(false)}
            onCreated={(id) => {
              setShowNewConv(false);
              const conv = conversations.find(c => c.id === id);
              if (conv) setActiveConv(conv);
            }} />
        ) : activeConv ? (
          <motion.div key="chat" className="flex flex-col h-full"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <ChatView conv={activeConv} user={user} onBack={() => setActiveConv(null)} />
          </motion.div>
        ) : (
          <motion.div key="list" className="flex flex-col h-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConvList conversations={conversations} user={user}
              onSelect={setActiveConv} onNew={() => setShowNewConv(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};