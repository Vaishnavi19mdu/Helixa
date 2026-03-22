import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Activity, Settings, LogOut, User,
  Menu, X, Moon, Sun, ChevronRight, Bell, Calendar,
  Users, FileText, Heart, Send, Clock, MessageSquare,
  ClipboardList, CheckCircle2, Circle, Trash2, Plus
} from 'lucide-react';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { MessagingPanel } from '../components/MessagingPanel';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { NotificationsPanel, useNotificationCount } from '../components/NotificationsPanel';
import { HelixaBot } from '../components/HelixaBot';
import { OfflineStatusDot, SyncToast } from '../components/OfflineBanner';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { TranslateWidget } from '../components/TranslateWidget';
import { useLanguage } from '../i18n/LanguageContext';
import { useOffline } from '../hooks/useOffline';

const WELLNESS_TIPS = [
  "You're doing important work. Take a moment to breathe 🌿",
  "Drink a glass of water. Doctors forget this most! 💧",
  "Quick stretch: roll your shoulders back 5 times.",
  "Lunch break is not optional — step away for 20 min.",
  "Check in with yourself — stress level 1-10?",
  "You've helped people today. That matters. 💚",
];

const SidebarWellnessBot = ({ showToast, toastSyncing, offlineQueueCount }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hey Doc 🌿 How are you holding up?" }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input.trim() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)]
      }]);
      setTyping(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-2 overflow-y-auto pr-0.5" style={{ maxHeight: 160 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-1.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium leading-relaxed max-w-[85%] ${
              m.role === 'bot' ? 'bg-helixa-green/10 text-[var(--text-primary)]' : 'bg-helixa-teal text-white'
            }`}>{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-1 px-2.5 py-2 bg-helixa-green/10 rounded-xl w-fit">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-1 h-1 bg-helixa-green rounded-full"
                animate={{ y: [0, -3, 0] }} transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-1.5">
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="How are you feeling?"
          className="flex-grow bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)]"
        />
        <button onClick={send} className="w-7 h-7 bg-helixa-green rounded-lg flex items-center justify-center hover:bg-helixa-green/80 transition-colors flex-shrink-0">
          <Send size={11} className="text-white" />
        </button>
      </div>
    </div>
  );
};

const patientNav = [
  {
    group: 'Main',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }]
  },
  {
    group: 'Health',
    items: [
      { icon: Activity,  label: 'Symptom Checker', path: '/checker', labelKey: 'symptomChecker' },
      { icon: FileText,  label: 'Results',          path: '/results', labelKey: 'results' },
      { icon: Calendar,  label: 'Appointments',     path: '/appointments', labelKey: 'appointments' },
    ]
  },
  {
    group: 'Account',
    items: [
      { icon: User,     label: 'Profile',  path: '/profile-setup', labelKey: 'profile' },
      { icon: Settings, label: 'Settings', path: '/settings',      labelKey: 'settings' },
    ]
  },
];

const doctorNav = [
  {
    group: 'Main',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }]
  },
  {
    group: 'Patients',
    items: [
      { icon: Users,    label: 'Patient List',  path: '/patients' },
      { icon: Calendar, label: 'Appointments',  path: '/appointments' },
    ]
  },
  {
    group: 'Account',
    items: [
      { icon: User,     label: 'Profile',  path: '/profile-setup', labelKey: 'profile' },
      { icon: Settings, label: 'Settings', path: '/settings',      labelKey: 'settings' },
    ]
  },
];

const avatarUrl = (firstName, lastName) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${firstName || 'U'}${lastName || ''}&backgroundColor=fde68a&radius=12`;

export const MainLayout = ({ children, user, darkMode, toggleDarkMode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [todaySlots,    setTodaySlots]    = useState([]);
  const [showChat,      setShowChat]      = useState(false);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const unreadCount = useUnreadCount(user?.id);
  const { showToast, toastSyncing, queueCount: offlineQueueCount } = useOffline();
  const { t } = useLanguage();
  const notifCount  = useNotificationCount(user?.id);
  const [showTasks,    setShowTasks]    = useState(false);
  const [tasks,        setTasks]        = useState([
    { id: 1, text: "Review Aarav's blood pressure report", done: false, priority: 'high'   },
    { id: 2, text: "Update Meera's medication dosage",     done: false, priority: 'high'   },
    { id: 3, text: "Sign off on Rohan's discharge summary",done: false, priority: 'medium' },
    { id: 4, text: "Call lab for Vikram's spirometry",     done: true,  priority: 'low'    },
  ]);
  const [newTaskText,     setNewTaskText]     = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const pendingTasks = tasks.filter(t => !t.done).length;
  const toggleTask = id => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = id => setTasks(prev => prev.filter(t => t.id !== id));
  const addTask    = () => {
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTaskText.trim(), done: false, priority: newTaskPriority }]);
    setNewTaskText('');
  };
  const priorityBadge = { high: 'bg-red-100 text-red-600', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-500' };
  const location = useLocation();
  const navigate = useNavigate();
  const isPublic = !user;

  useEffect(() => {
    if (!user?.id || user?.role !== 'doctor') return;
    const today = new Date().toISOString().split('T')[0];
    const fetchSlots = async () => {
      try {
        const q = query(
          collection(db, 'slots'),
          where('doctorId', '==', user.id),
          where('date', '==', today)
        );
        const snap = await getDocs(q);
        setTodaySlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Failed to fetch today slots:', err);
      }
    };
    fetchSlots();
  }, [user?.id, user?.role]);

  const navGroups = user?.role === 'doctor' ? doctorNav : patientNav;
  const isActive  = (path) => location.pathname === path;

  if (isPublic) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
        <nav className="fixed top-0 left-0 right-0 h-20 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)] z-50 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo className="w-10 h-10" iconClassName="w-5 h-5" showText={true} textClassName="text-2xl" />
          </Link>
          <div className="flex items-center gap-6">
            <button onClick={toggleDarkMode} className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-helixa-teal hover:border-helixa-green transition-all">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="text-sm font-bold text-helixa-teal/60 hover:text-helixa-teal transition-colors">Sign In</Link>
            <Link to="/role-select"><Button size="sm">Experience the Platform</Button></Link>
          </div>
        </nav>
        <main className="pt-20">{children}</main>
        <Footer darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        <SyncToast show={showToast} syncing={toastSyncing} count={offlineQueueCount} />
        <HelixaBot shiftLeft={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex transition-colors duration-300">

      {/* ── Sidebar ── */}
      <aside className={`fixed left-0 top-0 bottom-0 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] z-50 flex flex-col transition-all duration-300 overflow-y-auto ${isSidebarOpen ? 'w-72' : 'w-20'}`}>

        <div className="h-20 px-5 flex items-center border-b border-[var(--border-color)] flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <Logo className="w-9 h-9 flex-shrink-0" iconClassName="w-5 h-5" showText={isSidebarOpen} textClassName="text-xl" />
          </Link>
        </div>

        <nav className="py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.group}>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                    className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] px-3 mb-2">
                    {group.group}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link key={item.path} to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                      isActive(item.path) ? 'bg-helixa-green text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-helixa-green/10 hover:text-helixa-green'
                    }`}
                  >
                    <item.icon size={19} className="flex-shrink-0" />
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}
                          className="text-sm font-bold truncate">
                          {t.nav?.[item.labelKey] || item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive(item.path) && isSidebarOpen && <ChevronRight size={14} className="ml-auto flex-shrink-0" />}
                    {!isSidebarOpen && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-primary)] whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
              <div className="mt-4 border-t border-[var(--border-color)]" />
            </div>
          ))}
        </nav>

        {/* Doctor-only panels */}
        <AnimatePresence>
          {isSidebarOpen && user?.role === 'doctor' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-3 mt-2 mb-2 space-y-3">
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Calendar size={11} /> Today's Slots
                </p>
                {todaySlots.length === 0 ? (
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold italic">No slots today</p>
                ) : (
                  <div className="space-y-1.5">
                    {todaySlots.map(a => (
                      <div key={a.id} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-helixa-teal/10 text-helixa-teal font-black text-[10px] flex items-center justify-center flex-shrink-0">
                          {a.status === 'booked' ? a.bookedBy?.split(' ').map(w => w[0]).join('').slice(0, 2) : '—'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-[var(--text-primary)] truncate">
                            {a.status === 'booked' ? a.bookedBy : 'Open slot'}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                            <Clock size={9} /> {a.startTime} – {a.endTime}
                          </p>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${a.type === 'Video Call' ? 'bg-helixa-green/10 text-helixa-green' : 'bg-blue-100 text-blue-600'}`}>
                          {a.type === 'Video Call' ? '🎥' : '🎙️'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Heart size={11} className="text-helixa-green" /> Wellness
                </p>
                <SidebarWellnessBot
                  showToast={showToast}
                  toastSyncing={toastSyncing}
                  offlineQueueCount={offlineQueueCount}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom */}
        <div className="px-3 pb-5 pt-2 border-t border-[var(--border-color)] space-y-1 flex-shrink-0">
          <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-helixa-green/10 hover:text-helixa-green transition-all">
            {darkMode ? <Sun size={19} className="flex-shrink-0" /> : <Moon size={19} className="flex-shrink-0" />}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="text-sm font-bold">
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button onClick={() => navigate('/login')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-helixa-alert hover:bg-helixa-alert/10 transition-all">
            <LogOut size={19} className="flex-shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="text-sm font-bold">
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className={`flex-grow transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>

        <header className="h-20 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)] px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-helixa-green/10 rounded-xl text-helixa-teal transition-colors">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-xl font-black text-[var(--text-primary)] capitalize">
              {location.pathname.split('/')[1] || 'Dashboard'}
            </h2>
            <OfflineStatusDot />
          </div>

          <div className="flex items-center gap-3">
            {/* Translate + Language switcher — patient only */}
            {user?.role !== 'doctor' && (
              <>
                <TranslateWidget />
                <LanguageSwitcher />
              </>
            )}

            {/* Tasks — doctor only */}
            {user?.role === 'doctor' && (
              <button onClick={() => { setShowTasks(v => !v); setShowNotifs(false); setShowChat(false); }}
                className="relative p-2 hover:bg-helixa-green/10 rounded-xl text-[var(--text-secondary)] hover:text-helixa-teal transition-colors">
                <ClipboardList size={20} />
                {pendingTasks > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-helixa-teal rounded-full text-[9px] font-black text-white flex items-center justify-center">
                    {pendingTasks}
                  </span>
                )}
              </button>
            )}

            {/* Bell */}
            <button onClick={() => { setShowNotifs(v => !v); setShowChat(false); setShowTasks(false); }}
              className="relative p-2 hover:bg-helixa-green/10 rounded-xl text-[var(--text-secondary)] hover:text-helixa-teal transition-colors">
              <Bell size={20} />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-helixa-alert rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {/* Chat */}
            <button onClick={() => { setShowChat(v => !v); setShowNotifs(false); setShowTasks(false); }}
              className="relative p-2 hover:bg-helixa-green/10 rounded-xl text-[var(--text-secondary)] hover:text-helixa-teal transition-colors">
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-helixa-green rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {user?.role === 'doctor' ? `Dr. ${user.lastName}` : user?.firstName}
              </p>
              <p className="text-xs text-[var(--text-secondary)] capitalize">{user?.role}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-helixa-peach border-2 border-white shadow-sm overflow-hidden">
              <img
                src={user?.profilePic || avatarUrl(user?.firstName, user?.lastName)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        <main className="p-8 max-w-6xl mx-auto">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>

        {/* Tasks panel — doctor only */}
        <AnimatePresence>
          {showTasks && user?.role === 'doctor' && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowTasks(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed right-0 top-0 bottom-0 w-96 bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border-color)] flex-shrink-0">
                  <div>
                    <h3 className="font-black text-lg text-[var(--text-primary)]">Task List</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-bold">
                      {pendingTasks} pending · {tasks.filter(t => t.done).length} done
                    </p>
                  </div>
                  <button onClick={() => setShowTasks(false)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors">
                    <X size={18} className="text-[var(--text-secondary)]" />
                  </button>
                </div>

                {/* Task list */}
                <div className="flex-grow overflow-y-auto px-4 py-3 space-y-2">
                  <AnimatePresence initial={false}>
                    {tasks.map(task => (
                      <motion.div key={task.id} layout
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                        className={`flex items-center gap-3 p-3 rounded-2xl border group transition-all ${task.done ? 'bg-[var(--bg-secondary)] border-[var(--border-color)] opacity-60' : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:border-helixa-green/30'}`}>
                        <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                          {task.done
                            ? <CheckCircle2 size={18} className="text-helixa-green" />
                            : <Circle size={18} className="text-[var(--border-color)] hover:text-helixa-green transition-colors" />
                          }
                        </button>
                        <span className={`flex-grow text-sm font-medium leading-snug ${task.done ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                          {task.text}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${priorityBadge[task.priority]}`}>
                          {task.priority}
                        </span>
                        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={13} className="text-[var(--text-secondary)] hover:text-red-500" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Add task */}
                <div className="px-4 pb-5 pt-3 border-t border-[var(--border-color)] flex-shrink-0 space-y-2">
                  <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTask()}
                    placeholder="Add a new task..."
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)]" />
                  <div className="flex gap-2">
                    <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)}
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-helixa-green">
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">⚪ Low</option>
                    </select>
                    <button onClick={addTask}
                      className="flex-1 bg-helixa-green text-white rounded-xl text-xs font-black hover:bg-helixa-green/80 transition-colors flex items-center justify-center gap-1.5">
                      <Plus size={13} /> Add Task
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Notifications panel */}
        <AnimatePresence>
          {showNotifs && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowNotifs(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed right-0 top-0 bottom-0 w-96 bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col">
                <div className="flex justify-end px-4 pt-4 flex-shrink-0">
                  <button onClick={() => setShowNotifs(false)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors">
                    <X size={18} className="text-[var(--text-secondary)]" />
                  </button>
                </div>
                <div className="flex-grow overflow-hidden">
                  <NotificationsPanel user={user} onClose={() => setShowNotifs(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Messaging panel */}
        <AnimatePresence>
          {showChat && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowChat(false)} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed right-0 top-0 bottom-0 w-96 bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col">
                <div className="flex justify-end px-4 pt-4 flex-shrink-0">
                  <button onClick={() => setShowChat(false)} className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors">
                    <X size={18} className="text-[var(--text-secondary)]" />
                  </button>
                </div>
                <div className="flex-grow overflow-hidden">
                  <MessagingPanel user={user} onClose={() => setShowChat(false)} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <SyncToast show={showToast} syncing={toastSyncing} count={offlineQueueCount} />
        <HelixaBot shiftLeft={showChat || showNotifs} />
      </div>
    </div>
  );
};

const Footer = ({ darkMode, toggleDarkMode }) => (
  <footer className="py-12 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex flex-col gap-4">
        <Logo className="w-8 h-8" iconClassName="w-4 h-4" showText={true} textClassName="text-xl" />
        <p className="text-sm font-bold text-[var(--text-secondary)]">Built for better healthcare experiences.</p>
      </div>
      <div className="flex flex-col items-center md:items-end gap-6">
        <div className="flex gap-8 text-sm font-bold text-[var(--text-secondary)]">
          <a href="#" className="hover:text-helixa-green transition-colors">Privacy</a>
          <a href="#" className="hover:text-helixa-green transition-colors">Terms</a>
          <a href="#" className="hover:text-helixa-green transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">@helixa — with care</span>
          <button onClick={toggleDarkMode} className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-helixa-teal hover:border-helixa-green transition-all">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </div>
  </footer>
);