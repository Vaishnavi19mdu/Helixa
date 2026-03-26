// src/components/AdminChatBot.jsx
// Floating AI chat assistant for the Admin Panel
// Uses Groq (llama-3.1-8b-instant) — same pattern as HelixaBot.jsx
// OFFLINE: gracefully shows an offline message instead of a network error

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, Bot, User, Sparkles, WifiOff } from 'lucide-react';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = typeof window !== 'undefined' ? import.meta.env?.VITE_GROQ_API_KEY : '';

const SYSTEM_PROMPT = `You are Helixa's Admin AI Assistant. You help admin users manage the platform efficiently.
You can help with:
- Understanding user and doctor statistics
- Guidance on approving/rejecting doctor applications
- Best practices for broadcasting notifications
- Interpreting analytics data
- Managing appointments and announcements
- Platform moderation advice

Be concise, professional, and action-oriented. Plain text only — no markdown, no asterisks, no bold, no bullet symbols. Keep responses under 4 sentences.`;

// Strip any markdown symbols that Groq sneaks in despite instructions
const stripMarkdown = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g,     '$1')
    .replace(/__(.*?)__/g,     '$1')
    .replace(/_(.*?)_/g,       '$1')
    .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
    .replace(/^#{1,6}\s+/gm,   '')
    .replace(/^\s*[-•]\s+/gm,  '• ')
    .trim();

const askGroq = async (messages) => {
  // ── Offline guard ─────────────────────────────────────────────────────────
  if (!navigator.onLine) {
    return "You're offline. The AI assistant needs an internet connection. Please reconnect and try again.";
  }
  if (!GROQ_API_KEY) {
    return "Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file.";
  }
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "I couldn't generate a response. Please try again.";
    return stripMarkdown(raw);
  } catch (err) {
    console.error('AdminChatBot Groq error:', err);
    if (!navigator.onLine) {
      return "You're offline. Please check your connection and try again.";
    }
    return 'Something went wrong. Please check your connection and try again.';
  }
};

export const AdminChatBot = () => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Helixa Admin Assistant. Ask me anything about managing users, approvals, analytics, or notifications.",
    },
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  // Track online/offline status
  useEffect(() => {
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const newHistory = [...history, userMsg];
    const reply = await askGroq(newHistory);

    const assistantMsg = { role: 'assistant', content: reply };
    setHistory([...newHistory, assistantMsg]);
    setMessages(prev => [...prev, assistantMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-helixa-teal text-white shadow-2xl flex items-center justify-center"
        aria-label="Open Admin Chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              exit={{    rotate: 90,  opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open"
              initial={{ rotate: 90,  opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              exit={{    rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare size={22} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-helixa-green rounded-full border-2 border-white flex items-center justify-center">
            {isOffline
              ? <WifiOff size={7} className="text-white" />
              : <Sparkles size={8} className="text-white" />
            }
          </span>
        )}
      </motion.button>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-50 w-[370px] max-h-[560px] flex flex-col rounded-3xl bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-helixa-teal">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Admin Assistant</p>
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Powered by Helixa AI</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={15} className="text-white" />
              </button>
            </div>

            {/* Offline banner */}
            {isOffline && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs font-bold text-amber-700">
                <WifiOff size={13} />
                You're offline — AI responses are unavailable
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[var(--bg-primary)]">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === 'user' ? 'bg-helixa-green' : 'bg-helixa-teal/10'
                  }`}>
                    {msg.role === 'user'
                      ? <User size={13} className="text-white" />
                      : <Bot  size={13} className="text-helixa-teal" />
                    }
                  </div>
                  <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed font-medium ${
                    msg.role === 'user'
                      ? 'bg-helixa-green text-white rounded-tr-sm'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5"
                >
                  <div className="w-7 h-7 rounded-xl bg-helixa-teal/10 flex items-center justify-center flex-shrink-0">
                    <Bot size={13} className="text-helixa-teal" />
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 bg-helixa-teal/60 rounded-full"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isOffline ? "Offline — AI unavailable…" : "Ask anything about the admin panel…"}
                disabled={isOffline}
                rows={1}
                className="flex-1 resize-none bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-teal placeholder:text-[var(--text-secondary)] max-h-24 overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ lineHeight: '1.4' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || isOffline}
                className="w-9 h-9 rounded-xl bg-helixa-teal text-white flex items-center justify-center hover:bg-helixa-teal/80 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                {loading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <Send    size={15} />
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};