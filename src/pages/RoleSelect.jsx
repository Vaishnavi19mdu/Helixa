import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { User, Stethoscope, ArrowLeft, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';

export const RoleSelect = ({ setUser }) => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'patient',
      title: 'Patient',
      desc: 'I want to check my symptoms and manage my health.',
      icon: User,
      color: 'bg-helixa-green/10 text-helixa-green',
      demoTitle: 'Explore as Patient'
    },
    {
      id: 'doctor',
      title: 'Healthcare Provider',
      desc: 'I want to support my patients and manage tasks.',
      icon: Stethoscope,
      color: 'bg-helixa-teal/10 text-helixa-teal',
      demoTitle: 'Explore as Provider'
    },
  ];

  const handleSelect = (roleId) => {
    if (roleId === 'patient') {
      setUser({ firstName: 'Demo', lastName: 'Patient', role: 'patient', email: 'patient@demo.com' });
      navigate('/dashboard');
    } else if (roleId === 'doctor') {
      setUser({ firstName: 'Demo', lastName: 'Doctor', role: 'doctor', email: 'doctor@demo.com' });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6 py-12 transition-colors duration-300">
      <div className="w-full max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-helixa-teal/60 hover:text-helixa-teal mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <Logo className="w-20 h-20" iconClassName="w-10 h-10" showText={true} textClassName="text-5xl" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-helixa-teal mb-4">Experience Helixa</h1>
          <p className="text-[var(--text-secondary)] text-lg font-medium uppercase tracking-widest text-sm">Select a demo role to explore the platform</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {roles.map((role, i) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ 
                delay: i * 0.1,
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
              className="h-full"
            >
              <Card
                className="h-full p-8 cursor-pointer border-2 border-transparent hover:border-helixa-green/30 transition-all group flex flex-col items-center text-center shadow-sm hover:shadow-xl bg-[var(--bg-secondary)]"
                onClick={() => handleSelect(role.id)}
              >
                <div className={`w-24 h-24 rounded-[2rem] ${role.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                  <role.icon size={48} className="relative z-10" />
                </div>
                <h3 className="text-2xl font-black text-helixa-teal mb-4 tracking-tight">{role.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-10 font-medium">{role.desc}</p>
                <Button variant="outline" className="w-full mt-auto py-6 rounded-2xl group-hover:bg-helixa-green group-hover:text-white group-hover:border-helixa-green transition-all duration-300 font-bold uppercase tracking-widest text-xs">
                  {role.demoTitle}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
