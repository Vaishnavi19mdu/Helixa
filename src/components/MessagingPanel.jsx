// src/components/MessagingPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, onSnapshot, addDoc,
  updateDoc, doc, serverTimestamp, orderBy,
  getDocs, setDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Send, Search, Plus, ArrowLeft, Users,
  MessageSquare, Check, Mic, MicOff, Play, Pause,
  Video, Phone, ExternalLink, Square, WifiOff
} from 'lucide-react';
import { addToQueue } from '../utils/offlineQueue';
import { useOffline } from '../hooks/useOffline';
import { OfflineBanner, MessageStatus, WorksOfflineLabel, PriorityBadge } from '../components/OfflineBanner';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const formatTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000)   return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatDuration = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ── Voice Recorder ────────────────────────────────────────────────────────────
const VoiceRecorder = ({ onSend, onCancel }) => {
  const [recording,  setRecording]  = useState(false);
  const [duration,   setDuration]   = useState(0);
  const [audioBlob,  setAudioBlob]  = useState(null);
  const [audioUrl,   setAudioUrl]   = useState(null);
  const [playing,    setPlaying]    = useState(false);
  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const audioElRef  = useRef(null);

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
    if (playing) {
      audioElRef.current.pause();
      setPlaying(false);
    } else {
      audioElRef.current.play();
      setPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result; // data:audio/webm;base64,...
      onSend(base64, duration);
    };
    reader.readAsDataURL(audioBlob);
  };

  useEffect(() => () => {
    clearInterval(timerRef.current);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl"
    >
      {!audioBlob ? (
        <>
          {/* Record / stop */}
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
              recording ? 'bg-red-500 hover:bg-red-600' : 'bg-helixa-green hover:bg-helixa-green/80'
            }`}
          >
            {recording ? <Square size={14} className="text-white" /> : <Mic size={16} className="text-white" />}
          </button>

          {recording && (
            <div className="flex items-center gap-2 flex-grow">
              <motion.div className="w-2 h-2 bg-red-500 rounded-full" animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} />
              <span className="text-sm font-black text-[var(--text-primary)]">{formatDuration(duration)}</span>
              <div className="flex-grow h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                <motion.div className="h-full bg-red-400 rounded-full" animate={{ width: ['0%', '100%'] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} />
              </div>
            </div>
          )}
          {!recording && (
            <span className="text-xs text-[var(--text-secondary)] font-bold flex-grow">Tap to record</span>
          )}

          <button onClick={onCancel} className="p-1.5 hover:text-helixa-alert transition-colors">
            <X size={16} className="text-[var(--text-secondary)]" />
          </button>
        </>
      ) : (
        <>
          {/* Preview + send */}
          <button onClick={togglePlay} className="w-9 h-9 rounded-xl bg-helixa-teal/10 flex items-center justify-center flex-shrink-0">
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

// ── Voice Message Bubble ──────────────────────────────────────────────────────
const VoiceBubble = ({ msg, isMe }) => {
  const [playing,  setPlaying]  = useState(false);
  const audioRef = useRef(null);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl max-w-[85%] border ${
      isMe ? 'bg-helixa-green/10 border-helixa-green/20' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
    }`}>
      <button
        onClick={() => {
          if (!audioRef.current) return;
          if (playing) { audioRef.current.pause(); setPlaying(false); }
          else { audioRef.current.play(); setPlaying(true); }
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

// ── Call Bubble ───────────────────────────────────────────────────────────────
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

// ── New Conversation Modal ────────────────────────────────────────────────────
const NewConvModal = ({ user, onClose, onCreated }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search,   setSearch]   = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading,  setLoading]  = useState(true);

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
    const isGroup = selected.length > 1;
    const participants = [user.id, ...selected.map(s => s.id)];
    const name = isGroup ? (groupName || selected.map(s => s.firstName).join(', ')) : null;

    if (!isGroup) {
      const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.id));
      const snap = await getDocs(q);
      const existing = snap.docs.find(d => {
        const p = d.data().participants;
        return p.length === 2 && p.includes(selected[0].id);
      });
      if (existing) { onCreated(existing.id); onClose(); return; }
    }

    const unread = {};
    participants.forEach(id => { unread[id] = 0; });

    const ref = await addDoc(collection(db, 'conversations'), {
      participants,
      type: isGroup ? 'group' : 'direct',
      name,
      lastMessage: '',
      lastAt: serverTimestamp(),
      unread,
      createdBy: user.id,
      memberNames: [`${user.firstName} ${user.lastName}`, ...selected.map(s => `${s.firstName} ${s.lastName}`)],
    });
    onCreated(ref.id);
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
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
        {loading ? <p className="text-center text-xs text-[var(--text-secondary)] mt-8">Loading...</p>
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
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [showRecorder,  setShowRecorder]  = useState(false);
  const { isOffline } = useOffline();
  const [showVoiceTip,  setShowVoiceTip]  = useState(false);
  const bottomRef = useRef(null);
  const isDoctor  = user?.role === 'doctor';

  const chatName = conv.type === 'group'
    ? (conv.name || 'Group Chat')
    : conv.memberNames?.find(n => !n.includes(user.firstName)) || 'Chat';

  useEffect(() => {
    const q = query(collection(db, 'conversations', conv.id, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    updateDoc(doc(db, 'conversations', conv.id), { [`unread.${user.id}`]: 0 }).catch(() => {});
    return () => unsub();
  }, [conv.id, user.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const pushMessage = async (fields) => {
    // ── Offline: save to local queue ──────────────────────────────────────────
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
        convId:      conv.id,
        senderId:    user.id,
        senderName:  `${user.firstName} ${user.lastName}`,
        text:        fields.text || '🎤 Voice message',
        msgType:     fields.type || 'text',
        audioBase64: fields.audioBase64 || null,
        audioDuration: fields.audioDuration || null,
      }, 'normal');
      return;
    }

    // ── Online: send to Firestore ─────────────────────────────────────────────
    await addDoc(collection(db, 'conversations', conv.id, 'messages'), {
      senderId:   user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      type:       'text',
      createdAt:  serverTimestamp(),
      status:     'sent',
      ...fields,
    });
    const unreadUpdate = {};
    conv.participants.filter(id => id !== user.id)
      .forEach(id => { unreadUpdate[`unread.${id}`] = (conv.unread?.[id] || 0) + 1; });
    await updateDoc(doc(db, 'conversations', conv.id), {
      lastMessage: fields.text || '🎤 Voice message',
      lastAt: serverTimestamp(),
      ...unreadUpdate,
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    await pushMessage({ type: 'text', text });
  };

  const sendVoice = async (audioBase64, audioDuration) => {
    setShowRecorder(false);
    await pushMessage({ type: 'voice', text: '🎤 Voice message', audioBase64, audioDuration });
  };

  // Doctor only
  const startCall = async (mode) => {
    const roomId  = `helixa-${conv.id.slice(0, 8)}-${Date.now().toString(36)}`;
    const meetUrl = `https://meet.google.com/lookup/${roomId}`;
    await pushMessage({ type: 'call', text: `${mode === 'video' ? '🎥' : '🎙️'} Call started`, meetUrl, mode });
    window.open(meetUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-full">
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
          <p className="text-[10px] text-[var(--text-secondary)] font-bold">
            {conv.type === 'group' ? `${conv.participants?.length} members` : 'Direct message'}
          </p>
        </div>
        {/* Call buttons — doctor only */}
        {isDoctor && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => startCall('voice')} title="Voice call"
              className="p-2 rounded-xl hover:bg-helixa-green/10 text-[var(--text-secondary)] hover:text-helixa-green transition-colors">
              <Phone size={16} />
            </button>
            <button onClick={() => startCall('video')} title="Video call"
              className="p-2 rounded-xl hover:bg-helixa-green/10 text-[var(--text-secondary)] hover:text-helixa-green transition-colors">
              <Video size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Offline banner */}
      {isOffline && (
        <div className="px-4 pt-2 space-y-1.5">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
            <WifiOff size={12} /> Offline — messages saved locally, auto-sync when restored
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-xl text-[10px] font-bold text-red-600">
            🚨 Mark a message urgent and it will be sent first when you're back online
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
              ) : msg.type === 'call' ? (
                <CallBubble msg={msg} isMe={isMe} />
              ) : (
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed ${
                  isMe ? 'bg-helixa-green text-white rounded-br-sm'
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex items-center gap-2 px-3 py-2 mt-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700"
            >
              <Mic size={12} className="flex-shrink-0" />
              Keep voice clips under 30 seconds for best quality.
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showRecorder && (
            <VoiceRecorder onSend={sendVoice} onCancel={() => setShowRecorder(false)} />
          )}
        </AnimatePresence>
        {!showRecorder && (
          <div className="flex gap-2">
            {/* Mic button — both roles */}
            <div className="flex flex-col items-center gap-0.5">
              <button onClick={() => { setShowRecorder(true); setShowVoiceTip(true); setTimeout(() => setShowVoiceTip(false), 3500); }}
                className="w-10 h-10 rounded-xl hover:bg-helixa-teal/10 text-[var(--text-secondary)] hover:text-helixa-teal flex items-center justify-center transition-colors">
                <Mic size={18} />
              </button>
              <WorksOfflineLabel className="text-[8px] leading-none" />
            </div>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
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
      <button onClick={onNew} className="w-8 h-8 bg-helixa-green/10 hover:bg-helixa-green/20 rounded-xl flex items-center justify-center transition-colors">
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
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', user.id));
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
          <motion.div key="chat" className="flex flex-col h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <ChatView conv={activeConv} user={user} onBack={() => setActiveConv(null)} />
          </motion.div>
        ) : (
          <motion.div key="list" className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ConvList conversations={conversations} user={user} onSelect={setActiveConv} onNew={() => setShowNewConv(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// useUnreadCount moved to src/hooks/useUnreadCount.js