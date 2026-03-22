// src/i18n/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, languages } from './translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() =>
    localStorage.getItem('helixa_lang') || 'en'
  );

  const changeLang = (code) => {
    setLang(code);
    localStorage.setItem('helixa_lang', code);
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};