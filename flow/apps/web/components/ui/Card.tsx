'use client';

import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  selected?: boolean;
  children: ReactNode;
}

export function Card({ hover, selected, children, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'bg-[#0D1117] border rounded-lg',
        'transition-all duration-[200ms]',
        selected
          ? 'border-[#388BFD] shadow-[0_0_0_1px_rgba(56,139,253,0.3)]'
          : 'border-[#30363D]',
        hover
          ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#388BFD] hover:shadow-[0_4px_16px_rgba(0,0,0,0.6)]'
          : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
