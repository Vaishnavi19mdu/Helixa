import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Heart, Shield, Zap, Activity, CheckCircle2, Users, Lock, WifiOff, ArrowRight, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MainLayout } from '../layouts/MainLayout';
import { Logo } from '../components/Logo';
import { HealthJourney } from '../components/HealthJourney';

const RoleCard = ({ title, items, buttonText, color, glowColor, icon: Icon }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        y: -10,
        boxShadow: `0 20px 40px ${glowColor}`
      }}
      className={`relative p-12 rounded-[40px] ${color} text-white shadow-2xl overflow-hidden transition-all duration-300`}
    >
      {/* Floating Icons Animation */}
      <AnimatePresence>
        {isHovered && [1, 2, 3].map((id) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 20, x: (id - 2) * 30, scale: 0.5 }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: -150, 
              x: (id - 2) * 60 + (Math.random() - 0.5) * 40,
              scale: [0.5, 1.2, 0.8],
              rotate: (id - 2) * 20
            }}
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: id * 0.4,
              ease: "easeOut"
            }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            <Icon size={32} className="opacity-40" />
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <h2 className="text-3xl font-black">{title}</h2>
        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
          <Icon size={28} />
        </div>
      </div>
      <ul className="space-y-4 mb-8 relative z-10">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 font-bold">
            <CheckCircle2 size={20} />
            {item}
          </li>
        ))}
      </ul>
      <Link to="/signup" className="relative z-10 inline-block">
        <Button className={`${color === 'bg-helixa-green' ? 'bg-white text-helixa-green hover:bg-white/90' : 'bg-helixa-green text-white hover:bg-helixa-green/90'} rounded-full px-8 py-4 font-black uppercase tracking-widest text-xs`}>
          {buttonText}
        </Button>
      </Link>
    </motion.div>
  );
};

export const Home = () => {
  return (
    <MainLayout>
      <div className="text-helixa-teal">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-helixa-beige to-helixa-light-green/30">
          <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20 relative z-10">
            {/* Left Side: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-xl"
            >
              <h1 className="text-5xl md:text-6xl font-black tracking-tight text-helixa-teal mb-6 font-lato leading-[1.1]">
                Welcome to smarter healthcare with Helixa
              </h1>
              <p className="text-xl text-[var(--text-secondary)] mb-10 font-medium leading-relaxed font-lato">
                AI-powered symptom checking and patient support designed to be calm, fast, and reliable.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/signup">
                  <Button className="bg-helixa-green text-white hover:bg-helixa-green/90 rounded-full px-10 py-6 text-lg btn-matte">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="border-helixa-teal/20 text-helixa-teal hover:bg-helixa-teal/5 rounded-full px-10 py-6 text-lg">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right Side: Visual (AI & Medicine Theme) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-[40px] overflow-hidden shadow-2xl border-8 border-white/50 aspect-[4/3] bg-white">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=1200" 
                  alt="AI Healthcare Technology" 
                  className="w-full h-full object-cover saturate-[0.7] brightness-[1.02] contrast-[1.1]"
                  referrerPolicy="no-referrer"
                />
                {/* Soft Overlay for Modern Tech Effect */}
                <div className="absolute inset-0 bg-helixa-teal/5 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-helixa-teal/10 to-transparent"></div>
                
                {/* Subtle Floating Bot-like Element Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-64 h-64 border-2 border-helixa-green/20 rounded-full flex items-center justify-center"
                  >
                    <div className="w-48 h-48 border border-helixa-teal/10 rounded-full animate-pulse"></div>
                  </motion.div>
                </div>
              </div>
              
              {/* Decorative Shapes */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-helixa-green/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -top-10 -right-10 w-60 h-60 bg-helixa-teal/5 rounded-full blur-3xl -z-10"></div>
            </motion.div>
          </div>

          {/* Curved Shape Separator */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] transform translate-y-[1px]">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[calc(100%+1.3px)] h-[100px] fill-helixa-beige">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C58.23,115.34,131.83,115.6,202.08,103.82c71.28-12,137.14-36.65,202.08-56.44Z"></path>
            </svg>
          </div>
        </section>

        {/* Health Journey (Interactive Path) */}
        <HealthJourney />

        {/* Why Helixa (Merged Trust Section) */}
        <section className="relative py-32 px-6 overflow-hidden bg-white">
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-helixa-teal mb-4 tracking-tight">Why Helixa</h2>
              <p className="text-xl text-[var(--text-secondary)] font-bold max-w-2xl mx-auto">Trust-focused features for modern healthcare.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Zap, title: 'Fast AI Insights', desc: 'Get preliminary results in seconds, not hours.' },
                { icon: Lock, title: 'Privacy-First', desc: 'Your health data is encrypted and never sold.' },
                { icon: WifiOff, title: 'Offline Capability', desc: 'Access critical health info even without internet.' },
                { icon: Shield, title: 'Reliable Guidance', desc: 'Clinically-backed models for peace of mind.' },
              ].map((feature, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.05 }}
                  className="group relative p-10 bg-helixa-beige/30 border border-helixa-teal/5 rounded-[40px] transition-all duration-500 hover:bg-helixa-teal hover:text-white h-72 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-helixa-teal/5 flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                    <feature.icon className="text-helixa-teal group-hover:text-white transition-colors" size={28} />
                  </div>
                  <h3 className="text-xl font-black text-helixa-teal mb-3 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-sm font-bold text-[var(--text-secondary)] group-hover:text-white/70 transition-colors leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* For Patients & Doctors */}
        <section className="py-24 px-6 bg-helixa-beige/20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
            <RoleCard 
              title="For Patients"
              items={['Check symptoms anytime', 'Track health history', 'Direct doctor communication', 'Personalized health tips']}
              buttonText="Join as Patient"
              color="bg-helixa-green"
              glowColor="rgba(123, 186, 145, 0.4)"
              icon={Heart}
            />
            <RoleCard 
              title="For Doctors"
              items={['Patient analytics dashboard', 'AI-assisted triage', 'Secure messaging', 'Efficient task management']}
              buttonText="Join as Provider"
              color="bg-helixa-teal"
              glowColor="rgba(0, 112, 153, 0.4)"
              icon={Stethoscope}
            />
          </div>
        </section>

        {/* Single CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto bg-white rounded-[40px] overflow-hidden shadow-2xl border border-helixa-teal/5 flex flex-col md:flex-row items-center relative z-20">
            <div className="flex-1 p-12 md:p-20">
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-black text-helixa-teal mb-6 tracking-tight font-lato"
              >
                Ready to take control?
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-[var(--text-secondary)] font-medium mb-10 font-lato"
              >
                Join thousands of users who trust Helixa for their daily health insights.
              </motion.p>
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block"
                >
                  <Button className="bg-helixa-green text-white hover:bg-helixa-green/90 rounded-full px-12 py-6 text-lg btn-matte shadow-xl font-black uppercase tracking-widest">
                    Get Started Now
                  </Button>
                </motion.div>
              </Link>
            </div>
            <div className="flex-1 h-[400px] md:h-full w-full relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000" 
                alt="Modern Healthcare Environment"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent md:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent md:hidden block" />
            </div>
          </div>
        </section>

        {/* Contact Us Form */}
        <section className="py-24 px-6 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-helixa-teal mb-4">Contact Us</h2>
            <p className="text-[var(--text-secondary)] font-bold">Have questions? We're here to help you on your health journey.</p>
          </div>
          <div className="p-10 rounded-[40px] bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-[var(--text-secondary)] ml-1 uppercase tracking-wider">Full Name</label>
                  <input className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-helixa-green focus:ring-2 focus:ring-helixa-green/20 outline-none transition-all font-bold" placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-[var(--text-secondary)] ml-1 uppercase tracking-wider">Email ID</label>
                  <input className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-helixa-green focus:ring-2 focus:ring-helixa-green/20 outline-none transition-all font-bold" type="email" placeholder="john@example.com" />
                </div>
              </div>
              <div className="flex items-center gap-3 px-1">
                <input 
                  type="checkbox" 
                  id="already-user" 
                  className="w-5 h-5 rounded border-[var(--border-color)] text-helixa-green focus:ring-helixa-green"
                />
                <label htmlFor="already-user" className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Already a user?</label>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-[var(--text-secondary)] ml-1 uppercase tracking-wider">Query Message</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-helixa-green focus:ring-2 focus:ring-helixa-green/20 outline-none transition-all min-h-[150px] resize-none font-bold"
                  placeholder="How can we help you? (Max 200 words)"
                  maxLength={1000}
                ></textarea>
                <p className="text-[10px] text-[var(--text-secondary)] text-right font-bold uppercase tracking-widest">Important: Max 200 words</p>
              </div>
              <Button className="w-full py-4 text-lg">Submit Message</Button>
            </form>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};