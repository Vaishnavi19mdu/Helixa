// src/components/TranslateWidget.jsx
// Claude AI powered translator — paste any word, get it in your chosen language
// Floats as a pill button, opens a compact popup on click

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, X, Copy, Check, Loader, Zap } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English',  native: 'English'  },
  { code: 'ta', label: 'Tamil',    native: 'தமிழ்'    },
  { code: 'hi', label: 'Hindi',    native: 'हिन्दी'   },
  { code: 'te', label: 'Telugu',   native: 'తెలుగు'   },
  { code: 'kn', label: 'Kannada',  native: 'ಕನ್ನಡ'    },
  { code: 'ml', label: 'Malayalam',native: 'മലയാളം'   },
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const translateText = async (text, targetLang) => {
  const langName = LANGUAGES.find(l => l.code === targetLang)?.label || targetLang;
  const native   = LANGUAGES.find(l => l.code === targetLang)?.native || langName;

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       'llama-3.1-8b-instant',
      max_tokens:  200,
      temperature: 0.1,
      messages: [{
        role:    'system',
        content: `You are a medical translator. Translate text accurately to ${langName} (${native} script). Return ONLY the translation — no explanations, no quotes, no labels.`,
      }, {
        role:    'user',
        content: `Translate to ${langName}: ${text}`,
      }],
    }),
  });

  const data = await res.json();
  const result = data.choices?.[0]?.message?.content?.trim();
  if (!result) throw new Error('Empty response from Groq');
  return result;
};

export const TranslateWidget = ({ defaultLang = 'ta' }) => {
  const [open,       setOpen]       = useState(false);
  const [input,      setInput]      = useState('');
  const [targetLang, setTargetLang] = useState(defaultLang);
  const [result,     setResult]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState('');
  const popupRef = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult('');
    setError('');
    try {
      const translated = await translateText(input.trim(), targetLang);
      setResult(translated);
    } catch (err) {
      setError('Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleTranslate();
  };

  return (
    <div className="relative" ref={popupRef}>
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-helixa-green/10 hover:bg-helixa-green/20 text-helixa-green font-bold text-sm transition-colors border border-helixa-green/20"
      >
        <Languages size={15} />
        <span className="hidden sm:block">Translate</span>
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -8 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: -8  }}
            transition={{ type: 'spring', stiffness: 320, damping: 25 }}
            className="absolute right-0 top-full mt-2 z-50 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-helixa-green/10 flex items-center justify-center">
                  <Zap size={12} className="text-helixa-green" />
                </div>
                <p className="text-sm font-black text-[var(--text-primary)]">AI Translator</p>
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-helixa-green/10 text-helixa-green rounded-full">Groq AI</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                <X size={14} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Language pills */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Translate to</p>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setTargetLang(l.code); setResult(''); }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        targetLang === l.code
                          ? 'bg-helixa-green text-white shadow-sm'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-helixa-green/10 hover:text-helixa-green border border-[var(--border-color)]'
                      }`}
                    >
                      {l.native}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Paste word or phrase</p>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. fever, chest pain, shortness of breath..."
                  rows={2}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)] resize-none"
                  spellCheck={true}
                  autoCorrect="on"
                />
                <p className="text-[10px] text-[var(--text-secondary)] font-bold">Ctrl+Enter to translate</p>
              </div>

              {/* Translate button */}
              <button
                onClick={handleTranslate}
                disabled={loading || !input.trim()}
                className="w-full py-2.5 bg-helixa-green text-white rounded-xl text-sm font-black hover:bg-helixa-green/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader size={14} className="animate-spin" /> Translating...</>
                ) : (
                  <><Languages size={14} /> Translate</>
                )}
              </button>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-helixa-green/5 border border-helixa-green/20 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-[var(--text-primary)] leading-relaxed flex-grow">{result}</p>
                      <button
                        onClick={handleCopy}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-helixa-green/10 transition-colors"
                        title="Copy"
                      >
                        {copied
                          ? <Check size={13} className="text-helixa-green" />
                          : <Copy size={13} className="text-[var(--text-secondary)]" />
                        }
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-1.5">
                      → {LANGUAGES.find(l => l.code === targetLang)?.label}
                    </p>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};