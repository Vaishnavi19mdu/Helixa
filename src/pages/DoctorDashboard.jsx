// src/pages/DoctorDashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {
  Bell, CheckCircle2, Circle, Users, Activity, Calendar,
  ArrowUpRight, Clock, AlertTriangle, Plus, X, ChevronRight,
  FileText, User, Trash2, CheckCheck, Heart, TrendingUp,
  Search, MessageSquare, Zap, ShieldAlert, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Mock data ─────────────────────────────────────────────────────────────────
const mockPatients = [
  { id: 'p1', name: 'Aarav Sharma',  condition: 'Hypertension',     status: 'critical',  age: 54, lastSeen: '2h ago',    avatar: 'AS', reports: 3 },
  { id: 'p2', name: 'Meera Nair',    condition: 'Type 2 Diabetes',  status: 'stable',    age: 42, lastSeen: '5h ago',    avatar: 'MN', reports: 1 },
  { id: 'p3', name: 'Rohan Patel',   condition: 'Post-Op Recovery', status: 'stable',    age: 31, lastSeen: 'Yesterday', avatar: 'RP', reports: 0 },
  { id: 'p4', name: 'Kavya Reddy',   condition: 'Seasonal Allergy', status: 'stable',    age: 26, lastSeen: '2d ago',    avatar: 'KR', reports: 2 },
  { id: 'p5', name: 'Vikram Iyer',   condition: 'Asthma',           status: 'attention', age: 38, lastSeen: '3d ago',    avatar: 'VI', reports: 1 },
];

const mockSymptomReports = [
  { id: 'r1', patient: 'Aarav Sharma', symptoms: ['Chest tightness', 'Dizziness'],        result: 'Hypertensive Crisis', severity: 'severe',   time: '1h ago',    read: false },
  { id: 'r2', patient: 'Kavya Reddy',  symptoms: ['Sneezing', 'Itchy eyes'],              result: 'Seasonal Allergy',    severity: 'mild',     time: '3h ago',    read: false },
  { id: 'r3', patient: 'Vikram Iyer',  symptoms: ['Wheezing', 'Shortness of breath'],     result: 'Asthma Flare-up',    severity: 'moderate', time: '6h ago',    read: true  },
  { id: 'r4', patient: 'Meera Nair',   symptoms: ['Fatigue', 'Blurred vision'],           result: 'High Blood Sugar',   severity: 'moderate', time: 'Yesterday', read: true  },
];

const mockTasks = [
  { id: 1, text: "Review Aarav's blood pressure report", done: false, priority: 'high'   },
  { id: 2, text: "Update Meera's medication dosage",     done: false, priority: 'high'   },
  { id: 3, text: "Sign off on Rohan's discharge summary",done: false, priority: 'medium' },
  { id: 4, text: "Call lab for Vikram's spirometry",     done: true,  priority: 'low'    },
  { id: 5, text: 'Submit monthly patient outcome report',done: true,  priority: 'low'    },
];

const analyticsData = [
  { day: 'Mon', patients: 8,  recoveries: 3 },
  { day: 'Tue', patients: 12, recoveries: 5 },
  { day: 'Wed', patients: 7,  recoveries: 4 },
  { day: 'Thu', patients: 15, recoveries: 8 },
  { day: 'Fri', patients: 10, recoveries: 6 },
  { day: 'Sat', patients: 5,  recoveries: 2 },
  { day: 'Sun', patients: 3,  recoveries: 1 },
];

const mockAlerts = [
  { id: 'al1', severity: 'urgent',   label: 'Urgent',   patient: 'Aarav Sharma', message: 'Reported chest tightness — unreviewed for 1h', time: '1h ago'  },
  { id: 'al2', severity: 'moderate', label: 'Moderate', patient: 'Vikram Iyer',  message: 'Missed last 2 scheduled check-ins',             time: '2d ago'  },
  { id: 'al3', severity: 'info',     label: 'Info',     patient: null,            message: '2 unread symptom reports pending review',       time: 'Today'   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const severityBadge = {
  mild:     'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  severe:   'bg-red-100 text-red-600',
};

const statusDot  = { stable: 'bg-green-500', critical: 'bg-red-500', attention: 'bg-yellow-400' };
const statusText = { stable: 'text-green-600', critical: 'text-red-500', attention: 'text-yellow-600' };

const priorityBadge = {
  high:   'bg-red-100 text-red-600',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-500',
};

const alertStyle = {
  urgent:   { bg: 'bg-red-50 border-red-200',        icon: 'text-red-500',    dot: 'bg-red-500',    label: 'bg-red-100 text-red-600'     },
  moderate: { bg: 'bg-yellow-50 border-yellow-200',  icon: 'text-yellow-600', dot: 'bg-yellow-400', label: 'bg-yellow-100 text-yellow-700'},
  info:     { bg: 'bg-helixa-green/5 border-helixa-green/20', icon: 'text-helixa-green', dot: 'bg-helixa-green', label: 'bg-helixa-green/10 text-helixa-green' },
};

// ── Patient Modal ─────────────────────────────────────────────────────────────
const PatientModal = ({ patient, onClose }) => {
  if (!patient) return null;
  const patientReports = mockSymptomReports.filter(r => r.patient === patient.name);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[var(--bg-primary)] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="bg-helixa-teal p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-lg">{patient.avatar}</div>
            <div>
              <h3 className="text-xl font-black text-white">{patient.name}</h3>
              <p className="text-white/70 text-sm">{patient.condition} · Age {patient.age}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-2xl">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">Status</span>
            <span className={`text-sm font-black capitalize flex items-center gap-1.5 ${statusText[patient.status]}`}>
              <span className={`w-2 h-2 rounded-full ${statusDot[patient.status]}`} />{patient.status}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">Symptom Reports ({patientReports.length})</h4>
            {patientReports.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] italic">No reports yet.</p>
            ) : (
              <div className="space-y-3">
                {patientReports.map(r => (
                  <div key={r.id} className="p-4 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-black text-[var(--text-primary)]">{r.result}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${severityBadge[r.severity]}`}>{r.severity}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {r.symptoms.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 bg-helixa-green/10 text-helixa-green rounded-full font-bold">{s}</span>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-bold">{r.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button className="w-full" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Create Appointment Modal ───────────────────────────────────────────────────
const CreateAppointmentModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', type: 'Video Call', notes: '' });
  const handleSave = () => {
    if (!form.date || !form.startTime || !form.endTime) return;
    onSave(form); onClose();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[var(--bg-primary)] rounded-3xl w-full max-w-md shadow-2xl p-8"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-[var(--text-primary)]">Set Availability</h3>
            <p className="text-xs text-[var(--text-secondary)] font-bold mt-0.5">Patients will be able to book this slot</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--border-color)] rounded-xl transition-colors">
            <X size={18} className="text-[var(--text-secondary)]" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Date</label>
            <input type="date" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-helixa-green"
              value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Start Time</label>
              <input type="time" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-helixa-green"
                value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">End Time</label>
              <input type="time" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-helixa-green"
                value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Consultation Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['Video Call', 'Voice Call'].map(t => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                  className={`p-3 rounded-2xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${form.type === t ? 'border-helixa-green bg-helixa-green/5 text-helixa-green' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-green/30'}`}>
                  {t === 'Video Call' ? '🎥' : '🎙️'} {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Notes (optional)</label>
            <textarea className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-helixa-green min-h-[80px] resize-none"
              placeholder="e.g. Follow-up for hypertension patients only..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button className="w-full py-4" onClick={handleSave} disabled={!form.date || !form.startTime || !form.endTime}>
            Publish Slot
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Doctor Dashboard ──────────────────────────────────────────────────────────
export const DoctorDashboard = ({ user }) => {
  const [tasks,           setTasks]          = useState(mockTasks);
  const [reports,         setReports]        = useState(mockSymptomReports);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showCreateAppt,  setShowCreateAppt]  = useState(false);
  const [newTaskText,     setNewTaskText]    = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [patientSearch,   setPatientSearch]  = useState('');

  const toggleTask  = id => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask  = id => setTasks(prev => prev.filter(t => t.id !== id));
  const addTask     = () => {
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTaskText.trim(), done: false, priority: newTaskPriority }]);
    setNewTaskText('');
  };
  const markReportRead = id => setReports(prev => prev.map(r => r.id === id ? { ...r, read: true } : r));
  const handleCreateAppt = async (form) => {
    const slot = {
      doctorId: user?.id, doctorName: `Dr. ${user?.lastName || 'Doctor'}`,
      date: form.date, startTime: form.startTime, endTime: form.endTime,
      type: form.type, notes: form.notes || '', status: 'available', createdAt: serverTimestamp(),
    };
    try { await addDoc(collection(db, 'slots'), slot); } catch (err) { console.error(err); }
  };

  const unreadReports    = reports.filter(r => !r.read).length;
  const urgentAlerts     = mockAlerts.filter(a => a.severity === 'urgent').length;
  const filteredPatients = mockPatients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.condition.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const thisWeekTotal = analyticsData.slice(3).reduce((a, d) => a + d.patients, 0);
  const lastWeekTotal = analyticsData.slice(0, 3).reduce((a, d) => a + d.patients, 0);
  const improvement   = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0;

  const stats = [
    { label: 'Patients Seen Today',  value: '12',                    icon: Users,      trend: '+3 vs yesterday',     color: 'bg-helixa-green/10 text-helixa-green' },
    { label: "Today's Appointments", value: '3',                     icon: Calendar,   trend: '1 completed',         color: 'bg-helixa-teal/10 text-helixa-teal'   },
    { label: 'Needs Review',         value: String(unreadReports),   icon: FileText,   trend: `${unreadReports} unread`, color: unreadReports > 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500' },
    { label: 'Avg. Recovery Time',   value: '8.2d',                  icon: TrendingUp, trend: '↓ 0.4d this week',   color: 'bg-purple-100 text-purple-600'        },
  ];

  return (
    <MainLayout user={user}>
      <div className="space-y-8">

        {/* ── Hero ── */}
        <div className="bg-helixa-teal rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-2">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
              Good morning, Dr. {user?.lastName || 'Doctor'} 👨‍⚕️
            </h1>
            <div className="flex flex-wrap gap-3 mb-6">
              {unreadReports > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-400/30 rounded-xl">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-sm font-black text-white">{unreadReports} unread reports need attention</span>
                </div>
              )}
              {urgentAlerts > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-400/30 rounded-xl">
                  <ShieldAlert size={14} className="text-amber-300" />
                  <span className="text-sm font-black text-white">{urgentAlerts} urgent patient alert</span>
                </div>
              )}
              {unreadReports === 0 && urgentAlerts === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-xl">
                  <CheckCircle2 size={14} className="text-helixa-green" />
                  <span className="text-sm font-bold text-white/80">All caught up — great work!</span>
                </div>
              )}
            </div>
            <Button className="bg-white text-helixa-teal hover:bg-white/90 flex items-center gap-2"
              onClick={() => setShowCreateAppt(true)}>
              <Plus size={16} /> Set Availability Slot
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-helixa-green/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        </div>

        {/* ── Stats ── */}
        {/* FIX 1: was closed with </div>, now correctly </motion.div> */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <p className="text-2xl font-black text-[var(--text-primary)]">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-0.5">{s.label}</p>
              <p className="text-[10px] font-bold text-helixa-green mt-1 flex items-center gap-1">
                <ArrowUpRight size={10} />{s.trend}
              </p>
            </motion.div>
          ))}
        </motion.div>
        {/* ── END Stats fix ── */}

        {/* ── AI Summary + Alerts + Graph ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* AI Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-gradient-to-br from-helixa-teal to-helixa-teal/80 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Sparkles size={14} className="text-white" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-white/70">AI Summary</p>
              </div>
              <p className="text-sm font-black text-white mb-3">Today's Overview</p>
              <div className="space-y-2.5">
                {[
                  { dot: 'bg-red-400',    text: `${unreadReports} patient${unreadReports !== 1 ? 's' : ''} need follow-up` },
                  { dot: 'bg-yellow-400', text: `${mockAlerts.filter(a => a.severity === 'urgent').length} case flagged as urgent` },
                  { dot: 'bg-green-400',  text: `Avg. recovery ${improvement >= 0 ? 'improving' : 'declining'} ${Math.abs(improvement)}% vs last week` },
                  { dot: 'bg-blue-300',   text: `${tasks.filter(t => !t.done).length} tasks pending today` },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${item.dot}`} />
                    <p className="text-xs text-white/80 font-bold leading-snug">{item.text}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  Generated by Helixa AI · {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Mini graph */}
            <Card title="Weekly Trend" subtitle={`${improvement >= 0 ? '↑' : '↓'} ${Math.abs(improvement)}% vs last week`}>
              <div style={{ height: 130 }} className="mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData}>
                    <defs>
                      <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#007099" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#007099" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7BBA91" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7BBA91" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#007099', fontSize: 10, opacity: 0.5 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', fontSize: 11 }} />
                    <Area type="monotone" dataKey="patients"   stroke="#007099" strokeWidth={2} fill="url(#pGrad)" name="Patients" />
                    <Area type="monotone" dataKey="recoveries" stroke="#7BBA91" strokeWidth={2} fill="url(#rGrad)" name="Recoveries" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="h-full" title="🚨 Alerts" subtitle="Immediate action required">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {mockAlerts.map((alert, i) => {
                  const s = alertStyle[alert.severity];
                  return (
                    <motion.div key={alert.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className={`p-4 rounded-2xl border ${s.bg}`}>
                      <div className="flex items-start gap-2.5 mb-3">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${s.dot}`} />
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.label}`}>{alert.label}</span>
                            {alert.patient && <span className="text-[10px] font-black text-[var(--text-secondary)]">{alert.patient}</span>}
                          </div>
                          <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{alert.message}</p>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 font-bold flex items-center gap-1">
                            <Clock size={9} /> {alert.time}
                          </p>
                        </div>
                      </div>
                      {alert.patient && (
                        <div className="flex gap-2">
                          <button className={`flex-1 text-[10px] font-black py-2 rounded-xl ${s.label} hover:opacity-80 transition-opacity`}>
                            View Case
                          </button>
                          <button className="flex-1 text-[10px] font-black py-2 rounded-xl bg-helixa-teal/10 text-helixa-teal hover:bg-helixa-teal/20 transition-colors flex items-center justify-center gap-1">
                            <MessageSquare size={10} /> Message
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ── Patient List + Symptom Reports ── */}
        {/* FIX 2: was closed with </div>, now correctly </motion.div> */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Patient List */}
          <Card title="Patient List" subtitle="Click a patient to view full profile & history">
            <div className="relative mt-4 mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input placeholder="Search by name or condition..."
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)]"
                value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              {filteredPatients.map(p => (
                <motion.div key={p.id} whileHover={{ x: 3 }} onClick={() => setSelectedPatient(p)}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--bg-primary)] border border-transparent hover:border-[var(--border-color)] cursor-pointer transition-all group">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-helixa-teal/10 flex items-center justify-center text-helixa-teal font-black text-sm">
                      {p.avatar}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-secondary)] ${statusDot[p.status]}`} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-black text-[var(--text-primary)] truncate">{p.name}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{p.condition} · {p.age}y</p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-0.5">
                    <p className={`text-xs font-black capitalize ${statusText[p.status]}`}>{p.status}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 justify-end">
                      <Clock size={9} /> {p.lastSeen}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Symptom Reports */}
          <Card title="Symptom Reports" subtitle={unreadReports > 0 ? `${unreadReports} need your review` : 'All reviewed'}>
            <div className="space-y-3 mt-4">
              {reports.map(r => (
                <div key={r.id} className={`p-4 rounded-2xl border transition-all ${r.read ? 'bg-[var(--bg-secondary)] border-[var(--border-color)] opacity-60' : 'bg-[var(--bg-primary)] border-helixa-green/20 shadow-sm'}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-[var(--text-primary)]">{r.patient}</p>
                        {!r.read && <span className="w-2 h-2 bg-helixa-green rounded-full" />}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{r.result}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${severityBadge[r.severity]}`}>{r.severity}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.symptoms.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-helixa-teal/5 text-helixa-teal/70 rounded-full font-bold">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold flex items-center gap-1">
                      <Clock size={9} /> {r.time}
                    </p>
                    {!r.read && (
                      <button onClick={() => markReportRead(r.id)}
                        className="text-[10px] font-black text-helixa-green flex items-center gap-1 hover:opacity-70 transition-opacity">
                        <CheckCheck size={12} /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
        {/* ── END Patient List fix ── */}

      </div>

      <AnimatePresence>
        {selectedPatient && <PatientModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />}
        {showCreateAppt  && <CreateAppointmentModal onClose={() => setShowCreateAppt(false)} onSave={handleCreateAppt} />}
      </AnimatePresence>

    </MainLayout>
  );
};