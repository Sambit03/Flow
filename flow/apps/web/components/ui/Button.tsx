'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'outline';
type ButtonSize    = 'sm' | 'md' | 'lg';

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#388BFD] text-white border-transparent',
    'hover:bg-[#4596FF] hover:shadow-[0_0_20px_rgba(56,139,253,0.3)]',
    'disabled:bg-[#21262D] disabled:text-[#484F58] disabled:shadow-none',
  ].join(' '),
  ghost: [
    'bg-transparent text-[#8B949E] border-transparent',
    'hover:bg-[#1C2333] hover:text-[#E6EDF3]',
  ].join(' '),
  danger: [
    'bg-[#F85149] text-white border-transparent',
    'hover:bg-[#ff6b63] hover:shadow-[0_0_16px_rgba(248,81,73,0.3)]',
  ].join(' '),
  outline: [
    'bg-transparent text-[#E6EDF3] border-[#30363D]',
    'hover:border-[#388BFD] hover:text-[#388BFD]',
  ].join(' '),
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-7  px-3  text-xs  gap-1.5',
  md: 'h-8  px-4  text-sm  gap-2',
  lg: 'h-10 px-5  text-sm  gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium rounded border',
        'transition-all duration-[120ms] cursor-pointer',
        'disabled:cursor-not-allowed',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
      )}
      {children}
    </button>
  );
}
