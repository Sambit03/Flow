'use client';

import type { ReactNode } from 'react';

type BadgeVariant =
  | 'success' | 'failed' | 'running' | 'pending' | 'skipped'
  | 'webhook' | 'cron' | 'manual'
  | 'active' | 'inactive'
  | 'default';

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success:  'bg-[rgba(63,185,80,0.15)]  text-[#3FB950] border-[rgba(63,185,80,0.3)]',
  failed:   'bg-[rgba(248,81,73,0.15)]  text-[#F85149] border-[rgba(248,81,73,0.3)]',
  running:  'bg-[rgba(56,139,253,0.15)] text-[#388BFD] border-[rgba(56,139,253,0.3)]',
  pending:  'bg-[rgba(72,79,88,0.3)]    text-[#8B949E] border-[#30363D]',
  skipped:  'bg-[rgba(72,79,88,0.2)]    text-[#484F58] border-[#21262D]',
  webhook:  'bg-[rgba(57,211,83,0.12)]  text-[#39D353] border-[rgba(57,211,83,0.3)]',
  cron:     'bg-[rgba(210,153,34,0.15)] text-[#D29922] border-[rgba(210,153,34,0.3)]',
  manual:   'bg-[rgba(188,140,255,0.15)]text-[#BC8CFF] border-[rgba(188,140,255,0.3)]',
  active:   'bg-[rgba(63,185,80,0.12)]  text-[#3FB950] border-[rgba(63,185,80,0.25)]',
  inactive: 'bg-[rgba(72,79,88,0.2)]    text-[#8B949E] border-[#30363D]',
  default:  'bg-[#161B22]               text-[#8B949E] border-[#30363D]',
};

const TRIGGER_ICONS: Partial<Record<BadgeVariant, string>> = {
  webhook: '⛓',
  cron:    '⏰',
  manual:  '▷',
};

const STATUS_ICONS: Partial<Record<BadgeVariant, string>> = {
  success: '✓',
  failed:  '✕',
  running: '◉',
  pending: '○',
  skipped: '⊘',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children?: ReactNode;
  pulse?: boolean;
  className?: string;
  icon?: string;
}

export function Badge({ variant = 'default', children, pulse, className = '', icon }: BadgeProps) {
  const resolvedIcon = icon ?? TRIGGER_ICONS[variant] ?? STATUS_ICONS[variant];

  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5',
        'text-xs font-medium font-mono rounded border',
        'whitespace-nowrap',
        VARIANT_STYLES[variant],
        pulse && variant === 'running' ? 'animate-pulse-blue' : '',
        className,
      ].join(' ')}
    >
      {resolvedIcon && <span className="text-[10px]">{resolvedIcon}</span>}
      {children}
    </span>
  );
}
