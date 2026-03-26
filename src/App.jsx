import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { initOfflineSync } from './utils/offlineQueue';
import { LanguageProvider } from './i18n/LanguageContext';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './utils/firebase';

import { Home }       from './pages/Home';
import { Login }      from './pages/Login';
import { Signup }     from './pages/Signup';
import { RoleSelect } from './pages/RoleSelect';
import { Dashboard }  from './pages/Dashboard';
import { Checker }    from './pages/Checker';
import { Results }    from './pages/Results';
import { Settings }   from './pages/Settings';
import { MainLayout } from './layouts/MainLayout';
import { Appointments } from './pages/Appointments';
import { Profile } from './pages/Profile';
import { Patients } from './pages/Patients';
import { AdminPanel } from './pages/AdminPanel';

// ── Loading screen while Firebase checks auth ─────────────────────────────────
const AuthLoading = () => (
  <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-helixa-green/30 border-t-helixa-green rounded-full animate-spin" />
      <p className="text-sm font-bold text-helixa-teal/50">Loading...</p>
    </div>
  </div>
);

// ── Protected route (non-admin users only) ────────────────────────────────────
const Protected = ({ user, authReady, children }) => {
  if (!authReady) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  // Admins always go to /admin, never regular pages
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

// ── Admin-only route ──────────────────────────────────────────────────────────
const AdminRoute = ({ user, authReady, children }) => {
  if (!authReady) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  const [user,      setUser]      = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [darkMode,  setDarkMode]  = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem('helixa-dark-mode') === 'true'
      : false
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('helixa-dark-mode', String(next));
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            setUser({ ...snap.data(), id: firebaseUser.uid });
          } else {
            setUser({ id: firebaseUser.uid, email: firebaseUser.email });
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => { initOfflineSync(); }, []);

  const sharedProps = { user, darkMode, toggleDarkMode };

  return (
    <LanguageProvider>
    <Router>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"            element={<Home darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
        <Route path="/login"       element={<Login setUser={setUser} />} />
        <Route path="/signup"      element={<Signup setUser={setUser} />} />
        <Route path="/role-select" element={<RoleSelect setUser={setUser} />} />

        {/* ── Admin only ── */}
        <Route path="/admin" element={
          <AdminRoute user={user} authReady={authReady}>
            <AdminPanel {...sharedProps} />
          </AdminRoute>
        } />

        {/* ── Protected (non-admin) ── */}
        <Route path="/dashboard" element={
          <Protected user={user} authReady={authReady}>
            <Dashboard {...sharedProps} />
          </Protected>
        } />
        <Route path="/checker" element={
          <Protected user={user} authReady={authReady}>
            <Checker user={user} />
          </Protected>
        } />
        <Route path="/results" element={
          <Protected user={user} authReady={authReady}>
            <Results user={user} />
          </Protected>
        } />
        <Route path="/settings" element={
          <Protected user={user} authReady={authReady}>
            <Settings {...sharedProps} setUser={setUser} />
          </Protected>
        } />
        <Route path="/profile-setup" element={
          <Protected user={user} authReady={authReady}>
            <Profile {...sharedProps} />
          </Protected>
        } />
        <Route path="/appointments" element={
          <Protected user={user} authReady={authReady}>
            <Appointments {...sharedProps} />
          </Protected>
        } />
        <Route path="/patients" element={
          <Protected user={user} authReady={authReady}>
            <Patients {...sharedProps} />
          </Protected>
        } />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </LanguageProvider>
  );
}

export default App;