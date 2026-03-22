import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Input = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-sm font-bold text-[var(--text-secondary)] ml-1 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        className={twMerge(
          'w-full px-4 py-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-helixa-green focus:ring-2 focus:ring-helixa-green/20 outline-none transition-all duration-200 placeholder:text-[var(--text-secondary)]',
          error && 'border-helixa-alert focus:ring-helixa-alert/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-helixa-alert ml-1 mt-1">{error}</p>
      )}
    </div>
  );
};
