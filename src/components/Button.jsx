import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Button = ({ children, className, variant = 'primary', size = 'md', ...props }) => {
  const variants = {
    primary: 'bg-helixa-green text-white hover:bg-helixa-green/90 shadow-sm',
    secondary: 'bg-helixa-teal text-white hover:bg-helixa-teal/90 shadow-sm',
    outline: 'border-2 border-helixa-green text-helixa-green hover:bg-helixa-green/5',
    ghost: 'text-helixa-teal/60 hover:text-helixa-teal hover:bg-helixa-teal/5',
    alert: 'bg-helixa-alert text-white hover:bg-helixa-alert/90 shadow-sm',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-10 py-4 text-lg',
  };

  return (
    <button
      className={twMerge(
        'btn-matte rounded-full font-bold uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
