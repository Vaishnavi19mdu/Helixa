// src/components/HelixaBot.jsx
// Landing page assistant bot — uses a KB first, falls back to Groq
// Appears as a floating button bottom-right with the Helixa logo

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Zap } from 'lucide-react';

// ── Knowledge Base ────────────────────────────────────────────────────────────
const KB = [
  {
    q: ['what is helixa', 'what does helixa do', 'about helixa', 'tell me about helixa'],
    a: "Helixa is an AI-powered healthcare platform that helps patients check symptoms, track health history, and connect with doctors — all in one place."
  },
  {
    q: ['symptom checker', 'check symptoms', 'how does symptom checker work', 'ai symptom'],
    a: "Our AI Symptom Checker analyzes your symptoms using Groq AI and gives you a preliminary assessment with confidence scores and recommendations. It's fast, private, and always recommends consulting a doctor for serious concerns."
  },
  {
    q: ['sign up', 'create account', 'register', 'get started', 'join'],
    a: "You can sign up as a Patient or a Doctor. Patients can check symptoms, book appointments and track their health. Doctors get a full dashboard with patient management, analytics, and telemedicine tools."
  },
  {
    q: ['appointment', 'book appointment', 'video call', 'consultation'],
    a: "Doctors publish availability slots (video or voice call) and patients can browse and book them directly. Video calls are conducted via Google Meet — no extra software needed."
  },
  {
    q: ['is it free', 'cost', 'pricing', 'how much'],
    a: "Helixa is currently free to use during our early access period. Sign up now to get full access to all features at no cost."
  },
  {
    q: ['privacy', 'data', 'secure', 'safe', 'hipaa'],
    a: "Your health data is stored securely in Firebase with encryption at rest and in transit. We never sell your data to third parties. You can delete your account and all associated data at any time from Settings."
  },
  {
    q: ['doctor', 'healthcare provider', 'for doctors', 'provider'],
    a: "Doctors on Helixa get a powerful dashboard with patient lists, AI-generated symptom reports, real-time alerts, appointment management, and a secure messaging system including voice notes and video calls."
  },
  {
    q: ['offline', 'no internet', 'low bandwidth'],
    a: "Helixa works in low-connectivity environments too. Core features like viewing past symptom reports and health summaries are cached locally so you can access them offline."
  },
  {
    q: ['languages', 'multilingual', 'hindi', 'tamil', 'kannada', 'telugu'],
    a: "Helixa supports multilingual consultations. You can select your preferred language (English, Hindi, Kannada, Tamil, Telugu) when booking appointments so you can communicate comfortably."
  },
  {
    q: ['messaging', 'chat', 'message doctor', 'contact doctor'],
    a: "Helixa has built-in real-time messaging between patients and doctors. You can send text or voice messages, and doctors can initiate video or voice calls directly from the chat."
  },
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = typeof window !== 'undefined' ? import.meta.env?.VITE_GROQ_API_KEY : '';

const SYSTEM_PROMPT = `You are Helixa, a friendly AI assistant for the Helixa healthcare platform.
Helixa is an AI-powered healthcare web app with:
- AI Symptom Checker (powered by Groq AI)
- Patient & Doctor dashboards
- Real-time messaging with voice notes
- Appointment booking (video/voice call via Google Meet)
- Multilingual support (EN, Hindi, Kannada, Tamil, Telugu)
- Secure Firebase backend

Answer questions about Helixa concisely and helpfully. Keep responses under 3 sentences.
If asked about medical advice, always say to consult a real doctor.
Be warm, friendly, and conversational.`;

// ── KB lookup ─────────────────────────────────────────────────────────────────
const searchKB = (input) => {
  const lower = input.toLowerCase();
  for (const entry of KB) {
    if (entry.q.some(kw => lower.includes(kw))) return entry.a;
  }
  return null;
};

// ── Groq fallback ─────────────────────────────────────────────────────────────
const askGroq = async (messages) => {
  if (!GROQ_API_KEY) return "I'm having trouble connecting right now. Try asking again or explore the site!";
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 150,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "I'm not sure about that — try exploring the platform!";
  } catch {
    return "I'm having trouble connecting right now. Explore the site or sign up to get started!";
  }
};

// ── Helixa Logo (inline) ──────────────────────────────────────────────────────
const HelixaLogoIcon = ({ size = 28 }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="#7BBA91" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center">
      <Zap size={size * 0.45} className="text-helixa-teal fill-helixa-teal" strokeWidth={1} style={{ transform: 'translateY(-1px)' }} />
    </div>
  </div>
);

const SUGGESTIONS = [
  "What is Helixa?",
  "How does the symptom checker work?",
  "Is it free to use?",
  "Can I message my doctor?",
];

// ── Main Bot Component ────────────────────────────────────────────────────────
export const HelixaBot = ({ shiftLeft = false }) => {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm the Helixa assistant 👋 Ask me anything about the platform." }
  ]);
  const [input,   setInput]   = useState('');
  const [typing,  setTyping]  = useState(false);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');

    const userMsg = { role: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);

    // 1. Try KB first
    const kbAnswer = searchKB(msg);
    if (kbAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: kbAnswer }]);
        setTyping(false);
      }, 600);
      return;
    }

    // 2. Groq fallback
    const newHistory = [...history, { role: 'user', content: msg }];
    const answer = await askGroq(newHistory);
    setHistory([...newHistory, { role: 'assistant', content: answer }]);
    setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    setTyping(false);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={{ right: shiftLeft ? 408 : 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-6 z-50 w-14 h-14 bg-white border-2 border-helixa-green/30 rounded-2xl shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} className="text-helixa-teal" />
            </motion.div>
          ) : (
            <motion.div key="logo" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <HelixaLogoIcon size={30} />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <motion.div className="absolute inset-0 rounded-2xl border-2 border-helixa-green/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }} />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 20  }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-helixa-teal/10 flex flex-col overflow-hidden"
            style={{ right: shiftLeft ? 416 : 24, maxHeight: '480px' }}
          >
            {/* Header */}
            <div className="bg-helixa-teal px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <HelixaLogoIcon size={22} />
              </div>
              <div>
                <p className="text-sm font-black text-white">Helixa Assistant</p>
                <p className="text-[10px] text-white/60 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Online
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-[#f9f7f4]">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-helixa-green/20 mt-0.5">
                      <HelixaLogoIcon size={16} />
                    </div>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-helixa-teal text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-helixa-teal/10 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-helixa-green/20">
                    <HelixaLogoIcon size={16} />
                  </div>
                  <div className="px-3.5 py-3 bg-white rounded-2xl rounded-bl-sm border border-helixa-teal/10 shadow-sm flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-helixa-teal/40 rounded-full"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions — only on first message */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 bg-[#f9f7f4] flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    className="text-[11px] font-bold px-3 py-1.5 bg-white border border-helixa-teal/20 text-helixa-teal rounded-full hover:bg-helixa-teal hover:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 bg-white border-t border-helixa-teal/10 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask anything about Helixa..."
                className="flex-grow bg-[#f9f7f4] border border-helixa-teal/10 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-helixa-green placeholder:text-gray-400"
              />
              <button onClick={() => send()}
                className="w-9 h-9 bg-helixa-green rounded-xl flex items-center justify-center hover:bg-helixa-green/80 transition-colors flex-shrink-0">
                <Send size={15} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};