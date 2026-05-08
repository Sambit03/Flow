'use client';

import Link from 'next/link';
import type { CanvasNode } from '@/store';

type StepStatus = 'pending' | 'running' | 'success' | 'failed';

const STATUS_ICONS: Record<StepStatus, string> = {
  pending: '○',
  running: '◉',
  success: '✓',
  failed:  '✕',
};
const STATUS_COLORS: Record<StepStatus, string> = {
  pending: '#484F58',
  running: '#388BFD',
  success: '#3FB950',
  failed:  '#F85149',
};

interface LiveRunPanelProps {
  executionId: string;
  workflowId: string;
  nodes: CanvasNode[];
  nodeStatuses: Record<string, StepStatus>;
  executionStatus: 'running' | 'success' | 'failed' | null;
  elapsedMs: number;
  onClose: () => void;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function LiveRunPanel({
  executionId,
  workflowId,
  nodes,
  nodeStatuses,
  executionStatus,
  elapsedMs,
  onClose,
}: LiveRunPanelProps) {
  const overall = executionStatus === 'success'
    ? 'success'
    : executionStatus === 'failed'
    ? 'failed'
    : 'running';

  const overallColor = overall === 'success' ? '#3FB950' : overall === 'failed' ? '#F85149' : '#388BFD';
  const overallLabel = overall === 'success' ? 'completed' : overall === 'failed' ? 'failed' : 'running';

  return (
    <div
      className="animate-slide-up"
      style={{
        height: 280,
        background: '#0D1117',
        borderTop: '1px solid #21262D',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 44,
          borderBottom: '1px solid #21262D',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: '#E6EDF3', fontFamily: 'IBM Plex Mono, monospace' }}>
          ▶ Run #{executionId.slice(0, 8)}
        </span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: overallColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: overallColor }}>{overallLabel}</span>
        <span style={{ fontSize: 12, color: '#484F58', marginLeft: 4 }}>{formatMs(elapsedMs)}</span>

        <div style={{ flex: 1 }} />

        {(executionStatus === 'success' || executionStatus === 'failed') && (
          <Link
            href={`/workflows/${workflowId}/runs/${executionId}`}
            style={{
              fontSize: 12,
              color: '#388BFD',
              textDecoration: 'none',
              padding: '3px 8px',
              border: '1px solid rgba(56,139,253,0.3)',
              borderRadius: 4,
            }}
          >
            View Full Report →
          </Link>
        )}

        <button
          onClick={onClose}
          style={{ color: '#484F58', fontSize: 14, padding: '4px 6px', marginLeft: 8 }}
        >
          ✕
        </button>
      </div>

      {/* Step list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {nodes.map((node, i) => {
          const status: StepStatus = (nodeStatuses[node.id] as StepStatus) ?? 'pending';
          const color = STATUS_COLORS[status];
          const icon = STATUS_ICONS[status];

          return (
            <div
              key={node.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 16px',
                borderLeft: status === 'running' ? '2px solid #388BFD' : '2px solid transparent',
                background: status === 'running' ? 'rgba(56,139,253,0.05)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  color,
                  fontFamily: 'IBM Plex Mono, monospace',
                  width: 16,
                  textAlign: 'center',
                  animation: status === 'running' ? 'pulse-ring-blue 1.5s ease-in-out infinite' : 'none',
                  flexShrink: 0,
                }}
              >
                {icon}
              </span>
              <span style={{ fontSize: 12, color: '#8B949E', fontFamily: 'IBM Plex Mono, monospace', width: 20, flexShrink: 0 }}>
                {i + 1}.
              </span>
              <span style={{ fontSize: 13, color: status === 'pending' ? '#484F58' : '#E6EDF3', flex: 1, fontWeight: status === 'running' ? 500 : 400 }}>
                {node.data.label}
              </span>
              <span style={{ fontSize: 11, color, fontFamily: 'IBM Plex Mono, monospace' }}>
                {status === 'running' ? 'running…' : status === 'pending' ? 'pending' : status}
              </span>
            </div>
          );
        })}

        {nodes.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#484F58', fontSize: 13 }}>
            No nodes in this workflow yet.
          </div>
        )}
      </div>
    </div>
  );
}
