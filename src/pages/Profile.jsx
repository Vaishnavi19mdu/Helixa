// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {
  User, Mail, Phone, MapPin, Award, Calendar, Weight,
  Ruler, Pill, Plus, X, Save, Camera, CheckCircle2, Loader,
  Stethoscope, Heart, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ── Reusable field ────────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-1.5">
      {Icon && <Icon size={11} />} {label}
    </label>
    {children}
  </div>
);

const inputCls = "w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:border-helixa-green transition-colors placeholder:text-[var(--text-secondary)]";

// ── Medication tag input with FDA drug search ────────────────────────────────
const MedicationInput = ({ meds, onChange }) => {
  const [input,       setInput]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [showDrop,    setShowDrop]    = useState(false);
  const debounceRef = useRef(null);

  const search = (val) => {
    setInput(val);
    setShowDrop(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // FDA OpenFDA drug label API — free, no key needed
        const res  = await fetch(
          `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(val)}"&limit=6`
        );
        const data = await res.json();
        const names = [
          ...new Set(
            (data.results || []).flatMap(r =>
              r.openfda?.brand_name || r.openfda?.generic_name || []
            )
          )
        ].slice(0, 6);

        // If FDA returns nothing, fallback to RxNorm suggest
        if (names.length === 0) {
          const rx   = await fetch(
            `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(val)}`
          );
          const rxData = await rx.json();
          const rxNames = rxData.suggestionGroup?.suggestionList?.suggestion || [];
          setSuggestions(rxNames.slice(0, 6));
        } else {
          setSuggestions(names);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const add = (val) => {
    const trimmed = (val || input).trim();
    if (trimmed && !meds.includes(trimmed)) {
      onChange([...meds, trimmed]);
    }
    setInput('');
    setSuggestions([]);
    setShowDrop(false);
  };

  const remove = (med) => onChange(meds.filter(m => m !== med));

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input
              value={input}
              onChange={e => search(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
              onBlur={() => setTimeout(() => setShowDrop(false), 150)}
              onFocus={() => suggestions.length > 0 && setShowDrop(true)}
              placeholder="Type a medication name..."
              autoComplete="off"
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="words"
              className={`${inputCls} w-full`}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-helixa-green/30 border-t-helixa-green rounded-full animate-spin" />
              </div>
            )}

            {/* Dropdown */}
            <AnimatePresence>
              {showDrop && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => add(s)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-helixa-green/5 text-left transition-colors"
                    >
                      <Pill size={13} className="text-helixa-green flex-shrink-0" />
                      <span className="text-sm font-medium text-[var(--text-primary)] capitalize">{s.toLowerCase()}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => add()}
            className="w-11 h-11 bg-helixa-green/10 hover:bg-helixa-green/20 text-helixa-green rounded-2xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {meds.map(med => (
            <motion.div
              key={med}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-helixa-green/10 text-helixa-green rounded-full text-xs font-bold border border-helixa-green/20"
            >
              <Pill size={11} />
              {med}
              <button onClick={() => remove(med)} className="hover:text-helixa-alert transition-colors">
                <X size={11} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {meds.length === 0 && (
          <p className="text-xs text-[var(--text-secondary)] italic">No medications added yet</p>
        )}
      </div>
    </div>
  );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────
export const Profile = ({ user, darkMode, toggleDarkMode }) => {
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  // Load from Firestore on mount
  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.id));
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            firstName:  data.firstName  || '',
            lastName:   data.lastName   || '',
            email:      data.email      || '',
            phone:      data.profile?.phone    || '',
            location:   data.profile?.location || '',
            bio:        data.profile?.bio      || '',
            // Doctor fields
            specialty:  data.profile?.specialty  || '',
            experience: data.profile?.experience || '',
            // Patient fields
            dob:        data.profile?.dob    || '',
            gender:     data.profile?.gender || '',
            height:     data.profile?.height || '',
            weight:     data.profile?.weight || '',
            medications: data.profile?.medications || [],
            bloodType:  data.profile?.bloodType || '',
            allergies:  data.profile?.allergies || [],
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.id]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        firstName: form.firstName,
        lastName:  form.lastName,
        profile: {
          phone:       form.phone,
          location:    form.location,
          bio:         form.bio,
          specialty:   form.specialty,
          experience:  form.experience,
          dob:         form.dob,
          gender:      form.gender,
          height:      form.height,
          weight:      form.weight,
          medications: form.medications,
          bloodType:   form.bloodType,
          allergies:   form.allergies,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <div className="flex items-center justify-center h-64 gap-3 text-[var(--text-secondary)]">
        <Loader size={20} className="animate-spin" />
        <span className="font-bold text-sm">Loading profile...</span>
      </div>
    </MainLayout>
  );

  const isDoctor = user?.role === 'doctor';

  return (
    <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header card ── */}
        <Card className="p-0 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-helixa-green/20 via-helixa-teal/10 to-helixa-green/5" />
          <div className="px-8 pb-8 -mt-10 flex items-end gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-helixa-peach border-4 border-[var(--bg-secondary)] shadow-lg overflow-hidden flex items-center justify-center">
                <img
                  src={user?.profilePic || `https://api.dicebear.com/7.x/notionists/svg?seed=${form?.firstName}${form?.lastName}&backgroundColor=fde68a&radius=12`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-helixa-green rounded-xl flex items-center justify-center shadow-md hover:bg-helixa-green/80 transition-colors">
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-black text-[var(--text-primary)]">
                {isDoctor ? `Dr. ${form?.firstName} ${form?.lastName}` : `${form?.firstName} ${form?.lastName}`}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] font-bold capitalize flex items-center gap-1.5">
                {isDoctor ? <Stethoscope size={13} /> : <Heart size={13} />}
                {user?.role} {isDoctor && form?.specialty ? `· ${form.specialty}` : ''}
              </p>
            </div>
          </div>
        </Card>

        {/* ── Personal info ── */}
        <Card title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <Field label="First Name" icon={User}>
              <input
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                spellCheck={true} autoCorrect="on" autoCapitalize="words"
                className={inputCls}
                placeholder="First name"
              />
            </Field>
            <Field label="Last Name" icon={User}>
              <input
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                spellCheck={true} autoCorrect="on" autoCapitalize="words"
                className={inputCls}
                placeholder="Last name"
              />
            </Field>
            <Field label="Email" icon={Mail}>
              <input
                value={form.email}
                disabled
                className={`${inputCls} opacity-50 cursor-not-allowed`}
                placeholder="Email"
              />
            </Field>
            <Field label="Phone" icon={Phone}>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                type="tel"
                className={inputCls}
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label="Location" icon={MapPin}>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                spellCheck={true} autoCorrect="on"
                className={inputCls}
                placeholder="Bengaluru, India"
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label={isDoctor ? 'Professional Bio' : 'About Me'} icon={Edit3}>
              <textarea
                value={form.bio}
                onChange={e => set('bio', e.target.value)}
                spellCheck={true} autoCorrect="on"
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder={isDoctor ? 'Your medical background and expertise...' : 'Tell us about yourself...'}
              />
            </Field>
          </div>
        </Card>

        {/* ── Role-specific fields ── */}
        {isDoctor ? (
          <Card title="Professional Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <Field label="Specialty" icon={Award}>
                <input
                  value={form.specialty}
                  onChange={e => set('specialty', e.target.value)}
                  spellCheck={true} autoCorrect="on" autoCapitalize="words"
                  className={inputCls}
                  placeholder="e.g. Cardiologist"
                />
              </Field>
              <Field label="Years of Experience" icon={Calendar}>
                <input
                  value={form.experience}
                  onChange={e => set('experience', e.target.value)}
                  type="number" min="0" max="60"
                  className={inputCls}
                  placeholder="e.g. 10"
                />
              </Field>
            </div>
          </Card>
        ) : (
          <Card title="Personal Health Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <Field label="Date of Birth" icon={Calendar}>
                <input
                  value={form.dob}
                  onChange={e => set('dob', e.target.value)}
                  type="date"
                  className={inputCls}
                />
              </Field>
              <Field label="Gender" icon={User}>
                <select
                  value={form.gender}
                  onChange={e => set('gender', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </Field>
            </div>
          </Card>
        )}

        {/* ── Vitals (patient only) ── */}
        {!isDoctor && (
          <Card title="Health Vitals">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
              <Field label="Height (cm)" icon={Ruler}>
                <input
                  value={form.height}
                  onChange={e => set('height', e.target.value)}
                  type="number" min="100" max="250"
                  className={inputCls}
                  placeholder="175"
                />
              </Field>
              <Field label="Weight (kg)" icon={Weight}>
                <input
                  value={form.weight}
                  onChange={e => set('weight', e.target.value)}
                  type="number" min="20" max="300"
                  className={inputCls}
                  placeholder="70"
                />
              </Field>
              <Field label="Blood Type" icon={Heart}>
                <select
                  value={form.bloodType}
                  onChange={e => set('bloodType', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>
        )}

        {/* ── Current Medications (patient only) ── */}
        {!isDoctor && (
          <Card title="Current Medications" subtitle="Type and press Enter to add">
            <div className="mt-4">
              <MedicationInput
                meds={form.medications}
                onChange={val => set('medications', val)}
              />
            </div>
          </Card>
        )}

        {/* ── Allergies (patient only) ── */}
        {!isDoctor && (
          <Card title="Allergies" subtitle="Type and press Enter to add">
            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                <input
                  placeholder="e.g. Penicillin, Peanuts, Dust"
                  spellCheck={true} autoCorrect="on" autoCapitalize="words"
                  className={`${inputCls} flex-grow`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      e.preventDefault();
                      const val = e.target.value.trim();
                      if (!form.allergies.includes(val)) {
                        set('allergies', [...form.allergies, val]);
                      }
                      e.target.value = '';
                    }
                  }}
                />
                <div className="w-11 h-11 bg-helixa-alert/10 text-helixa-alert rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Plus size={18} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {form.allergies.map(a => (
                    <motion.div
                      key={a}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-helixa-alert/10 text-helixa-alert rounded-full text-xs font-bold border border-helixa-alert/20"
                    >
                      {a}
                      <button onClick={() => set('allergies', form.allergies.filter(x => x !== a))}>
                        <X size={11} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {form.allergies.length === 0 && (
                  <p className="text-xs text-[var(--text-secondary)] italic">No allergies added</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* ── Save button ── */}
        <div className="flex justify-end pb-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-10 py-4 flex items-center gap-2 text-base"
          >
            {saving ? (
              <><Loader size={16} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle2 size={16} /> Saved!</>
            ) : (
              <><Save size={16} /> Save Changes</>
            )}
          </Button>
        </div>

      </div>
    </MainLayout>
  );
};