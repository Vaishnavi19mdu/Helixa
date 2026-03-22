import React from 'react';
import { Card } from './Card';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export const ProfileCard = ({ user }) => {
  return (
    <Card className="max-w-md mx-auto overflow-hidden p-0">
      <div className="h-24 bg-gradient-to-r from-helixa-green/20 to-helixa-teal/20" />
      <div className="px-6 pb-6 -mt-12 text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-helixa-peach mx-auto">
            <img 
              src={user?.profilePic || `https://ui-avatars.com/api/?name=${user?.firstName || 'U'}&background=FFE5B4&color=007099`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-helixa-green rounded-full border-2 border-white flex items-center justify-center">
            <Shield size={12} className="text-white" />
          </div>
        </div>
        
        <h2 className="mt-4 text-2xl font-bold text-helixa-teal">
          {user?.role === 'doctor' ? `Dr. ${user.firstName} ${user.lastName}` : `${user.firstName} ${user.lastName}`}
        </h2>
        <p className="text-helixa-teal/60 capitalize mb-6">{user.role}</p>
        
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3 text-helixa-teal/70">
            <Mail size={18} className="text-helixa-green" />
            <span className="text-sm">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-helixa-teal/70">
            <Calendar size={18} className="text-helixa-green" />
            <span className="text-sm">Joined March 2026</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
