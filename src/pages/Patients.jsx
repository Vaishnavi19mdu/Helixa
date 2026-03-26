import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, Plus, ChevronRight, Clock, X,
  Activity, Calendar, FileText, MessageSquare,
  CheckCircle2, AlertTriangle, Heart, Phone,
  Mail, MapPin, Pill, Stethoscope, TrendingUp,
  MoreHorizontal, User, Download, SlidersHorizontal
} from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Button } from '../components/Button';

// ── Static fallback data (shown while Firestore loads / if empty) ─────────────
const MOCK_PATIENTS = [
  {
    id: 'p1', firstName: 'Aarav',  lastName: 'Sharma',  age: 54,
    condition: 'Hypertension',    status: 'critical',  gender: 'Male',
    lastSeen: '2h ago',           phone: '+91 98400 11234', email: 'aarav.s@email.com',
    city: 'Chennai',              bloodGroup: 'B+',    reports: 3,
    medications: ['Amlodipine 5mg', 'Losartan 50mg'],
    nextAppt: 'Tomorrow, 10:00 AM',
  },
  {
    id: 'p2', firstName: 'Meera',  lastName: 'Nair',    age: 42,
    condition: 'Type 2 Diabetes', status: 'stable',    gender: 'Female',
    lastSeen: '5h ago',           phone: '+91 98400 22345', email: 'meera.n@email.com',
    city: 'Coimbatore',           bloodGroup: 'O+',    reports: 1,
    medications: ['Metformin 500mg', 'Glipizide 5mg'],
    nextAppt: 'Fri, 11:30 AM',
  },
  {
    id: 'p3', firstName: 'Rohan',  lastName: 'Patel',   age: 31,
    condition: 'Post-Op Recovery',status: 'stable',    gender: 'Male',
    lastSeen: 'Yesterday',        phone: '+91 98400 33456', email: 'rohan.p@email.com',
    city: 'Mumbai',               bloodGroup: 'A-',    reports: 0,
    medications: ['Ibuprofen 400mg'],
    nextAppt: 'Mon, 9:00 AM',
  },
  {
    id: 'p4', firstName: 'Kavya',  lastName: 'Reddy',   age: 26,
    condition: 'Seasonal Allergy',status: 'stable',    gender: 'Female',
    lastSeen: '2d ago',           phone: '+91 98400 44567', email: 'kavya.r@email.com',
    city: 'Hyderabad',            bloodGroup: 'AB+',   reports: 2,
    medications: ['Cetirizine 10mg'],
    nextAppt: 'Next week',
  },
  {
    id: 'p5', firstName: 'Vikram', lastName: 'Iyer',    age: 38,
    condition: 'Asthma',          status: 'attention', gender: 'Male',
    lastSeen: '3d ago',           phone: '+91 98400 55678', email: 'vikram.i@email.com',
    city: 'Bengaluru',            bloodGroup: 'O-',    reports: 1,
    medications: ['Salbutamol inhaler', 'Fluticasone 100mcg'],
    nextAppt: 'Thu, 4:00 PM',
  },
  {
    id: 'p6', firstName: 'Divya',  lastName: 'Menon',   age: 61,
    condition: 'Osteoarthritis',  status: 'stable',    gender: 'Female',
    lastSeen: '1w ago',           phone: '+91 98400 66789', email: 'divya.m@email.com',
    city: 'Kochi',                bloodGroup: 'B-',    reports: 0,
    medications: ['Diclofenac 50mg', 'Calcium + D3'],
    nextAppt: 'Next Mon, 2:00 PM',
  },
];

// ── Style maps ────────────────────────────────────────────────────────────────
const statusConfig = {
  critical:  { dot: 'bg-red-500',    text: 'text-red-500',    badge: 'bg-red-100 text-red-600',       label: 'Critical'   },
  attention: { dot: 'bg-yellow-400', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', label: 'Attention'  },
  stable:    { dot: 'bg-green-500',  text: 'text-green-600',  badge: 'bg-green-100 text-green-700',   label: 'Stable'     },
};

const avatarUrl = (f, l) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${f || 'U'}${l || ''}&backgroundColor=fde68a&radius=12`;

// ── Patient Detail Drawer ────────────────────────────────────────────────────
const PatientDrawer = ({ patient, onClose }) => {
  if (!patient) return null;
  const s = statusConfig[patient.status] || statusConfig.stable;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose} />

      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-primary)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="bg-helixa-teal p-6 flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10 flex-shrink-0">
                <img src={avatarUrl(patient.firstName, patient.lastName)} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{patient.firstName} {patient.lastName}</h3>
                <p className="text-white/60 text-sm font-bold">{patient.gender} · Age {patient.age} · {patient.bloodGroup}</p>
                <span className={`inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-black px-2.5 py-1 rounded-full ${s.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
              <X size={18} className="text-white" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Phone,    label: patient.phone },
              { icon: Mail,     label: patient.email },
              { icon: MapPin,   label: patient.city  },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-white/10 rounded-xl px-2 py-2 flex items-center gap-1.5 min-w-0">
                <Icon size={11} className="text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white/70 font-bold truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-grow">

          {/* Primary Condition */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
              <Stethoscope size={11} /> Primary Condition
            </p>
            <p className="text-sm font-black text-[var(--text-primary)]">{patient.condition}</p>
          </div>

          {/* Medications */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
              <Pill size={11} /> Current Medications
            </p>
            {patient.medications?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.medications.map(med => (
                  <span key={med} className="text-[11px] font-bold px-2.5 py-1 bg-helixa-green/10 text-helixa-green rounded-full">
                    {med}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] italic">None recorded</p>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: FileText,  label: 'Reports',  value: patient.reports   },
              { icon: Calendar,  label: 'Next Appt', value: patient.nextAppt  },
              { icon: Clock,     label: 'Last Seen', value: patient.lastSeen  },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-3 text-center">
                <Icon size={14} className="text-helixa-teal mx-auto mb-1.5" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-0.5">{label}</p>
                <p className="text-xs font-black text-[var(--text-primary)] leading-tight">{value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button className="flex items-center justify-center gap-2 text-sm py-3">
              <MessageSquare size={14} /> Message
            </Button>
            <button className="flex items-center justify-center gap-2 text-sm py-3 rounded-2xl border-2 border-helixa-teal/30 text-helixa-teal font-black hover:bg-helixa-teal/5 transition-colors">
              <FileText size={14} /> View Reports
            </button>
            <button className="flex items-center justify-center gap-2 text-sm py-3 rounded-2xl border border-[var(--border-color)] text-[var(--text-secondary)] font-black hover:bg-[var(--bg-secondary)] transition-colors col-span-2">
              <Calendar size={14} /> Schedule Appointment
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export const Patients = ({ user, darkMode, toggleDarkMode }) => {
  const [patients,    setPatients]    = useState(MOCK_PATIENTS);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('all');
  const [selected,    setSelected]    = useState(null);

  // Try to load real patients from Firestore
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const q = query(collection(db, 'users'), where('role', '==', 'patient'));
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) {
        setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user?.id]);

  const filtered = patients.filter(p => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) ||
      (p.condition || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:       patients.length,
    critical:  patients.filter(p => p.status === 'critical').length,
    attention: patients.filter(p => p.status === 'attention').length,
    stable:    patients.filter(p => p.status === 'stable').length,
  };

  return (
    <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Patient List</h1>
            <p className="text-sm text-[var(--text-secondary)] font-bold mt-0.5">
              {patients.length} patients under your care
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border-color)] rounded-xl text-sm font-black text-[var(--text-secondary)] hover:border-helixa-green/40 hover:text-helixa-green transition-all">
              <Download size={15} /> Export
            </button>
            <Button className="flex items-center gap-2 text-sm">
              <Plus size={15} /> Add Patient
            </Button>
          </div>
        </div>

        {/* ── Status Filter Pills ── */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all',       label: 'All Patients', color: 'bg-helixa-teal/10 text-helixa-teal border-helixa-teal/20'        },
            { key: 'critical',  label: 'Critical',     color: 'bg-red-100 text-red-600 border-red-200'                           },
            { key: 'attention', label: 'Needs Attention', color: 'bg-yellow-100 text-yellow-700 border-yellow-200'               },
            { key: 'stable',    label: 'Stable',       color: 'bg-green-100 text-green-700 border-green-200'                     },
          ].map(f => (
            <button key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                statusFilter === f.key
                  ? `${f.color} shadow-sm`
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-green/30'
              }`}>
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                statusFilter === f.key ? 'bg-white/60' : 'bg-[var(--bg-secondary)]'
              }`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Search + Grid ── */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or condition..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-helixa-green placeholder:text-[var(--text-secondary)] transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-helixa-green/30 border-t-helixa-green rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center">
              <User size={24} className="text-[var(--text-secondary)]" />
            </div>
            <p className="font-black text-[var(--text-secondary)]">No patients found</p>
            <p className="text-sm text-[var(--text-secondary)]/60">Try adjusting your search or filters</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((p, i) => {
                const s = statusConfig[p.status] || statusConfig.stable;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelected(p)}
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-5 cursor-pointer hover:border-helixa-green/40 hover:shadow-md transition-all group"
                  >
                    {/* Card top */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-helixa-peach border border-white/20">
                            <img src={avatarUrl(p.firstName, p.lastName)} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-secondary)] ${s.dot}`} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[var(--text-primary)]">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {p.gender} · {p.age}y · {p.bloodGroup}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${s.badge}`}>
                        {s.label}
                      </span>
                    </div>

                    {/* Condition */}
                    <div className="flex items-center gap-2 mb-3">
                      <Stethoscope size={12} className="text-helixa-teal flex-shrink-0" />
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">{p.condition}</p>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-bold mb-4">
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> {p.lastSeen}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={10} /> {p.reports} report{p.reports !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={10} /> {p.city}
                      </span>
                    </div>

                    {/* Next appointment */}
                    {p.nextAppt && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] rounded-xl mb-3">
                        <Calendar size={11} className="text-helixa-green flex-shrink-0" />
                        <p className="text-[11px] font-bold text-[var(--text-secondary)] truncate">
                          <span className="text-helixa-green font-black">Next: </span>{p.nextAppt}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                      <div className="flex gap-1.5">
                        <button
                          onClick={e => { e.stopPropagation(); }}
                          className="p-1.5 rounded-lg hover:bg-helixa-teal/10 text-[var(--text-secondary)] hover:text-helixa-teal transition-colors">
                          <MessageSquare size={13} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); }}
                          className="p-1.5 rounded-lg hover:bg-helixa-green/10 text-[var(--text-secondary)] hover:text-helixa-green transition-colors">
                          <Calendar size={13} />
                        </button>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-black text-[var(--text-secondary)] group-hover:text-helixa-teal transition-colors">
                        View profile <ChevronRight size={11} />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Patient detail drawer */}
      <AnimatePresence>
        {selected && (
          <PatientDrawer patient={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </MainLayout>
  );
};