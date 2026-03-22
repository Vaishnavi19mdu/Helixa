// src/components/LanguageSwitcher.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const LanguageSwitcher = () => {
  const { lang, changeLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);

  const current = languages.find(l => l.code === lang) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-helixa-green/10 text-[var(--text-secondary)] hover:text-helixa-teal transition-colors text-sm font-bold"
      >
        <Globe size={16} />
        <span className="hidden sm:block">{current.native}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{   opacity: 0, y: -8,  scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute right-0 top-full mt-2 z-50 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden min-w-[160px]"
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] px-4 pt-3 pb-1">
                Language
              </p>
              {languages.map(l => (
                <button
                  key={l.code}
                  onClick={() => { changeLang(l.code); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors hover:bg-helixa-green/5 ${
                    lang === l.code ? 'text-helixa-green' : 'text-[var(--text-primary)]'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-black">{l.native}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold">{l.label}</p>
                  </div>
                  {lang === l.code && <Check size={14} className="text-helixa-green flex-shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};