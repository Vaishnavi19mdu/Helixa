import React from 'react';
import { Zap } from 'lucide-react';

export const Logo = ({ className = "w-10 h-10", iconClassName = "w-6 h-6", showText = false, textClassName = "text-2xl" }) => {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Heart Outline */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`text-helixa-green w-full h-full`}
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        {/* Lightning Bolt */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap 
            className={`text-helixa-teal fill-helixa-teal ${iconClassName} translate-y-[-1px]`} 
            strokeWidth={1}
          />
        </div>
      </div>
      {showText && (
        <span className={`font-black tracking-tight text-helixa-teal ${textClassName}`}>
          Helixa
        </span>
      )}
    </div>
  );
};
