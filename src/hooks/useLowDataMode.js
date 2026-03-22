// src/hooks/useLowDataMode.js
import { useState, useEffect } from 'react';

const KEY = 'helixa_low_data_mode';

export const useLowDataMode = () => {
  const [lowData, setLowData] = useState(() => localStorage.getItem(KEY) === 'true');

  const toggle = () => {
    const next = !lowData;
    setLowData(next);
    localStorage.setItem(KEY, String(next));
    // Add class to root for CSS targeting
    document.documentElement.classList.toggle('low-data', next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('low-data', lowData);
  }, []);

  return { lowData, toggle };
};