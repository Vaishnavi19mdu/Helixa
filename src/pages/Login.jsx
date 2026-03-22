import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '../components/Logo';
import { HelixaBot } from '../components/HelixaBot';
import { api } from '../utils/api';

export const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6 py-20 transition-colors duration-300">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-helixa-teal/60 hover:text-helixa-teal mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <Card className="p-8">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Logo className="w-16 h-16" iconClassName="w-8 h-8" showText={true} textClassName="text-4xl" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-helixa-teal">Welcome Back</h1>
            <p className="text-[var(--text-secondary)] mt-2 font-medium">Sign in to your Helixa account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-helixa-teal/60 cursor-pointer font-bold uppercase tracking-wider text-[10px]">
                <input type="checkbox" className="w-4 h-4 rounded border-[var(--border-color)] text-helixa-green focus:ring-helixa-green" />
                Remember me
              </label>
              <a href="#" className="text-helixa-green font-bold hover:underline uppercase tracking-wider text-[10px]">Forgot password?</a>
            </div>

            <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-center">
            <p className="text-[var(--text-secondary)] font-medium">
              Don't have an account?{' '}
              <Link to="/signup" className="text-helixa-green font-bold hover:underline inline-flex items-center gap-1">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    <HelixaBot />
    </div>
  );
};