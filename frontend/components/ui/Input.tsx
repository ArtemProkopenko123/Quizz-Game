'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={[
            'h-11 w-full rounded-xl border px-4 text-base',
            'bg-white text-zinc-900 placeholder:text-zinc-400',
            'transition-colors duration-150',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
              : 'border-zinc-300 focus:border-violet-500 focus:ring-violet-100',
            'focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
