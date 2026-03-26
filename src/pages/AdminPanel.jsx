// src/pages/AdminPanel.jsx
// Full admin layout with sidebar — role: 'admin' gated
// Sections: Users, Doctor Approvals, Analytics, Notifications Broadcaster,
//           Appointments, Live Announcements

import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  collection, query, orderBy, onSnapshot, getDocs,
  doc, updateDoc, deleteDoc, addDoc, serverTimestamp,
  where, getCountFromServer, setDoc
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../utils/firebase';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ShieldCheck, BarChart3, Bell, CalendarDays,
  Megaphone, LogOut, ChevronRight, Search, Trash2, Ban,
  CheckCircle2, XCircle, Clock, TrendingUp, Activity,
  AlertTriangle, Loader2, Send, X, Eye, Sun, Moon,
  UserCheck, UserX, Zap, Globe, Heart
} from 'lucide-react';
import { AdminChatBot } from '../components/AdminChatBot';

// ── Guard ────────────────────────────────────────────────────────────────────
export const AdminPanel = ({ user, darkMode, toggleDarkMode }) => {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-helixa-alert/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-helixa-alert" />
          </div>
          <h2 className="text-2xl font-black text-helixa-teal mb-2">Access Denied</h2>
          <p className="text-[var(--text-secondary)] font-medium">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }
  return <AdminLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
};

// ── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV = [
  { id: 'analytics',      label: 'Analytics',         icon: BarChart3    },
  { id: 'users',          label: 'Users',              icon: Users        },
  { id: 'doctors',        label: 'Doctor Approvals',   icon: ShieldCheck  },
  { id: 'appointments',   label: 'Appointments',       icon: CalendarDays },
  { id: 'notifications',  label: 'Notifications',      icon: Bell         },
  { id: 'announcements',  label: 'Live Announcements', icon: Megaphone    },
];

// ── Layout ────────────────────────────────────────────────────────────────────
const AdminLayout = ({ user, darkMode, toggleDarkMode }) => {
  const [active, setActive] = useState('analytics');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const panels = {
    analytics:     <AnalyticsPanel />,
    users:         <UsersPanel />,
    doctors:       <DoctorApprovalsPanel />,
    appointments:  <AppointmentsPanel />,
    notifications: <NotificationsBroadcaster />,
    announcements: <AnnouncementsPanel />,
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col fixed h-full z-30">
        {/* Logo area */}
        <div className="px-6 py-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-helixa-green to-helixa-teal flex items-center justify-center shadow-md">
              <Heart size={18} className="text-white fill-white" />
            </div>
            <div>
              <p className="text-lg font-black text-helixa-teal tracking-tight">Helixa</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-helixa-green">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                active === id
                  ? 'bg-helixa-green text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:bg-helixa-green/8 hover:text-helixa-teal'
              }`}
            >
              <Icon size={18} />
              {label}
              {active === id && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </button>
          ))}
        </nav>

        {/* Bottom: user + dark toggle + logout */}
        <div className="px-4 py-4 border-t border-[var(--border-color)] space-y-3">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-[var(--text-secondary)] hover:bg-helixa-green/8 hover:text-helixa-teal transition-colors"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <div className="flex items-center gap-3 px-2">
            <img
              src={user?.profilePic || `https://ui-avatars.com/api/?name=${user?.firstName || 'A'}&background=7BBA91&color=fff`}
              alt="Admin"
              className="w-8 h-8 rounded-full object-cover border-2 border-helixa-green/30"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-[var(--text-primary)] truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-helixa-green font-black uppercase tracking-wider">Admin</p>
            </div>
          </div>
          {/* ── Logout button ── */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Topbar */}
        <div className="sticky top-0 z-20 h-16 bg-[var(--bg-secondary)]/80 backdrop-blur-md border-b border-[var(--border-color)] flex items-center px-8 gap-4">
          <div>
            <h1 className="text-xl font-black text-helixa-teal">
              {NAV.find(n => n.id === active)?.label}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)]">
            <Zap size={12} className="text-helixa-green" />
            Live • Firestore
          </div>
        </div>

        {/* Panel */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {panels[active]}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Floating AI Chat Bot ── */}
      <AdminChatBot />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ANALYTICS PANEL
// ══════════════════════════════════════════════════════════════════════════════
const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)] flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-3xl font-black text-[var(--text-primary)]">{value ?? '—'}</p>
      <p className="text-sm font-bold text-[var(--text-secondary)] mt-0.5">{label}</p>
      {sub && <p className="text-xs text-helixa-green font-bold mt-1">{sub}</p>}
    </div>
  </div>
);

const AnalyticsPanel = () => {
  const [stats, setStats] = useState({
    totalUsers: null, patients: null, doctors: null,
    admins: null, symptomChecks: null, appointments: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap       = await getCountFromServer(collection(db, 'users'));
        const patientsSnap    = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'patient')));
        const doctorsSnap     = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'doctor')));
        const adminsSnap      = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin')));
        const symptomsSnap    = await getCountFromServer(collection(db, 'symptomResults'));
        const appointSnap     = await getCountFromServer(collection(db, 'appointments'));

        setStats({
          totalUsers:    usersSnap.data().count,
          patients:      patientsSnap.data().count,
          doctors:       doctorsSnap.data().count,
          admins:        adminsSnap.data().count,
          symptomChecks: symptomsSnap.data().count,
          appointments:  appointSnap.data().count,
        });
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard label="Total Users"     value={stats.totalUsers}    icon={Users}        color="bg-helixa-teal"              sub="All registered accounts" />
        <StatCard label="Patients"        value={stats.patients}      icon={Heart}        color="bg-helixa-green"             sub="Patient accounts" />
        <StatCard label="Doctors"         value={stats.doctors}       icon={ShieldCheck}  color="bg-blue-500"                 sub="Verified + pending" />
        <StatCard label="Admins"          value={stats.admins}        icon={Zap}          color="bg-purple-500"               sub="Admin accounts" />
        <StatCard label="Symptom Checks"  value={stats.symptomChecks} icon={Activity}     color="bg-amber-500"                sub="Total AI analyses run" />
        <StatCard label="Appointments"    value={stats.appointments}  icon={CalendarDays} color="bg-rose-500"                 sub="Total booked" />
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 border border-[var(--border-color)]">
        <h3 className="font-black text-[var(--text-primary)] mb-1">Recent Activity</h3>
        <p className="text-sm text-[var(--text-secondary)] font-medium mb-4">Last 10 users to join</p>
        <RecentUsersList />
      </div>
    </div>
  );
};

const RecentUsersList = () => {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.slice(0, 10).map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-2">
      {users.length === 0 && <p className="text-sm text-[var(--text-secondary)] italic">No users yet.</p>}
      {users.map(u => (
        <div key={u.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-color)] last:border-0">
          <img
            src={u.profilePic || `https://ui-avatars.com/api/?name=${u.firstName || 'U'}&background=7BBA91&color=fff`}
            className="w-8 h-8 rounded-full object-cover"
            alt=""
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[var(--text-primary)] truncate">{u.firstName} {u.lastName}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{u.email}</p>
          </div>
          <RoleBadge role={u.role} />
        </div>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// USERS PANEL
// ══════════════════════════════════════════════════════════════════════════════
const RoleBadge = ({ role }) => {
  const map = {
    admin:   'bg-purple-100 text-purple-700',
    doctor:  'bg-blue-100 text-blue-700',
    patient: 'bg-helixa-green/10 text-helixa-green',
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${map[role] || 'bg-gray-100 text-gray-600'}`}>
      {role || 'user'}
    </span>
  );
};

const UsersPanel = () => {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  const banUser = async (userId, banned) => {
    setActionLoading(userId + 'ban');
    await updateDoc(doc(db, 'users', userId), { banned: !banned });
    setActionLoading(null);
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    setActionLoading(userId + 'del');
    await deleteDoc(doc(db, 'users', userId));
    setActionLoading(null);
  };

  const changeRole = async (userId, newRole) => {
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green"
          />
        </div>
        {['all', 'patient', 'doctor', 'admin'].map(r => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === r ? 'bg-helixa-green text-white' : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-green'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-helixa-green" size={28} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-[var(--text-secondary)] italic">No users found.</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-helixa-green/3 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.profilePic || `https://ui-avatars.com/api/?name=${u.firstName || 'U'}&background=7BBA91&color=fff`}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        alt=""
                      />
                      <div>
                        <p className="font-black text-[var(--text-primary)]">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{u.id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)] max-w-[180px] truncate">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <select
                      value={u.role || 'patient'}
                      onChange={e => changeRole(u.id, e.target.value)}
                      className="text-xs font-black rounded-lg px-2 py-1 border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-helixa-green"
                    >
                      <option value="patient">Patient</option>
                      <option value="doctor">Doctor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.banned
                      ? <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600">Banned</span>
                      : <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-600">Active</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => banUser(u.id, u.banned)}
                        disabled={actionLoading === u.id + 'ban'}
                        title={u.banned ? 'Unban' : 'Ban'}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors disabled:opacity-40"
                      >
                        {actionLoading === u.id + 'ban'
                          ? <Loader2 size={15} className="animate-spin" />
                          : u.banned ? <UserCheck size={15} /> : <Ban size={15} />
                        }
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        disabled={actionLoading === u.id + 'del'}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors disabled:opacity-40"
                      >
                        {actionLoading === u.id + 'del'
                          ? <Loader2 size={15} className="animate-spin" />
                          : <Trash2 size={15} />
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-[var(--text-secondary)] font-bold">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// DOCTOR APPROVALS PANEL
// ══════════════════════════════════════════════════════════════════════════════
const DoctorApprovalsPanel = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('pending');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
    const unsub = onSnapshot(q, snap => {
      setDoctors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const approve = async (id) => {
    await updateDoc(doc(db, 'users', id), { doctorStatus: 'approved' });
    await addDoc(collection(db, 'notifications', id, 'items'), {
      title: '🎉 Application Approved',
      message: 'Your doctor account has been approved by Helixa admin. You can now accept patients.',
      type: 'appointment',
      read: false,
      createdAt: serverTimestamp(),
    });
  };

  const reject = async (id) => {
    await updateDoc(doc(db, 'users', id), { doctorStatus: 'rejected' });
    await addDoc(collection(db, 'notifications', id, 'items'), {
      title: 'Application Not Approved',
      message: 'Your doctor application was not approved. Please contact support for more information.',
      type: 'alert',
      read: false,
      createdAt: serverTimestamp(),
    });
  };

  const filtered = doctors.filter(d =>
    tab === 'pending'  ? (!d.doctorStatus || d.doctorStatus === 'pending') :
    tab === 'approved' ? d.doctorStatus === 'approved' :
    d.doctorStatus === 'rejected'
  );

  const counts = {
    pending:  doctors.filter(d => !d.doctorStatus || d.doctorStatus === 'pending').length,
    approved: doctors.filter(d => d.doctorStatus === 'approved').length,
    rejected: doctors.filter(d => d.doctorStatus === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[
          { id: 'pending',  label: 'Pending',  color: 'amber' },
          { id: 'approved', label: 'Approved', color: 'green' },
          { id: 'rejected', label: 'Rejected', color: 'red'   },
        ].map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
              tab === id ? 'bg-helixa-green text-white shadow-md' : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-green'
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              tab === id ? 'bg-white/20 text-white' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
            }`}>{counts[id]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-helixa-green" size={28} /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] py-16 text-center">
          <ShieldCheck size={32} className="text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="font-black text-[var(--text-primary)]">No {tab} applications</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(d => (
            <div key={d.id} className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 flex flex-wrap items-start gap-4">
              <img
                src={d.profilePic || `https://ui-avatars.com/api/?name=${d.firstName || 'D'}&background=007099&color=fff`}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[var(--border-color)]"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-lg text-[var(--text-primary)]">Dr. {d.firstName} {d.lastName}</p>
                <p className="text-sm text-[var(--text-secondary)]">{d.email}</p>
                {d.specialty && <p className="text-xs font-bold text-helixa-teal mt-1">Specialty: {d.specialty}</p>}
                {d.licenseNumber && <p className="text-xs text-[var(--text-secondary)] mt-0.5">License: {d.licenseNumber}</p>}
                {d.hospital && <p className="text-xs text-[var(--text-secondary)]">Hospital: {d.hospital}</p>}
              </div>
              {tab === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(d.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-helixa-green text-white rounded-xl text-sm font-black hover:bg-helixa-green/80 transition-colors"
                  >
                    <CheckCircle2 size={15} /> Approve
                  </button>
                  <button
                    onClick={() => reject(d.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-black hover:bg-red-200 transition-colors"
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              )}
              {tab !== 'pending' && (
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${
                  tab === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {tab}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// APPOINTMENTS PANEL
// ══════════════════════════════════════════════════════════════════════════════
const AppointmentsPanel = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = appointments.filter(a =>
    filter === 'all' || a.status === filter
  );

  const statusBadge = (status) => {
    const map = {
      pending:   'bg-amber-100 text-amber-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return (
      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>
        {status || 'unknown'}
      </span>
    );
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filter === s ? 'bg-helixa-green text-white' : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-green'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-helixa-green" size={28} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                {['Patient', 'Doctor', 'Date', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[var(--text-secondary)] italic">No appointments found.</td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-helixa-green/3 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[var(--text-primary)]">{a.patientName || a.patientId?.slice(0,8) || '—'}</td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">{a.doctorName || a.doctorId?.slice(0,8) || '—'}</td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">{formatDate(a.date || a.createdAt)}</td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)] capitalize">{a.type || 'General'}</td>
                  <td className="px-5 py-3.5">{statusBadge(a.status)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => deleteDoc(doc(db, 'appointments', a.id))}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-[var(--text-secondary)] font-bold">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS BROADCASTER
// ══════════════════════════════════════════════════════════════════════════════
const NotificationsBroadcaster = () => {
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [type,    setType]    = useState('info');
  const [target,  setTarget]  = useState('all');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const send = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      const usersSnap = await getDocs(
        target === 'all'
          ? collection(db, 'users')
          : query(collection(db, 'users'), where('role', '==', target))
      );

      const users = usersSnap.docs;

      for (let i = 0; i < users.length; i++) {
        await addDoc(collection(db, 'notifications', users[i].id, 'items'), {
          title:     title.trim(),
          message:   message.trim(),
          type,
          read:      false,
          createdAt: serverTimestamp(),
          sentBy:    'admin',
        });
      }

      setSent(true);
      setTitle(''); setMessage('');
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error('Broadcast failed:', err);
    } finally {
      setSending(false);
    }
  };

  const typeOptions = ['info', 'alert', 'appointment', 'result', 'message'];

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-6 space-y-5">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Send To</label>
          <div className="flex gap-2 flex-wrap">
            {['all', 'patient', 'doctor', 'admin'].map(t => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  target === t ? 'bg-helixa-green text-white' : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-green'
                }`}
              >
                {t === 'all' ? '🌐 All Users' : t === 'patient' ? '🧑 Patients' : t === 'doctor' ? '👨‍⚕️ Doctors' : '⚡ Admins'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Notification Type</label>
          <div className="flex gap-2 flex-wrap">
            {typeOptions.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all ${
                  type === t ? 'bg-helixa-teal text-white' : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-teal'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Notification title…"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your notification message here…"
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)] resize-none"
          />
        </div>

        <button
          onClick={send}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-helixa-green text-white rounded-xl font-black text-sm hover:bg-helixa-green/80 transition-colors disabled:opacity-40"
        >
          {sending
            ? <><Loader2 size={16} className="animate-spin" /> Sending…</>
            : sent
            ? <><CheckCircle2 size={16} /> Sent!</>
            : <><Send size={16} /> Broadcast Notification</>
          }
        </button>

        <AnimatePresence>
          {sent && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-bold"
            >
              <CheckCircle2 size={16} /> Notification broadcasted successfully!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-helixa-teal/5 border border-helixa-teal/20 rounded-2xl p-4 text-sm text-[var(--text-secondary)] font-medium">
        <p className="font-black text-[var(--text-primary)] mb-1 flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Heads up</p>
        This will send a notification to every user matching your selected target. Use carefully.
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// LIVE ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════════════════════
const AnnouncementsPanel = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [compose, setCompose] = useState(false);
  const [form, setForm]       = useState({ title: '', body: '', pinned: false, type: 'info' });
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const publish = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...form,
        createdAt: serverTimestamp(),
        active: true,
      });
      setForm({ title: '', body: '', pinned: false, type: 'info' });
      setCompose(false);
    } catch (err) {
      console.error('Publish failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id, active) => {
    await updateDoc(doc(db, 'announcements', id), { active: !active });
  };

  const deleteAnnouncement = async (id) => {
    await deleteDoc(doc(db, 'announcements', id));
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const typeColor = { info: 'bg-blue-100 text-blue-700', alert: 'bg-red-100 text-red-700', update: 'bg-helixa-green/10 text-helixa-green', maintenance: 'bg-amber-100 text-amber-700' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)] font-bold">{announcements.length} total announcement{announcements.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setCompose(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-helixa-green text-white rounded-xl text-sm font-black hover:bg-helixa-green/80 transition-colors"
        >
          {compose ? <X size={16} /> : <Megaphone size={16} />}
          {compose ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      <AnimatePresence>
        {compose && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-helixa-green/30 p-6 space-y-4">
              <p className="font-black text-[var(--text-primary)] flex items-center gap-2"><Megaphone size={16} className="text-helixa-green" /> New Announcement</p>
              
              <div className="flex gap-2 flex-wrap">
                {['info', 'alert', 'update', 'maintenance'].map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black capitalize transition-all ${
                      form.type === t ? 'bg-helixa-teal text-white' : 'bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title…"
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green"
              />
              <textarea
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Announcement body…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green resize-none"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                  className="accent-helixa-green"
                />
                <span className="text-sm font-bold text-[var(--text-secondary)]">Pin this announcement</span>
              </label>
              <button
                onClick={publish}
                disabled={saving || !form.title.trim() || !form.body.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-helixa-green text-white rounded-xl text-sm font-black hover:bg-helixa-green/80 disabled:opacity-40 transition-colors"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Publish Live
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-helixa-green" size={28} /></div>
      ) : announcements.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] py-16 text-center">
          <Megaphone size={32} className="text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="font-black text-[var(--text-primary)]">No announcements yet</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Click "New Announcement" to publish one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div
              key={a.id}
              className={`bg-[var(--bg-secondary)] rounded-2xl border p-5 flex gap-4 items-start ${
                a.pinned ? 'border-helixa-green/40' : 'border-[var(--border-color)]'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {a.pinned && <span className="text-[10px] font-black px-2 py-0.5 bg-helixa-green/10 text-helixa-green rounded-full uppercase tracking-wider">📌 Pinned</span>}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${typeColor[a.type] || typeColor.info}`}>{a.type}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${a.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.active ? 'Live' : 'Inactive'}
                  </span>
                </div>
                <p className="font-black text-[var(--text-primary)]">{a.title}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{a.body}</p>
                <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-2">{formatDate(a.createdAt)}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => toggleActive(a.id, a.active)}
                  title={a.active ? 'Deactivate' : 'Activate'}
                  className={`p-1.5 rounded-lg transition-colors ${a.active ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-green-50 text-green-600'}`}
                >
                  {a.active ? <Eye size={15} /> : <CheckCircle2 size={15} />}
                </button>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};