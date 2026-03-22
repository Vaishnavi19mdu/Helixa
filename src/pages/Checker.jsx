// src/pages/Checker.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Activity, Plus, X, Search, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeSymptoms } from '../utils/groq';
import { addToQueue } from '../utils/offlineQueue';
import { OfflineBanner, WorksOfflineLabel } from '../components/OfflineBanner';
import { useOffline } from '../hooks/useOffline';
import { api } from '../utils/api';

export const Checker = ({ user }) => {
  const [symptoms, setSymptoms]     = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const { isOffline } = useOffline();
  const navigate = useNavigate();

  const addSymptom = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms(prev => [...prev, trimmed]);
      setInputValue('');
    }
  };

  const removeSymptom = (symptom) => {
    setSymptoms(prev => prev.filter(s => s !== symptom));
  };

  const handleAnalyze = async () => {
    // ── Offline: queue symptoms locally ──────────────────────────────────────
    if (isOffline) {
      addToQueue('symptom', {
        userId:   user?.id,
        symptoms,
        result:   null, // will be analyzed when back online
        savedAt:  new Date().toISOString(),
      }, 'normal');
      setSavedOffline(true);
      setTimeout(() => setSavedOffline(false), 4000);
      return;
    }

    // ── Online: full Groq analysis ────────────────────────────────────────────
    setLoading(true);
    setError(null);

    try {
      const result = await analyzeSymptoms(symptoms);

      if (user?.id) {
        await api.saveSymptomResult(user.id, symptoms, result);
      }

      navigate('/results', { state: { symptoms, result } });

    } catch (err) {
      console.error('Symptom analysis failed:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout user={user}>
      <div className="max-w-3xl mx-auto">
        <OfflineBanner />

        {/* Saved offline toast */}
        <AnimatePresence>
          {savedOffline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 mb-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-bold"
            >
              ☁️ Symptoms saved offline — they'll be analyzed automatically when you're back online.
            </motion.div>
          )}
        </AnimatePresence>
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-helixa-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Activity className="text-helixa-green" size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-helixa-teal mb-4">AI Symptom Checker</h1>
          <p className="text-helixa-teal/60 text-lg">Describe how you're feeling and our AI will analyze your symptoms.</p>
        </div>

        <Card className="p-8">
          <form onSubmit={addSymptom} className="flex gap-4 mb-8">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-helixa-teal/30" size={20} />
              <Input
                placeholder="Enter a symptom (e.g. headache, fever)"
                className="pl-12"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <Button type="submit" className="px-8">
              <Plus size={20} />
            </Button>
          </form>

          <div className="min-h-[100px] mb-8">
            <h3 className="text-sm font-bold text-helixa-teal/40 uppercase tracking-widest mb-4">Your Symptoms</h3>
            <div className="flex flex-wrap gap-3">
              <AnimatePresence>
                {symptoms.length === 0 ? (
                  <p className="text-helixa-teal/30 italic text-sm">No symptoms added yet...</p>
                ) : (
                  symptoms.map((symptom) => (
                    <motion.div
                      key={symptom}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 px-4 py-2 bg-helixa-green/10 text-helixa-green rounded-full text-sm font-bold border border-helixa-green/20"
                    >
                      {symptom}
                      <button onClick={() => removeSymptom(symptom)} className="hover:text-helixa-alert transition-colors">
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-4 mb-4 bg-helixa-alert/10 border border-helixa-alert/20 rounded-2xl text-helixa-alert text-sm font-bold"
              >
                <AlertCircle size={18} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            className="w-full py-6 text-xl flex items-center justify-center gap-3 relative overflow-hidden"
            disabled={symptoms.length === 0 || loading}
            onClick={handleAnalyze}
            title={isOffline ? 'Offline: symptoms will be saved locally' : ''}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing with Groq AI...
              </>
            ) : (
              <>
                {isOffline ? '☁️' : <Sparkles size={24} />}
                {isOffline ? 'Save Offline' : 'Analyze with AI'}
              </>
            )}
            {loading && (
              <motion.div
                className="absolute inset-0 bg-white/10"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />
            )}
          </Button>
          <div className="flex justify-center mt-3">
            <WorksOfflineLabel />
          </div>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-helixa-peach/20 border-helixa-peach/30">
            <h4 className="font-bold text-helixa-teal mb-2">Important Note</h4>
            <p className="text-sm text-helixa-teal/70 leading-relaxed">
              This tool is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </Card>
          <Card className="bg-helixa-alert/10 border-helixa-alert/20">
            <h4 className="font-bold text-helixa-alert mb-2">Emergency?</h4>
            <p className="text-sm text-helixa-teal/70 leading-relaxed">
              If you are experiencing a medical emergency, please call your local emergency services immediately.
            </p>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};