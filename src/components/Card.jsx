import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Card = ({ children, className, title, subtitle, ...props }) => {
  return (
    <div
      className={twMerge(
        'bg-[var(--bg-secondary)] rounded-2xl p-6 card-shadow border border-[var(--border-color)]',
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>}
          {subtitle && <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
