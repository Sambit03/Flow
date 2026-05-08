'use client';

import type { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: React.ReactNode;
}

export function Input({ label, error, hint, leadingIcon, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[#8B949E] uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leadingIcon && (
          <span className="absolute left-3 text-[#484F58] pointer-events-none">{leadingIcon}</span>
        )}
        <input
          id={inputId}
          className={[
            'w-full h-9 px-3 text-sm',
            'bg-[#0D1117] text-[#E6EDF3] placeholder:text-[#484F58]',
            'border rounded-md',
            'transition-colors duration-[120ms]',
            error
              ? 'border-[#F85149] focus:border-[#F85149] focus:shadow-[0_0_0_3px_rgba(248,81,73,0.15)]'
              : 'border-[#30363D] focus:border-[#388BFD] focus:shadow-[0_0_0_3px_rgba(56,139,253,0.15)]',
            'outline-none',
            leadingIcon ? 'pl-9' : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#F85149]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#484F58]">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-[#8B949E] uppercase tracking-wide">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={[
          'w-full px-3 py-2 text-sm',
          'bg-[#0D1117] text-[#E6EDF3] placeholder:text-[#484F58]',
          'border rounded-md resize-none',
          'transition-colors duration-[120ms] outline-none',
          error
            ? 'border-[#F85149] focus:border-[#F85149]'
            : 'border-[#30363D] focus:border-[#388BFD] focus:shadow-[0_0_0_3px_rgba(56,139,253,0.15)]',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <p className="text-xs text-[#F85149]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#484F58]">{hint}</p>}
    </div>
  );
}
