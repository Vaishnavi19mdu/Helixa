// src/hooks/useNetworkQuality.js
import { useState, useEffect, useCallback, useRef } from 'react';

export const NETWORK_TIERS = {
  STRONG:   'strong',
  MODERATE: 'moderate',
  WEAK:     'weak',
  OFFLINE:  'offline',
};

const getTier = (downlink, effectiveType, isOnline) => {
  if (!isOnline) return NETWORK_TIERS.OFFLINE;

  // downlink is defined (Chrome/Android) — use it, it's the most accurate
  if (downlink !== undefined) {
    if (downlink >= 2.0) return NETWORK_TIERS.STRONG;
    if (downlink >= 1.0) return NETWORK_TIERS.MODERATE;
    if (downlink >= 0.3) return NETWORK_TIERS.WEAK;
    return NETWORK_TIERS.OFFLINE;
  }

  // FIX 1: effectiveType fallback for Firefox/Safari where downlink is undefined
  if (effectiveType) {
    if (effectiveType === '4g')                          return NETWORK_TIERS.STRONG;
    if (effectiveType === '3g')                          return NETWORK_TIERS.MODERATE;
    if (effectiveType === '2g' || effectiveType === 'slow-2g') return NETWORK_TIERS.WEAK;
  }

  // API fully unsupported — conservative fallback, not optimistic
  return NETWORK_TIERS.MODERATE;
};

export const useNetworkQuality = () => {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null;

  const getSnapshot = useCallback(() => {
    const isOnline      = navigator.onLine;
    const downlink      = connection?.downlink;
    const effectiveType = connection?.effectiveType;
    const rtt           = connection?.rtt;
    return {
      isOnline,
      downlink,
      effectiveType,
      rtt,
      tier:         getTier(downlink, effectiveType, isOnline),
      apiSupported: !!connection,
    };
  }, [connection]);

  const [quality, setQuality] = useState(getSnapshot);

  useEffect(() => {
    const update = () => setQuality(getSnapshot());
    window.addEventListener('online',  update);
    window.addEventListener('offline', update);
    connection?.addEventListener('change', update);
    return () => {
      window.removeEventListener('online',  update);
      window.removeEventListener('offline', update);
      connection?.removeEventListener('change', update);
    };
  }, [connection, getSnapshot]);

  const canCall     = quality.tier === NETWORK_TIERS.STRONG || quality.tier === NETWORK_TIERS.MODERATE;
  const callWarning = quality.tier === NETWORK_TIERS.MODERATE;
  const asyncOnly   = quality.tier === NETWORK_TIERS.WEAK || quality.tier === NETWORK_TIERS.OFFLINE;

  return { ...quality, canCall, callWarning, asyncOnly };
};