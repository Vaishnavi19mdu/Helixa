// src/hooks/useUnreadCount.js
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const useUnreadCount = (userId) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );
    const unsub = onSnapshot(q, snap => {
      setCount(
        snap.docs.reduce((acc, d) => acc + (d.data().unread?.[userId] || 0), 0)
      );
    });
    return () => unsub();
  }, [userId]);

  return count;
};