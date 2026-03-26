import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { Logo } from '../components/Logo';
import { ArrowLeft, User, Stethoscope, Camera, AlertCircle, WifiOff } from 'lucide-react';
import { api } from '../utils/api';
import { HelixaBot } from '../components/HelixaBot';

export const Signup = ({ setUser }) => {
  const [step, setStep]       = useState('signup');
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    profile: {
      phone: '', location: '', specialty: '',
      experience: '', bio: '', dob: '', gender: '',
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (!role || isOffline) return;
    setStep('profile');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (isOffline) return;
    setLoading(true);
    setError(null);

    try {
      const { user } = await api.signup({
        firstName: formData.firstName,
        lastName:  formData.lastName,
        email:     formData.email,
        password:  formData.password,
        role,
        profile:   formData.profile,
      });

      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup failed:', err);
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const OfflineBanner = () => (
    <div className="flex items-center gap-3 p-4 mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-sm font-bold">
      <WifiOff size={18} className="flex-shrink-0" />
      You're offline. Please connect to the internet to create an account.
    </div>
  );

  const renderSignup = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md"
    >
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-helixa-teal/60 hover:text-helixa-teal mb-8 transition-colors group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <Card className="p-8">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo className="w-16 h-16" iconClassName="w-8 h-8" showText={true} textClassName="text-4xl" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-helixa-teal">Create Account</h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">Join the future of healthcare</p>
        </div>

        {isOffline && <OfflineBanner />}

        <form onSubmit={handleSignupSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Jane"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              disabled={isOffline}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              disabled={isOffline}
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            placeholder="jane@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isOffline}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isOffline}
          />

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-helixa-teal/60 uppercase tracking-widest ml-1">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => !isOffline && setRole('patient')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isOffline ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${role === 'patient' ? 'border-helixa-green bg-helixa-green/5' : 'border-[var(--border-color)] hover:border-helixa-green/30'}`}
              >
                <User size={24} className={role === 'patient' ? 'text-helixa-green' : 'text-helixa-teal/40'} />
                <span className={`text-sm font-bold ${role === 'patient' ? 'text-helixa-teal' : 'text-helixa-teal/60'}`}>Patient</span>
              </div>
              <div
                onClick={() => !isOffline && setRole('doctor')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isOffline ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${role === 'doctor' ? 'border-helixa-teal bg-helixa-teal/5' : 'border-[var(--border-color)] hover:border-helixa-teal/30'}`}
              >
                <Stethoscope size={24} className={role === 'doctor' ? 'text-helixa-teal' : 'text-helixa-teal/40'} />
                <span className={`text-sm font-bold ${role === 'doctor' ? 'text-helixa-teal' : 'text-helixa-teal/60'}`}>Doctor</span>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full py-4 text-lg" disabled={!role || isOffline}>
            {isOffline ? 'No Connection' : 'Continue'}
          </Button>
        </form>

        <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-center">
          <p className="text-[var(--text-secondary)] font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-helixa-green font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </Card>
    </motion.div>
  );

  const renderProfileSetup = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-2xl"
    >
      <Card className="p-8">
        <div className="flex items-center gap-6 mb-10">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-secondary)] border-2 border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-secondary)] cursor-pointer hover:border-helixa-green hover:text-helixa-green transition-colors">
            <Camera size={24} className="mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-helixa-teal">Complete Profile</h2>
            <p className="text-[var(--text-secondary)] font-medium">Setting up your {role} profile</p>
          </div>
        </div>

        {isOffline && <OfflineBanner />}

        {error && !isOffline && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-helixa-alert/10 border border-helixa-alert/20 rounded-2xl text-helixa-alert text-sm font-bold">
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.profile.phone}
              onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, phone: e.target.value } })}
              disabled={isOffline}
            />
            <Input
              label="Location"
              placeholder="Bengaluru, India"
              value={formData.profile.location}
              onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, location: e.target.value } })}
              disabled={isOffline}
            />
          </div>

          {role === 'doctor' ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Specialty"
                placeholder="Cardiologist"
                value={formData.profile.specialty}
                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, specialty: e.target.value } })}
                required
                disabled={isOffline}
              />
              <Input
                label="Years of Experience"
                type="number"
                placeholder="10"
                value={formData.profile.experience}
                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, experience: e.target.value } })}
                required
                disabled={isOffline}
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Date of Birth"
                type="date"
                value={formData.profile.dob}
                onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, dob: e.target.value } })}
                required
                disabled={isOffline}
              />
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-helixa-teal/60 uppercase tracking-widest">Gender</label>
                <select
                  className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-helixa-green transition-colors text-helixa-teal font-medium appearance-none disabled:opacity-40 disabled:cursor-not-allowed"
                  value={formData.profile.gender}
                  onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, gender: e.target.value } })}
                  required
                  disabled={isOffline}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-helixa-teal/60 uppercase tracking-widest">
              {role === 'doctor' ? 'Professional Bio' : 'Health Goals / Bio'}
            </label>
            <textarea
              className="w-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 focus:outline-none focus:border-helixa-green transition-colors text-helixa-teal font-medium min-h-[120px] disabled:opacity-40 disabled:cursor-not-allowed"
              placeholder={role === 'doctor' ? 'Briefly describe your medical background...' : 'What are your primary health goals?'}
              value={formData.profile.bio}
              onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, bio: e.target.value } })}
              disabled={isOffline}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="outline" className="flex-1 py-4" onClick={() => setStep('signup')} disabled={loading}>
              Back
            </Button>
            <Button type="submit" className="flex-[2] py-4 text-lg" disabled={loading || isOffline}>
              {loading ? 'Creating account...' : isOffline ? 'No Connection' : 'Finish Setup'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6 py-20 transition-colors duration-300 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {step === 'signup'  && renderSignup()}
        {step === 'profile' && renderProfileSetup()}
      </AnimatePresence>
      <HelixaBot />
    </div>
  );
};