// src/pages/Settings.jsx
import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AvatarUpload } from '../components/AvatarUpload';
import {
  Bell, Shield, User, Moon, HelpCircle,
  Wifi, WifiOff, RotateCcw, Trash2, CheckCircle2, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOffline } from '../hooks/useOffline';
import { useLowDataMode } from '../hooks/useLowDataMode';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

const sections = [
  { id: 'account',       icon: User,        title: 'Account Settings',   },
  { id: 'notifications', icon: Bell,        title: 'Notifications',      },
  { id: 'privacy',       icon: Shield,      title: 'Privacy & Security', },
  { id: 'connectivity',  icon: Wifi,        title: 'Connectivity',       },
  { id: 'appearance',    icon: Moon,        title: 'Appearance',         },
  { id: 'help',          icon: HelpCircle,  title: 'Support & Help',     },
];

export const Settings = ({ user, setUser, darkMode, toggleDarkMode }) => {
  const [activeSection, setActiveSection] = useState('account');
  const { isOffline, queueCount, syncing, retrySync } = useOffline();
  const { lowData, toggle: toggleLowData } = useLowDataMode();
  const [syncResult, setSyncResult] = useState(null);

  // ── Save uploaded Cloudinary URL → local state + Firestore ──
  const handleAvatarUpload = async (url) => {
    // Immediately update header avatar via parent state
    if (setUser) setUser(prev => ({ ...prev, profilePic: url }));

    // Persist to Firestore so it loads on next login
    try {
      if (user?.id) {
        await updateDoc(doc(db, 'users', user.id), { profilePic: url });
      }
    } catch (err) {
      console.error('Failed to save avatar:', err);
    }
  };

  const handleSync = async () => {
    const result = await retrySync();
    setSyncResult(result);
    setTimeout(() => setSyncResult(null), 3000);
  };

  const clearQueue = () => {
    localStorage.removeItem('helixa_offline_queue');
    window.dispatchEvent(new CustomEvent('helixa:queue-updated', { detail: { count: 0 } }));
  };

  return (
    <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] mb-8">Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Sidebar Nav */}
          <div className="space-y-1">
            {sections.map((s) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left ${
                  activeSection === s.id
                    ? 'bg-helixa-green text-white shadow-lg'
                    : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                }`}>
                <s.icon size={20} />
                <span className="font-bold text-sm">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <AnimatePresence mode="wait">

              {/* ── Account ── */}
              {activeSection === 'account' && (
                <motion.div key="account" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  <Card title="Personal Information">
                    <div className="space-y-4 mt-4">
                      <AvatarUpload
                        currentAvatar={user?.profilePic}
                        firstName={user?.firstName}
                        onUploadSuccess={handleAvatarUpload}
                      />
                      <div className="border-t border-[var(--border-color)]" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="First Name" defaultValue={user?.firstName} />
                        <Input label="Last Name"  defaultValue={user?.lastName} />
                      </div>
                      <Input label="Email Address" defaultValue={user?.email} disabled />
                      <Button className="px-8">Save Changes</Button>
                    </div>
                  </Card>

                  <Card title="Security">
                    <div className="space-y-4 mt-4">
                      <Input label="Current Password" type="password" placeholder="••••••••" />
                      <Input label="New Password"     type="password" placeholder="••••••••" />
                      <Button variant="outline" className="px-8">Update Password</Button>
                    </div>
                  </Card>

                  <Card className="bg-helixa-alert/5 border-helixa-alert/20">
                    <h3 className="text-helixa-alert font-bold mb-2">Danger Zone</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">Once you delete your account, there is no going back.</p>
                    <Button variant="alert" className="px-8">Delete Account</Button>
                  </Card>
                </motion.div>
              )}

              {/* ── Connectivity ── */}
              {activeSection === 'connectivity' && (
                <motion.div key="connectivity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  <Card title="Connection Status">
                    <div className="mt-4 space-y-4">
                      <div className={`flex items-center justify-between p-4 rounded-2xl border ${isOffline ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-center gap-3">
                          {isOffline ? <WifiOff size={20} className="text-amber-600" /> : <Wifi size={20} className="text-green-600" />}
                          <div>
                            <p className={`text-sm font-black ${isOffline ? 'text-amber-800' : 'text-green-800'}`}>
                              {isOffline ? 'You are offline' : 'Connected'}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] font-bold">
                              {isOffline ? 'Data will sync when you reconnect' : 'All features available'}
                            </p>
                          </div>
                        </div>
                        <span className={`w-3 h-3 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-green-500'} ${!isOffline ? 'animate-pulse' : ''}`} />
                      </div>
                    </div>
                  </Card>

                  <Card title="Offline Queue" subtitle="Data saved locally, waiting to sync">
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                        <div>
                          <p className="text-sm font-black text-[var(--text-primary)]">{queueCount} item{queueCount !== 1 ? 's' : ''} pending</p>
                          <p className="text-xs text-[var(--text-secondary)] font-bold">
                            {queueCount === 0 ? 'Nothing to sync' : 'Will auto-sync when online'}
                          </p>
                        </div>
                        {queueCount > 0 && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={clearQueue} className="flex items-center gap-1 text-helixa-alert border-helixa-alert/30">
                              <Trash2 size={13} /> Clear
                            </Button>
                            {!isOffline && (
                              <Button size="sm" onClick={handleSync} disabled={syncing} className="flex items-center gap-1">
                                <RotateCcw size={13} className={syncing ? 'animate-spin' : ''} />
                                {syncing ? 'Syncing...' : 'Sync Now'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      <AnimatePresence>
                        {syncResult && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-2xl text-xs font-bold text-green-700">
                            <CheckCircle2 size={14} /> Synced {syncResult.synced} item{syncResult.synced !== 1 ? 's' : ''}
                            {syncResult.failed > 0 && ` · ${syncResult.failed} failed`}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </Card>

                  <Card title="Low Data Mode" subtitle="Reduces bandwidth — disables animations and heavy UI">
                    <div className="mt-4">
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${lowData ? 'bg-helixa-green/10 text-helixa-green' : 'bg-[var(--border-color)] text-[var(--text-secondary)]'}`}>
                            <Zap size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-[var(--text-primary)]">Low Data Mode</p>
                            <p className="text-xs text-[var(--text-secondary)] font-bold">
                              {lowData ? 'Active — animations disabled' : 'Off — full experience'}
                            </p>
                          </div>
                        </div>
                        <button onClick={toggleLowData}
                          className={`relative w-12 h-6 rounded-full transition-colors ${lowData ? 'bg-helixa-green' : 'bg-[var(--border-color)]'}`}>
                          <motion.div
                            animate={{ x: lowData ? 24 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                      {lowData && (
                        <p className="text-xs text-[var(--text-secondary)] font-bold mt-2 px-1">
                          ⚡ Low Data Mode is active. Animations, heavy images and non-essential UI are disabled.
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ── Appearance ── */}
              {activeSection === 'appearance' && (
                <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card title="Theme">
                    <div className="mt-4 flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                      <div>
                        <p className="text-sm font-black text-[var(--text-primary)]">Dark Mode</p>
                        <p className="text-xs text-[var(--text-secondary)] font-bold">{darkMode ? 'Currently dark' : 'Currently light'}</p>
                      </div>
                      <button onClick={toggleDarkMode}
                        className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-helixa-teal' : 'bg-[var(--border-color)]'}`}>
                        <motion.div
                          animate={{ x: darkMode ? 24 : 2 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ── Notifications ── */}
              {activeSection === 'notifications' && (
                <motion.div key="notifications" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card title="Notification Preferences">
                    <div className="mt-4 space-y-3">
                      {['New messages', 'Appointment reminders', 'Symptom report updates', 'System alerts'].map(pref => (
                        <div key={pref} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
                          <p className="text-sm font-bold text-[var(--text-primary)]">{pref}</p>
                          <div className="relative w-12 h-6 rounded-full bg-helixa-green cursor-pointer">
                            <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ── Privacy ── */}
              {activeSection === 'privacy' && (
                <motion.div key="privacy" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card title="Privacy & Security">
                    <div className="mt-4 space-y-4">
                      <div className="p-4 bg-helixa-green/5 border border-helixa-green/20 rounded-2xl text-sm text-[var(--text-secondary)] font-bold leading-relaxed">
                        🔒 Your health data is encrypted at rest and in transit. We never sell your data to third parties.
                      </div>
                      <Button variant="outline" className="px-8">Download My Data</Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ── Help ── */}
              {activeSection === 'help' && (
                <motion.div key="help" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card title="Support & Help">
                    <div className="mt-4 space-y-3">
                      {['FAQs', 'Contact Support', 'Report a Bug', 'Privacy Policy', 'Terms of Service'].map(item => (
                        <button key={item} className="w-full flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl hover:bg-[var(--border-color)] transition-colors">
                          <p className="text-sm font-bold text-[var(--text-primary)]">{item}</p>
                          <span className="text-[var(--text-secondary)]">→</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};