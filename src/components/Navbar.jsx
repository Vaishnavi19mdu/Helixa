import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, LayoutDashboard, Activity, Settings, LogOut, User, Sun, Moon } from 'lucide-react';

export const Navbar = ({ user, darkMode, toggleDarkMode }) => {
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Activity, label: 'Symptom Checker', path: '/checker' },
    { icon: User, label: 'Profile', path: '/profile-setup' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-[var(--bg-secondary)]/80 backdrop-blur-md border-b border-[var(--border-color)] z-50 px-6 flex items-center justify-between transition-colors duration-300">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="relative w-10 h-10 bg-gradient-to-br from-helixa-green to-helixa-teal rounded-xl flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
          <Heart className="text-white w-6 h-6 fill-white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1 h-6 bg-white rotate-45 translate-x-0.5 -translate-y-0.5 rounded-full" />
            <span className="absolute text-[10px] font-black text-helixa-teal/40 -translate-x-0.5 translate-y-0.5">H</span>
          </div>
        </div>
        <span className="text-2xl font-black tracking-tight text-helixa-teal">Helixa</span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isActive(item.path) ? 'text-helixa-green' : 'text-helixa-teal/60 hover:text-helixa-teal'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* User Info & Controls */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-helixa-teal hover:border-helixa-green transition-all"
          aria-label="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-helixa-teal">
            {user?.role === 'doctor' ? `Hello Dr. ${user.firstName} ${user.lastName}` : `Hello ${user?.firstName || 'Guest'}`}
          </p>
          <p className="text-xs text-[var(--text-secondary)] capitalize">{user?.role || 'Guest'}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-helixa-peach border-2 border-white shadow-sm overflow-hidden">
          <img 
            src={user?.profilePic || `https://ui-avatars.com/api/?name=${user?.firstName || 'U'}&background=FFE5B4&color=007099`} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <Link to="/login" className="p-2 text-helixa-teal/40 hover:text-helixa-alert transition-colors">
          <LogOut size={20} />
        </Link>
      </div>
    </nav>
  );
};
