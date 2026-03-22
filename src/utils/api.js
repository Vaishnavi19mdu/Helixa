// src/utils/api.js
// ─── All Firebase Auth + Firestore calls live here ───────────────────────────

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, collection,
  addDoc, getDocs, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export const api = {

  // ── Auth ───────────────────────────────────────────────────────────────────

  // Creates Firebase Auth user + saves profile to Firestore /users/{uid}
  signup: async ({ firstName, lastName, email, password, role, profile }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    const userData = {
      uid,
      firstName,
      lastName,
      email,
      role,       // 'patient' | 'doctor'
      profile: profile || {},
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', uid), userData);
    return { user: { ...userData, id: uid } };
  },

  // Signs in + fetches Firestore profile
  login: async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;

    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) throw new Error('User profile not found.');

    return { user: { ...snap.data(), id: uid } };
  },

  logout: async () => {
    await signOut(auth);
  },

  // ── Symptom History ────────────────────────────────────────────────────────

  // Call this after Groq returns a result — saves to /users/{uid}/symptomHistory
  saveSymptomResult: async (uid, symptoms, result) => {
    const ref = collection(db, 'users', uid, 'symptomHistory');
    await addDoc(ref, {
      symptoms,
      result,     // { condition, confidence, description, recommendations }
      createdAt: serverTimestamp(),
    });
  },

  // Fetch all past checks ordered newest first
  getSymptomHistory: async (uid) => {
    const ref  = collection(db, 'users', uid, 'symptomHistory');
    const q    = query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ── Appointments ───────────────────────────────────────────────────────────

  bookAppointment: async (uid, appointmentData) => {
    const ref    = collection(db, 'users', uid, 'appointments');
    const docRef = await addDoc(ref, {
      ...appointmentData,
      status: 'upcoming',
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...appointmentData };
  },

  getAppointments: async (uid) => {
    const ref  = collection(db, 'users', uid, 'appointments');
    const q    = query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};