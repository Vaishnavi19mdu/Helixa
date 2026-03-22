import React, { useState } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
  Activity, Heart, Thermometer, Weight, Ruler, Lightbulb, CheckCircle2,
  Bell, Clock, Plus, Pill, Calendar, ChevronRight, Sparkles, TrendingUp,
  Droplets, Wind, Zap, ArrowUpRight, ArrowDownRight, MessageSquare,
  AlertCircle, Stethoscope, Globe, Wifi, WifiOff, Star, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../i18n/LanguageContext';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const heartRateData = [
  { time: '6am', bpm: 62 }, { time: '9am', bpm: 75 }, { time: '12pm', bpm: 80 },
  { time: '3pm', bpm: 72 }, { time: '6pm', bpm: 68 }, { time: '9pm', bpm: 65 },
];

const weeklySteps = [
  { day: 'M', steps: 6200 }, { day: 'T', steps: 8100 }, { day: 'W', steps: 5400 },
  { day: 'T', steps: 9300 }, { day: 'F', steps: 7800 }, { day: 'S', steps: 4200 },
  { day: 'S', steps: 3100 },
];

const symptomHistory = [
  { id: 1, date: 'Mar 18, 2026', symptoms: ['Headache', 'Fatigue'], result: 'Tension Headache', confidence: 88, severity: 'mild' },
  { id: 2, date: 'Mar 10, 2026', symptoms: ['Runny nose', 'Sneezing', 'Itchy eyes'], result: 'Seasonal Allergy', confidence: 92, severity: 'mild' },
  { id: 3, date: 'Feb 28, 2026', symptoms: ['Fever', 'Cough', 'Sore throat'], result: 'Common Cold', confidence: 85, severity: 'moderate' },
  { id: 4, date: 'Feb 14, 2026', symptoms: ['Chest tightness', 'Shortness of breath'], result: 'Anxiety Episode', confidence: 79, severity: 'moderate' },
];

const medications = [
  { id: 1, name: 'Vitamin D3', dose: '1000 IU', time: '8:00 AM', taken: true, color: 'bg-amber-400' },
  { id: 2, name: 'Omega-3', dose: '500mg', time: '8:00 AM', taken: true, color: 'bg-blue-400' },
  { id: 3, name: 'Cetirizine', dose: '10mg', time: '9:00 PM', taken: false, color: 'bg-helixa-green' },
  { id: 4, name: 'Magnesium', dose: '200mg', time: '9:00 PM', taken: false, color: 'bg-purple-400' },
];

const appointments = [
  { id: 1, doctor: 'Dr. Priya Sharma', specialty: 'General Physician', date: 'Mar 24, 2026', time: '10:30 AM', type: 'In-person', avatar: 'PS' },
  { id: 2, doctor: 'Dr. Arjun Mehta', specialty: 'Pulmonologist', date: 'Apr 2, 2026', time: '3:00 PM', type: 'Video Call', avatar: 'AM' },
];

// aiRecommendations now built inside component using t



// ─── Sub-components ───────────────────────────────────────────────────────────

const VitalCard = ({ icon: Icon, label, value, unit, trend, trendUp, color }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-helixa-green' : 'text-helixa-alert'}`}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-[var(--text-primary)]">
        {value}<span className="text-sm font-bold text-[var(--text-secondary)] ml-1">{unit}</span>
      </p>
    </div>
  </motion.div>
);

const SeverityBadge = ({ severity }) => {
  const map = {
    mild: 'bg-helixa-green/10 text-helixa-green',
    moderate: 'bg-amber-100 text-amber-600',
    severe: 'bg-red-100 text-red-500',
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${map[severity]}`}>
      {severity}
    </span>
  );
};

const OfflineBanner = ({ show, onDismiss }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className="flex items-center justify-between px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-bold text-amber-700 mb-6"
      >
        <div className="flex items-center gap-2">
          <WifiOff size={16} />
          You're offline — showing cached data. Some features may be limited.
        </div>
        <button onClick={onDismiss} className="hover:opacity-60 transition-opacity">
          <X size={16} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Main Patient Dashboard ───────────────────────────────────────────────────

const PatientDashboard = ({ user }) => {
  const { t, lang, changeLang, languages } = useLanguage();
  const [activeMeds, setActiveMeds] = useState(medications);
  // Use language from context — no local state needed
  const aiRecommendations = [
    { icon: Droplets, title: t.dashboard.hydrationAlert,    desc: t.dashboard.hydrationDesc,    color: 'text-blue-500',     bg: 'bg-blue-50'       },
    { icon: Wind,     title: t.dashboard.breathingExercise, desc: t.dashboard.breathingDesc,    color: 'text-helixa-teal',  bg: 'bg-helixa-teal/5' },
    { icon: Zap,      title: t.dashboard.energyBoost,       desc: t.dashboard.energyDesc,       color: 'text-amber-500',    bg: 'bg-amber-50'      },
  ];
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOffline, setShowOffline] = useState(!navigator.onLine);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [bookingType, setBookingType] = useState('In-person');
  const [showBookingModal, setShowBookingModal] = useState(false);

  React.useEffect(() => {
    const goOffline = () => { setIsOffline(true); setShowOffline(true); };
    const goOnline  = () => { setIsOffline(false); setShowOffline(false); };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  const toggleMed = (id) => {
    setActiveMeds(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const takenCount = activeMeds.filter(m => m.taken).length;
  const medProgress = (takenCount / activeMeds.length) * 100;

  return (
    <div className="space-y-8">

      {/* ── Offline Banner ── */}
      <OfflineBanner show={showOffline} onDismiss={() => setShowOffline(false)} />

      {/* ── Hero ── */}
      <div className="bg-helixa-green rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-2">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">
              {t.dashboard.greeting(user?.firstName || 'there')}
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-6">
              {t.dashboard.vitalsStable} {t.dashboard.medicationDue(1)}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/checker">
                <Button className="bg-white text-helixa-green hover:bg-white/90 flex items-center gap-2">
                  <Activity size={16} /> Check Symptoms
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 flex items-center gap-2"
                onClick={() => setShowLangPicker(v => !v)}
              >
                <Globe size={16} />
                {languages.find(l => l.code === lang)?.label || 'English'}
              </Button>
            </div>
            <AnimatePresence>
              {showLangPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-3 flex flex-wrap gap-2"
                >
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { changeLang(l.code); setShowLangPicker(false); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                        lang === l.code
                          ? 'bg-white text-helixa-green'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mini health score ring */}
          <div className="flex flex-col items-center bg-white/10 rounded-2xl p-5 min-w-[140px]">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2">{t.dashboard.healthScore}</p>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                <motion.circle
                  cx="40" cy="40" r="34"
                  fill="none"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - 0.78) }}
                  transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-white">78</span>
              </div>
            </div>
            <p className="text-white/70 text-xs font-bold mt-2">Good</p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      </div>

      {/* ── Vitals Grid ── */}
      <div>
        <h2 className="text-lg font-black text-[var(--text-primary)] mb-4 uppercase tracking-widest text-xs">
          Today's Vitals
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <VitalCard icon={Heart} label={t.dashboard.heartRate} value="72" unit="bpm" trend="+2%" trendUp color="bg-helixa-alert" />
          <VitalCard icon={Thermometer} label={t.dashboard.temperature} value="36.6" unit="°C" trend="Normal" trendUp color="bg-amber-400" />
          <VitalCard icon={Weight} label={t.dashboard.weight} value="72" unit="kg" trend="-0.3kg" trendUp color="bg-helixa-teal" />
          <VitalCard icon={Ruler} label={t.dashboard.height} value="175" unit="cm" color="bg-purple-400" />
        </div>
      </div>

      {/* ── Heart Rate Chart + AI Recommendations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Heart Rate Today" subtitle="Beats per minute throughout the day">
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={heartRateData}>
                <defs>
                  <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E8534A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#E8534A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#007099', fontSize: 11, opacity: 0.5 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#007099', fontSize: 11, opacity: 0.5 }} domain={[50, 100]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="bpm" stroke="#E8534A" strokeWidth={3} fill="url(#hrGrad)" dot={{ r: 4, fill: '#E8534A', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
            <Sparkles size={14} className="text-helixa-green" /> AI Recommendations
          </h3>
          {aiRecommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border border-[var(--border-color)] ${rec.bg}`}
            >
              <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <rec.icon size={16} className={rec.color} />
              </div>
              <div>
                <p className={`text-xs font-black ${rec.color}`}>{rec.title}</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-0.5">{rec.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Weekly Steps + Medication Tracker ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Steps */}
        <Card title={t.dashboard.weeklySteps} subtitle={t.dashboard.pastChecks}>
          <div className="flex items-end gap-2 mt-5 h-32">
            {weeklySteps.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  className="w-full rounded-xl bg-helixa-green/20 relative overflow-hidden"
                  style={{ height: `${(d.steps / 10000) * 100}%` }}
                  initial={{ scaleY: 0, originY: 1 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 200 }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-helixa-green rounded-xl"
                    style={{ height: `${Math.min((d.steps / 10000) * 100, 100)}%` }}
                  />
                </motion.div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)]">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)] font-bold">Avg: <span className="text-helixa-green">6,300 steps/day</span></p>
            <p className="text-xs text-[var(--text-secondary)] font-bold">Goal: <span className="text-helixa-teal">8,000</span></p>
          </div>
        </Card>

        {/* Medications */}
        <Card title={t.dashboard.medicationTracker} subtitle={t.dashboard.takenToday(takenCount, activeMeds.length)}>
          {/* Progress bar */}
          <div className="mt-2 mb-4 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-helixa-green rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${medProgress}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <div className="space-y-3">
            {activeMeds.map((med) => (
              <motion.div
                key={med.id}
                layout
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                  med.taken
                    ? 'bg-helixa-green/5 border-helixa-green/20 opacity-70'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-helixa-green/30'
                }`}
                onClick={() => toggleMed(med.id)}
              >
                <div className={`w-3 h-3 rounded-full ${med.color} flex-shrink-0`} />
                <div className="flex-grow">
                  <p className={`text-sm font-bold ${med.taken ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                    {med.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold">{med.dose} · {med.time}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  med.taken ? 'bg-helixa-green border-helixa-green' : 'border-[var(--border-color)]'
                }`}>
                  {med.taken && <CheckCircle2 size={14} className="text-white" />}
                </div>
              </motion.div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-3 text-xs flex items-center justify-center gap-2">
            <Plus size={14} /> Add Medication
          </Button>
        </Card>
      </div>

      {/* ── Symptom History ── */}
      <Card title={t.dashboard.symptomHistory} subtitle={t.dashboard.pastChecks}>
        <div className="mt-4 space-y-3">
          {symptomHistory.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-helixa-green/30 transition-all group"
            >
              <div className="flex items-start gap-3 flex-grow min-w-0">
                <div className="w-10 h-10 rounded-xl bg-helixa-green/10 flex items-center justify-center text-helixa-green flex-shrink-0">
                  <Stethoscope size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-[var(--text-primary)]">{item.result}</p>
                    <SeverityBadge severity={item.severity} />
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-0.5">{item.date}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.symptoms.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 bg-helixa-teal/5 text-helixa-teal/60 rounded-full font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-black text-helixa-green">{item.confidence}%</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">confidence</p>
                </div>
                <Button variant="ghost" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  View <ChevronRight size={12} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
        <Link to="/results">
          <Button variant="ghost" className="w-full mt-3 text-xs uppercase tracking-widest font-black">
            View Full History
          </Button>
        </Link>
      </Card>

      {/* ── Appointments ── */}
      <Card title={t.dashboard.upcomingAppts} subtitle={t.dashboard.pastChecks}>
        <div className="mt-4 space-y-4">
          {appointments.map((apt, i) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-helixa-green/30 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-helixa-teal/10 flex items-center justify-center text-helixa-teal font-black text-sm flex-shrink-0">
                {apt.avatar}
              </div>
              <div className="flex-grow">
                <p className="text-sm font-black text-[var(--text-primary)]">{apt.doctor}</p>
                <p className="text-xs text-[var(--text-secondary)] font-bold">{apt.specialty}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] font-bold text-helixa-teal flex items-center gap-1">
                    <Calendar size={10} /> {apt.date}
                  </span>
                  <span className="text-[10px] font-bold text-helixa-teal/60 flex items-center gap-1">
                    <Clock size={10} /> {apt.time}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    apt.type === 'Video Call'
                      ? 'bg-helixa-green/10 text-helixa-green'
                      : 'bg-helixa-teal/10 text-helixa-teal'
                  }`}>
                    {apt.type}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {apt.type === 'Video Call' && (
                  <Button size="sm" className="text-xs flex items-center gap-1 whitespace-nowrap">
                    <MessageSquare size={12} /> Join
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-xs whitespace-nowrap">
                  Reschedule
                </Button>
              </div>
            </motion.div>
          ))}

          {/* Book new appointment */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowBookingModal(true)}
            className="w-full p-4 rounded-2xl border-2 border-dashed border-[var(--border-color)] hover:border-helixa-green/40 hover:bg-helixa-green/5 transition-all flex items-center justify-center gap-2 text-[var(--text-secondary)] font-bold text-sm"
          >
            <Plus size={16} className="text-helixa-green" />
            Book New Appointment
          </motion.button>
        </div>
      </Card>

      {/* ── Book Appointment Modal ── */}
      <AnimatePresence>
        {showBookingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-[var(--bg-primary)] rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-[var(--text-primary)]">Book Appointment</h3>
                <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-[var(--border-color)] rounded-xl transition-colors">
                  <X size={18} className="text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Specialty</label>
                  <select className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-helixa-green">
                    <option>General Physician</option>
                    <option>Cardiologist</option>
                    <option>Pulmonologist</option>
                    <option>Dermatologist</option>
                    <option>Neurologist</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Preferred Date</label>
                  <input type="date" className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-helixa-green" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Consultation Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['In-person', 'Video Call'].map(type => (
                      <button
                        key={type}
                        onClick={() => setBookingType(type)}
                        className={`p-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                          bookingType === type
                            ? 'border-helixa-green bg-helixa-green/5 text-helixa-green'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-green/40'
                        }`}
                      >
                        {type === 'Video Call' ? <><MessageSquare size={14} className="inline mr-1" />{type}</> : type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">Language Preference</label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map(l => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedLang(l.code); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                          selectedLang === l.code
                            ? 'bg-helixa-green text-white border-helixa-green'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-helixa-green hover:text-helixa-green'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full py-4 mt-2" onClick={() => setShowBookingModal(false)}>
                  Confirm Booking
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// ─── Exports ──────────────────────────────────────────────────────────────────
import { DoctorDashboard } from './DoctorDashboard';

export const Dashboard = ({ user, darkMode, toggleDarkMode }) => {
  if (user?.role === 'doctor') {
    return <DoctorDashboard user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
  }
  return (
    <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <PatientDashboard user={user} />
    </MainLayout>
  );
};