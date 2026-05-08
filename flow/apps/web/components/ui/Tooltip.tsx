'use client';

import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const SIDE_STYLES = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  right:  'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={[
            'absolute z-50 px-2 py-1 text-xs rounded whitespace-nowrap pointer-events-none',
            'bg-[#1C2333] text-[#E6EDF3] border border-[#30363D]',
            'shadow-[0_4px_12px_rgba(0,0,0,0.6)]',
            'animate-fade-in',
            SIDE_STYLES[side],
          ].join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  );
}
