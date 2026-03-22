import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { Link } from 'react-router-dom';
import { Activity, Search, Lightbulb, ArrowRight, Sparkles } from 'lucide-react';

const JourneyNode = ({ icon: Icon, label, description, x, y, color, delay }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="absolute z-30" 
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className="relative flex flex-col items-center">
        {/* Node Pulse Effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.2 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className={`absolute inset-0 rounded-full ${color === 'green' ? 'bg-helixa-green' : 'bg-helixa-teal'}`}
            />
          )}
        </AnimatePresence>

        {/* Node Circle - Squishy Interaction */}
        <motion.div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ 
            delay, 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
          whileHover={{ 
            scale: 1.1,
            y: -5,
            boxShadow: `0 15px 30px ${color === 'green' ? 'rgba(123, 186, 145, 0.4)' : 'rgba(0, 112, 153, 0.4)'}`
          }}
          whileTap={{ scale: 0.95 }}
          className={`w-14 h-14 md:w-18 md:h-18 rounded-full bg-white flex items-center justify-center cursor-pointer shadow-md border-2 ${color === 'green' ? 'border-helixa-green/40' : 'border-helixa-teal/40'} relative z-10`}
        >
          <Icon className={color === 'green' ? 'text-helixa-green' : 'text-helixa-teal'} size={28} />
        </motion.div>

        {/* Label - Only on Hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              className="absolute top-full mt-4 text-center w-32 md:w-40 bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-helixa-teal/10 shadow-xl z-40"
            >
              <p className="text-xs font-black text-helixa-teal uppercase tracking-widest mb-1">{label}</p>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold leading-tight">
                {description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Static Label (Minimal) */}
        {!isHovered && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="absolute top-full mt-2 text-[9px] font-black text-helixa-teal/40 uppercase tracking-tighter whitespace-nowrap"
          >
            {label}
          </motion.p>
        )}
      </div>
    </div>
  );
};

const LandscapeElements = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Layered Background Hills - More Depth */}
    <div className="absolute bottom-0 w-full h-full">
      <svg className="absolute bottom-0 w-full h-[70%] opacity-[0.03]" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#007099" d="M0,128L120,144C240,160,480,192,720,192C960,192,1200,160,1320,144L1440,128L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
      </svg>
      <svg className="absolute bottom-0 w-full h-[55%] opacity-[0.07]" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#7BBA91" d="M0,192L120,181.3C240,171,480,149,720,160C960,171,1200,213,1320,234.7L1440,256L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
      </svg>
      <svg className="absolute bottom-0 w-full h-[35%] opacity-[0.12]" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#007099" d="M0,224L80,213.3C160,203,320,181,480,192C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
      </svg>
    </div>

    {/* Floating Soft Blobs (Clouds/Mist) */}
    <motion.div 
      animate={{ x: [0, 30, 0], y: [0, 15, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute top-10 left-[5%] w-72 h-72 bg-white/40 rounded-full blur-[120px]" 
    />
    <motion.div 
      animate={{ x: [0, -30, 0], y: [0, -20, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-32 right-[10%] w-96 h-96 bg-helixa-green/10 rounded-full blur-[140px]" 
    />

    {/* Plant/Bush Clusters near path - More variety */}
    {[
      { left: '12%', bottom: '42%', size: 'w-10 h-10', delay: 0 },
      { left: '38%', bottom: '32%', size: 'w-14 h-14', delay: 0.4 },
      { left: '62%', bottom: '58%', size: 'w-12 h-12', delay: 0.8 },
      { left: '88%', bottom: '38%', size: 'w-16 h-16', delay: 1.2 },
      { left: '25%', bottom: '25%', size: 'w-6 h-6', delay: 1.6 },
      { left: '75%', bottom: '20%', size: 'w-8 h-8', delay: 2.0 },
    ].map((bush, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: bush.delay, type: "spring", stiffness: 100 }}
        className={`absolute ${bush.left} ${bush.bottom} ${bush.size} text-helixa-green/20`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2C10.34,2,9,3.34,9,5c0,0.17,0.02,0.34,0.05,0.5C7.26,6.14,6,7.92,6,10c0,2.76,2.24,5,5,5h2c2.76,0,5-2.24,5-5c0-2.08-1.26-3.86-3.05-4.5C15,5.34,15,5.17,15,5C15,3.34,13.66,2,12,2z" />
        </svg>
      </motion.div>
    ))}
  </div>
);

export const HealthJourney = () => {
  return (
    <section className="py-32 px-6 bg-helixa-beige relative overflow-hidden">
      <LandscapeElements />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-helixa-green/10 text-helixa-green text-xs font-black uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} />
            Guided Experience
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-helixa-teal mb-6 tracking-tight font-lato"
          >
            Start your health journey in seconds
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[var(--text-secondary)] font-medium max-w-2xl mx-auto font-lato"
          >
            Follow a simple, guided path to better understand your health.
          </motion.p>
        </div>

        {/* Interactive Trail Path Container */}
        <div className="relative h-[450px] md:h-[500px] w-full mb-8">
          {/* SVG Trail Path */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7BBA91" />
                <stop offset="50%" stopColor="#007099" />
                <stop offset="100%" stopColor="#7BBA91" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Background Trail (Shadow/Depth) */}
            <motion.path
              d="M 100 300 C 200 200 350 400 500 300 S 750 100 900 300"
              fill="none"
              stroke="white"
              strokeWidth="20"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.3 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />

            {/* Main Trail Path - Irregular & Gradient */}
            <motion.path
              d="M 100 300 C 200 200 350 400 500 300 S 750 100 900 300"
              fill="none"
              stroke="url(#trailGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="2 18"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
          </svg>

          {/* Nodes Anchored DIRECTLY on the Path */}
          <JourneyNode 
            x={10} y={60} 
            icon={Search} 
            label="Enter Symptoms" 
            description="Describe how you feel."
            color="green"
            delay={0.2}
          />
          <JourneyNode 
            x={35} y={64} 
            icon={Activity} 
            label="AI Analysis" 
            description="Medical-grade processing."
            color="teal"
            delay={0.8}
          />
          <JourneyNode 
            x={65} y={41} 
            icon={Lightbulb} 
            label="Health Insights" 
            description="Deep understanding."
            color="teal"
            delay={1.4}
          />
          <JourneyNode 
            x={90} y={60} 
            icon={ArrowRight} 
            label="Take Action" 
            description="Clear next steps."
            color="green"
            delay={2.0}
          />
        </div>
      </div>
    </section>
  );
};
