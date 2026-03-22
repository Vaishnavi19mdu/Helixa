import React, { useState, useEffect } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {
  CheckCircle2, AlertCircle, ArrowLeft, Share2, Download,
  MessageSquare, ShieldAlert, Clock, Loader, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const severityColor = {
  mild:     { bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700'   },
  moderate: { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  severe:   { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-600'       },
};

// ── Single result view (after coming from checker) ────────────────────────────
const ResultDetail = ({ result, symptoms }) => {
  const severity = result.severity || 'mild';
  const colors   = severityColor[severity] || severityColor.mild;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="p-8 border-t-8 border-helixa-green">
          <div className="flex items-center gap-3 text-helixa-green mb-4">
            <CheckCircle2 size={24} />
            <span className="text-sm font-black uppercase tracking-widest">AI Analysis Complete</span>
          </div>

          <h1 className="text-4xl font-black text-[var(--text-primary)] mb-3">{result.condition}</h1>

          <span className={`inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-5 ${colors.badge}`}>
            {severity} severity
          </span>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-grow h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={`h-full ${colors.bar} rounded-full`}
              />
            </div>
            <span className="text-sm font-bold text-[var(--text-secondary)] whitespace-nowrap">
              {result.confidence}% confidence
            </span>
          </div>

          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-8">{result.description}</p>

          {result.recommendations?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-xs mb-3">Recommendations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]">
                    <div className="w-6 h-6 rounded-full bg-helixa-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-helixa-green">{i + 1}</span>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="Symptoms Analyzed">
          <div className="flex flex-wrap gap-2 mt-4">
            {symptoms.map((s, i) => (
              <span key={i} className="px-3 py-1.5 bg-helixa-green/10 text-helixa-green rounded-full text-xs font-bold border border-helixa-green/20">
                {s}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-helixa-green text-white border-none">
          <h3 className="text-lg font-black mb-3">Talk to a Doctor</h3>
          <p className="text-white/70 text-sm mb-5 leading-relaxed">Connect with a healthcare professional to discuss these results.</p>
          <Button className="w-full bg-white text-helixa-green hover:bg-white/90 flex items-center justify-center gap-2">
            <MessageSquare size={16} /> Start Consultation
          </Button>
        </Card>

        {result.seekHelpIf?.length > 0 && (
          <Card className="bg-red-50 border-red-100">
            <div className="flex items-center gap-2 text-red-500 mb-3">
              <ShieldAlert size={20} />
              <h3 className="font-black text-sm uppercase tracking-widest">Seek help if</h3>
            </div>
            <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc pl-4">
              {result.seekHelpIf.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </Card>
        )}

        <Card className="bg-helixa-green/5 border-helixa-green/20">
          <div className="flex items-center gap-2 text-helixa-green mb-2">
            <AlertCircle size={18} />
            <h3 className="font-bold text-sm">Disclaimer</h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            This AI analysis is for informational purposes only and is not a substitute for professional medical advice.
          </p>
        </Card>
      </div>
    </div>
  );
};

// ── History view (accessed from sidebar) ─────────────────────────────────────
const HistoryView = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      if (!user?.id) { setLoading(false); return; }
      try {
        const q    = query(
          collection(db, 'users', user.id, 'symptomHistory'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user?.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-40 gap-3 text-[var(--text-secondary)]">
      <Loader size={20} className="animate-spin" />
      <span className="font-bold text-sm">Loading history...</span>
    </div>
  );

  if (history.length === 0) return (
    <Card className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-helixa-green/10 flex items-center justify-center">
        <Activity size={28} className="text-helixa-green" />
      </div>
      <p className="text-lg font-black text-[var(--text-primary)]">No checks yet</p>
      <p className="text-sm text-[var(--text-secondary)] font-bold">Use the symptom checker to get your first AI analysis</p>
      <Link to="/checker">
        <Button className="mt-2">Go to Symptom Checker</Button>
      </Link>
    </Card>
  );

  return (
    <div className="space-y-4">
      {history.map((entry, i) => {
        const severity = entry.result?.severity || 'mild';
        const colors   = severityColor[severity] || severityColor.mild;
        const isOpen   = expanded === entry.id;
        const date     = entry.createdAt?.toDate?.()?.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) || 'Unknown date';

        return (
          <motion.div
            key={entry.id}
            layout
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden"
          >
            {/* Row */}
            <button
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-[var(--bg-primary)] transition-colors"
              onClick={() => setExpanded(isOpen ? null : entry.id)}
            >
              <div className={`w-2 h-10 rounded-full flex-shrink-0 ${colors.bar}`} />
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-black text-[var(--text-primary)]">{entry.result?.condition || 'Unknown'}</p>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {severity}
                  </span>
                  <span className="text-[10px] font-bold text-helixa-green">{entry.result?.confidence}% confidence</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {entry.symptoms?.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-helixa-green/10 text-helixa-green rounded-full font-bold">{s}</span>
                  ))}
                  {entry.symptoms?.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 bg-[var(--border-color)] text-[var(--text-secondary)] rounded-full font-bold">
                      +{entry.symptoms.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-[var(--text-secondary)] font-bold flex items-center gap-1 justify-end">
                  <Clock size={10} /> {date}
                </p>
                <p className="text-[10px] text-helixa-green font-black mt-1">{isOpen ? '▲ Less' : '▼ More'}</p>
              </div>
            </button>

            {/* Expanded detail */}
            <AnimatePresence>
              {isOpen && entry.result && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 border-t border-[var(--border-color)] pt-4 space-y-4">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{entry.result.description}</p>
                    {entry.result.recommendations?.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {entry.result.recommendations.map((rec, j) => (
                          <div key={j} className="flex items-start gap-2 p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
                            <span className="w-5 h-5 rounded-full bg-helixa-green/20 text-helixa-green text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{j+1}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{rec}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.result.seekHelpIf?.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                        <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                          <ShieldAlert size={12} /> Seek help if
                        </p>
                        <ul className="text-xs text-[var(--text-secondary)] space-y-1 list-disc pl-4">
                          {entry.result.seekHelpIf.map((s, j) => <li key={j}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────────
export const Results = ({ user }) => {
  const location = useLocation();

  // Doctors have no results page — redirect to dashboard
  if (user?.role === 'doctor') return <Navigate to="/dashboard" replace />;

  const symptoms = location.state?.symptoms || [];
  const result   = location.state?.result;
  const fromChecker = !!result;

  return (
    <MainLayout user={user}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-primary)]">
              {fromChecker ? 'Analysis Result' : 'Symptom History'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] font-bold mt-1">
              {fromChecker ? 'Your latest AI analysis' : 'All your past symptom checks'}
            </p>
          </div>
          <div className="flex gap-3">
            {fromChecker && (
              <>
                <Link to="/checker">
                  <Button variant="ghost" className="flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to Checker
                  </Button>
                </Link>
                <Button variant="outline" className="p-3 rounded-2xl"><Share2 size={20} /></Button>
                <Button variant="outline" className="p-3 rounded-2xl"><Download size={20} /></Button>
              </>
            )}
            {!fromChecker && (
              <Link to="/checker">
                <Button className="flex items-center gap-2">
                  <Activity size={16} /> New Check
                </Button>
              </Link>
            )}
          </div>
        </div>

        {fromChecker
          ? <ResultDetail result={result} symptoms={symptoms} />
          : <HistoryView user={user} />
        }
      </div>
    </MainLayout>
  );
};