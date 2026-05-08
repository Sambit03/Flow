'use client';

type DotStatus = 'success' | 'failed' | 'running' | 'pending' | 'skipped' | 'inactive';

const DOT_COLORS: Record<DotStatus, string> = {
  success:  '#3FB950',
  failed:   '#F85149',
  running:  '#388BFD',
  pending:  '#30363D',
  skipped:  '#30363D',
  inactive: '#484F58',
};

interface StatusDotProps {
  status: DotStatus;
  size?: number;
  pulse?: boolean;
}

export function StatusDot({ status, size = 6, pulse }: StatusDotProps) {
  const color = DOT_COLORS[status];
  const shouldPulse = pulse && status === 'running';

  return (
    <span
      className={shouldPulse ? 'animate-pulse-blue' : ''}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}
