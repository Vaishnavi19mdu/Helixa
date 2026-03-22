// src/pages/Appointments.jsx
import React, { useState, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  collection, query, where, getDocs, updateDoc,
  doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Calendar, Clock, Video, Phone, CheckCircle2, X, Plus, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const typeBadge = {
  'Video Call': 'bg-helixa-green/10 text-helixa-green',
  'Voice Call': 'bg-blue-100 text-blue-600',
};

const statusBadge = {
  available: 'bg-green-100 text-green-700',
  booked:    'bg-helixa-teal/10 text-helixa-teal',
  completed: 'bg-gray-100 text-gray-500',
};

// ── Doctor view ───────────────────────────────────────────────────────────────
const DoctorAppointments = ({ user }) => {
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const q    = query(
          collection(db, 'slots'),
          where('doctorId', '==', user.id)
        );
        const snap = await getDocs(q);
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.date > b.date ? 1 : -1));
        setSlots(sorted);
      } catch (err) {
        console.error('Failed to load slots:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [user.id]);

  const markCompleted = async (slotId) => {
    try {
      await updateDoc(doc(db, 'slots', slotId), { status: 'completed' });
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: 'completed' } : s));
    } catch (err) {
      console.error(err);
    }
  };

  const cancelSlot = async (slotId) => {
    try {
      await updateDoc(doc(db, 'slots', slotId), { status: 'cancelled' });
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (err) {
      console.error(err);
    }
  };

  const grouped = slots.reduce((acc, slot) => {
    const key = slot.date || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)]">Your Availability Slots</h1>
          <p className="text-sm text-[var(--text-secondary)] font-bold mt-1">
            {slots.filter(s => s.status === 'available').length} open · {slots.filter(s => s.status === 'booked').length} booked
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3 text-[var(--text-secondary)]">
          <Loader size={20} className="animate-spin" />
          <span className="font-bold text-sm">Loading slots...</span>
        </div>
      ) : slots.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-helixa-green/10 flex items-center justify-center">
            <Calendar size={28} className="text-helixa-green" />
          </div>
          <p className="text-lg font-black text-[var(--text-primary)]">No slots yet</p>
          <p className="text-sm text-[var(--text-secondary)] font-bold">Use "Create Appointment" on the dashboard to add availability</p>
        </Card>
      ) : (
        Object.entries(grouped).map(([date, daySlots]) => (
          <div key={date}>
            <p className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3 px-1">
              {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="space-y-3">
              {daySlots.map(slot => (
                <motion.div
                  key={slot.id}
                  layout
                  className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-5 flex items-center gap-4"
                >
                  {/* Time */}
                  <div className="flex-shrink-0 w-20 text-center bg-[var(--bg-primary)] rounded-xl p-3 border border-[var(--border-color)]">
                    <p className="text-xs font-black text-helixa-green">{slot.startTime}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold">to</p>
                    <p className="text-xs font-black text-[var(--text-primary)]">{slot.endTime}</p>
                  </div>

                  {/* Info */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${typeBadge[slot.type] || 'bg-gray-100 text-gray-600'}`}>
                        {slot.type === 'Video Call' ? '🎥' : '🎙️'} {slot.type}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${statusBadge[slot.status] || 'bg-gray-100 text-gray-600'}`}>
                        {slot.status}
                      </span>
                    </div>
                    {slot.bookedBy && (
                      <p className="text-sm font-black text-[var(--text-primary)]">Booked by: {slot.bookedBy}</p>
                    )}
                    {slot.notes && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{slot.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {slot.status !== 'completed' && (
                    <div className="flex gap-2 flex-shrink-0">
                      {slot.status === 'booked' && (
                        <Button size="sm" onClick={() => markCompleted(slot.id)} className="flex items-center gap-1 text-xs">
                          <CheckCircle2 size={12} /> Done
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => cancelSlot(slot.id)} className="text-helixa-alert hover:bg-helixa-alert/10 text-xs">
                        <X size={14} />
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ── Patient view ──────────────────────────────────────────────────────────────
const PatientAppointments = ({ user }) => {
  const [slots,    setSlots]    = useState([]);
  const [myBooked, setMyBooked] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [booking,  setBooking]  = useState(null); // slotId being booked

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        // Available slots from all doctors
        const availQ = query(
          collection(db, 'slots'),
          where('status', '==', 'available')
        );
        const availSnap = await getDocs(availQ);
        setSlots(
          availSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.date > b.date ? 1 : -1))
        );

        // Patient's own booked appointments
        const myQ = query(
          collection(db, 'slots'),
          where('bookedById', '==', user.id)
        );
        const mySnap = await getDocs(myQ);
        setMyBooked(
          mySnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.date > b.date ? 1 : -1))
        );
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [user.id]);

  const bookSlot = async (slot) => {
    setBooking(slot.id);
    try {
      await updateDoc(doc(db, 'slots', slot.id), {
        status:      'booked',
        bookedById:  user.id,
        bookedBy:    `${user.firstName} ${user.lastName}`,
        bookedAt:    serverTimestamp(),
      });
      setMyBooked(prev => [...prev, { ...slot, status: 'booked', bookedBy: `${user.firstName} ${user.lastName}` }]);
      setSlots(prev => prev.filter(s => s.id !== slot.id));
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setBooking(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40 gap-3 text-[var(--text-secondary)]">
      <Loader size={20} className="animate-spin" />
      <span className="font-bold text-sm">Loading appointments...</span>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black text-[var(--text-primary)]">Appointments</h1>

      {/* My bookings */}
      {myBooked.length > 0 && (
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">Your Booked Appointments</h2>
          <div className="space-y-3">
            {myBooked.map(slot => (
              <Card key={slot.id} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-helixa-green/10 flex flex-col items-center justify-center flex-shrink-0">
                  <p className="text-xs font-black text-helixa-green">{slot.startTime}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{slot.endTime}</p>
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-black text-[var(--text-primary)]">{slot.doctorName}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-bold">
                    {new Date(slot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${typeBadge[slot.type] || ''}`}>
                  {slot.type === 'Video Call' ? '🎥' : '🎙️'} {slot.type}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available slots */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">Available Slots</h2>
        {slots.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 gap-3">
            <Calendar size={28} className="text-[var(--text-secondary)]" />
            <p className="font-black text-[var(--text-primary)]">No slots available right now</p>
            <p className="text-xs text-[var(--text-secondary)] font-bold">Check back later or contact your doctor directly</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {slots.map(slot => (
              <motion.div
                key={slot.id}
                layout
                className="bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-helixa-green/30 rounded-2xl p-5 flex items-center gap-4 transition-all"
              >
                <div className="w-16 text-center bg-[var(--bg-primary)] rounded-xl p-2 border border-[var(--border-color)] flex-shrink-0">
                  <p className="text-xs font-black text-helixa-green">{slot.startTime}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{slot.endTime}</p>
                </div>
                <div className="flex-grow">
                  <p className="text-sm font-black text-[var(--text-primary)]">{slot.doctorName}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-bold">
                    {new Date(slot.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {slot.notes && <p className="text-xs text-[var(--text-secondary)] mt-1 italic">{slot.notes}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${typeBadge[slot.type] || ''}`}>
                    {slot.type === 'Video Call' ? '🎥' : '🎙️'} {slot.type}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => bookSlot(slot)}
                    disabled={booking === slot.id}
                    className="text-xs"
                  >
                    {booking === slot.id ? <Loader size={12} className="animate-spin" /> : 'Book'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Export ────────────────────────────────────────────────────────────────────
export const Appointments = ({ user, darkMode, toggleDarkMode }) => (
  <MainLayout user={user} darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
    {user?.role === 'doctor'
      ? <DoctorAppointments user={user} />
      : <PatientAppointments user={user} />
    }
  </MainLayout>
);