'use client';

import { Handle, Position, type NodeProps } from 'reactflow';

export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | undefined;

export interface FlowNodeData {
  label: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  config: Record<string, unknown>;
  status?: NodeStatus;
}

/* ── Node type accent colors (spec) ─────────────────────── */
const TYPE_COLORS: Record<string, { header: string; border: string; glow: string }> = {
  trigger:   { header: '#39D353', border: 'rgba(57,211,83,0.4)',   glow: 'rgba(57,211,83,0.25)' },
  action:    { header: '#388BFD', border: 'rgba(56,139,253,0.4)',  glow: 'rgba(56,139,253,0.25)' },
  condition: { header: '#D29922', border: 'rgba(210,153,34,0.4)',  glow: 'rgba(210,153,34,0.2)' },
  delay:     { header: '#484F58', border: 'rgba(72,79,88,0.4)',    glow: 'rgba(72,79,88,0.2)' },
};

const STATUS_BORDER: Record<string, string> = {
  running: '2px solid #388BFD',
  success: '2px solid #3FB950',
  failed:  '2px solid #F85149',
};

/* ── Shared node shell ──────────────────────────────────── */
function NodeShell({
  type,
  headerIcon,
  headerLabel,
  label,
  subLabel,
  status,
  selected,
  children,
}: {
  type: string;
  headerIcon: string;
  headerLabel: string;
  label: string;
  subLabel?: string;
  status?: NodeStatus;
  selected?: boolean;
  children?: React.ReactNode;
}) {
  const colors = TYPE_COLORS[type] ?? TYPE_COLORS['action']!;

  const borderStyle = status && STATUS_BORDER[status]
    ? STATUS_BORDER[status]!
    : selected
    ? `2px solid ${colors.border}`
    : '1px solid #30363D';

  const boxShadow = status === 'running'
    ? `0 0 0 3px rgba(56,139,253,0.25)`
    : status === 'success'
    ? `0 0 0 2px rgba(63,185,80,0.2)`
    : status === 'failed'
    ? `0 0 0 2px rgba(248,81,73,0.2)`
    : selected
    ? `0 0 0 3px ${colors.glow}`
    : '0 2px 8px rgba(0,0,0,0.4)';

  return (
    <div
      style={{
        background: '#0D1117',
        border: borderStyle,
        borderRadius: 8,
        minWidth: 180,
        boxShadow,
        transition: 'border 0.12s, box-shadow 0.12s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Execution spinner overlay for running */}
      {status === 'running' && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 12,
            height: 12,
            border: '2px solid #388BFD',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            zIndex: 10,
          }}
        />
      )}
      {/* Success checkmark overlay */}
      {status === 'success' && (
        <span style={{ position: 'absolute', top: 4, right: 7, fontSize: 11, color: '#3FB950', fontWeight: 700, zIndex: 10 }}>✓</span>
      )}
      {/* Fail indicator */}
      {status === 'failed' && (
        <span style={{ position: 'absolute', top: 4, right: 7, fontSize: 11, color: '#F85149', fontWeight: 700, zIndex: 10 }}>✕</span>
      )}

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: `${colors.header}18`,
          borderBottom: `1px solid ${colors.header}28`,
        }}
      >
        <span style={{ fontSize: 12 }}>{headerIcon}</span>
        <span style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, color: colors.header, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {headerLabel}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#E6EDF3', lineHeight: 1.3 }}>{label}</span>
        {subLabel && (
          <span style={{ fontSize: 11, color: '#8B949E', fontFamily: 'IBM Plex Mono, monospace' }}>{subLabel}</span>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Trigger Node ─────────────────────────────────────────── */
export function TriggerNode({ data, selected }: NodeProps<FlowNodeData>) {
  const subtype = (data.config?.subtype as string) || 'manual';
  const icons: Record<string, string> = { webhook: '⛓', cron: '⏰', manual: '▷' };

  return (
    <NodeShell
      type="trigger"
      headerIcon={icons[subtype] ?? '▷'}
      headerLabel="Trigger"
      label={data.label}
      subLabel={subtype}
      status={data.status}
      selected={selected}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: '#30363D', border: '2px solid #0D1117', width: 10, height: 10 }}
      />
    </NodeShell>
  );
}

/* ── Action Node ─────────────────────────────────────────── */
export function ActionNode({ data, selected }: NodeProps<FlowNodeData>) {
  const subtype = (data.config?.subtype as string) || 'http_request';
  const icons: Record<string, string> = { http_request: '🌐', transform: '⚙', log: '📝', notify: '🔔' };

  const notifyPreview = subtype === 'notify'
    ? (data.config?.channel === 'slack'
        ? '💬  Slack'
        : `✉  ${(data.config?.to as string) || 'No recipient set'}`)
    : undefined;

  return (
    <NodeShell
      type="action"
      headerIcon={icons[subtype] ?? '⚙'}
      headerLabel="Action"
      label={data.label}
      subLabel={notifyPreview ?? subtype}
      status={data.status}
      selected={selected}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        style={{ background: '#30363D', border: '2px solid #0D1117', width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        style={{ background: '#30363D', border: '2px solid #0D1117', width: 10, height: 10 }}
      />
    </NodeShell>
  );
}

/* ── Condition Node ──────────────────────────────────────── */
export function ConditionNode({ data, selected }: NodeProps<FlowNodeData>) {
  const field    = (data.config?.field    as string) || '';
  const operator = (data.config?.operator as string) || 'eq';
  const value    = (data.config?.value    as string) || '';
  const preview  = field ? `${field} ${operator} ${value}`.slice(0, 22) : undefined;

  return (
    <NodeShell
      type="condition"
      headerIcon="◈"
      headerLabel="Condition"
      label={data.label}
      subLabel={preview}
      status={data.status}
      selected={selected}
    >
      <Handle type="target" position={Position.Top} id="in" style={{ background: '#30363D', border: '2px solid #0D1117', width: 10, height: 10 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#3FB950', fontFamily: 'IBM Plex Mono, monospace' }}>✓ true</span>
        <span style={{ fontSize: 10, color: '#F85149', fontFamily: 'IBM Plex Mono, monospace' }}>✕ false</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%', background: '#3FB950', border: '2px solid #0D1117', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%', background: '#F85149', border: '2px solid #0D1117', width: 10, height: 10 }} />
    </NodeShell>
  );
}

/* ── Delay Node ──────────────────────────────────────────── */
export function DelayNode({ data, selected }: NodeProps<FlowNodeData>) {
  const ms = data.config?.durationMs ? Number(data.config.durationMs) : null;
  const label = ms !== null ? (ms < 1000 ? `${ms}ms` : `${ms / 1000}s`) : 'Configure';

  return (
    <NodeShell
      type="delay"
      headerIcon="⏱"
      headerLabel="Delay"
      label={data.label}
      subLabel={label}
      status={data.status}
      selected={selected}
    >
      <Handle type="target" position={Position.Top} id="in" style={{ background: '#30363D', border: '2px solid #0D1117', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Bottom} id="out" style={{ background: '#30363D', border: '2px solid #0D1117', width: 10, height: 10 }} />
    </NodeShell>
  );
}

export const nodeTypes = {
  trigger:   TriggerNode,
  action:    ActionNode,
  condition: ConditionNode,
  delay:     DelayNode,
};
