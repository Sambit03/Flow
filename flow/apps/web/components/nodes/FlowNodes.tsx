'use client';

import { Handle, Position, NodeProps } from 'reactflow';
import styles from './nodes.module.css';

export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | undefined;

export interface FlowNodeData {
  label: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  config: Record<string, unknown>;
  status?: NodeStatus;
}

function StatusRing({ status }: { status: NodeStatus }) {
  if (!status || status === 'pending') return null;
  return <span className={`${styles.statusRing} ${styles[`ring_${status}`]}`} />;
}

function StatusIcon({ status }: { status: NodeStatus }) {
  if (!status) return null;
  const map = { pending: null, running: '⟳', success: '✓', failed: '✕' };
  const icon = map[status];
  if (!icon) return null;
  return (
    <span className={`${styles.statusIcon} ${styles[`icon_${status}`]}`}>
      {status === 'running' ? <span className={styles.spinner} /> : icon}
    </span>
  );
}

/* ── Trigger Node ─────────────────────────────────────── */
export function TriggerNode({ data, selected }: NodeProps<FlowNodeData>) {
  const subtype = (data.config?.subtype as string) || 'manual';
  const icons: Record<string, string> = { webhook: '🔗', cron: '⏰', manual: '▶' };

  return (
    <div className={`${styles.node} ${styles.nodeTrigger} ${selected ? styles.nodeSelected : ''}`}>
      <StatusRing status={data.status} />
      <div className={styles.nodeHeader} style={{ background: 'rgba(16,185,129,0.15)', borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
        <span className={styles.nodeTypeIcon}>{icons[subtype] ?? '▶'}</span>
        <span className={styles.nodeTypeName}>Trigger</span>
        <StatusIcon status={data.status} />
      </div>
      <div className={styles.nodeBody}>
        <span className={styles.nodeLabel}>{data.label}</span>
        <span className={styles.nodeSubtext}>{subtype}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className={styles.handle} id="out" />
    </div>
  );
}

/* ── Action Node ──────────────────────────────────────── */
export function ActionNode({ data, selected }: NodeProps<FlowNodeData>) {
  const subtype = (data.config?.subtype as string) || 'http_request';
  const icons: Record<string, string> = { http_request: '🌐', transform: '⚙', log: '📝' };

  return (
    <div className={`${styles.node} ${styles.nodeAction} ${selected ? styles.nodeSelected : ''}`}>
      <StatusRing status={data.status} />
      <Handle type="target" position={Position.Top} className={styles.handle} id="in" />
      <div className={styles.nodeHeader} style={{ background: 'rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
        <span className={styles.nodeTypeIcon}>{icons[subtype] ?? '⚙'}</span>
        <span className={styles.nodeTypeName}>Action</span>
        <StatusIcon status={data.status} />
      </div>
      <div className={styles.nodeBody}>
        <span className={styles.nodeLabel}>{data.label}</span>
        <span className={styles.nodeSubtext}>{subtype}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className={styles.handle} id="out" />
    </div>
  );
}

/* ── Condition Node ───────────────────────────────────── */
export function ConditionNode({ data, selected }: NodeProps<FlowNodeData>) {
  return (
    <div className={`${styles.node} ${styles.nodeCondition} ${selected ? styles.nodeSelected : ''}`}>
      <StatusRing status={data.status} />
      <Handle type="target" position={Position.Top} className={styles.handle} id="in" />
      <div className={styles.nodeHeader} style={{ background: 'rgba(245,158,11,0.15)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
        <span className={styles.nodeTypeIcon}>◆</span>
        <span className={styles.nodeTypeName}>Condition</span>
        <StatusIcon status={data.status} />
      </div>
      <div className={styles.nodeBody}>
        <span className={styles.nodeLabel}>{data.label}</span>
        <div className={styles.conditionBranches}>
          <span className={styles.branchTrue}>✓ True</span>
          <span className={styles.branchFalse}>✕ False</span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className={styles.handle} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className={styles.handle} />
    </div>
  );
}

/* ── Delay Node ───────────────────────────────────────── */
export function DelayNode({ data, selected }: NodeProps<FlowNodeData>) {
  const duration = data.config?.durationMs
    ? `${Number(data.config.durationMs) / 1000}s`
    : 'Configure';

  return (
    <div className={`${styles.node} ${styles.nodeDelay} ${selected ? styles.nodeSelected : ''}`}>
      <StatusRing status={data.status} />
      <Handle type="target" position={Position.Top} className={styles.handle} id="in" />
      <div className={styles.nodeHeader} style={{ background: 'rgba(139,92,246,0.15)', borderBottom: '1px solid rgba(139,92,246,0.2)' }}>
        <span className={styles.nodeTypeIcon}>⏱</span>
        <span className={styles.nodeTypeName}>Delay</span>
        <StatusIcon status={data.status} />
      </div>
      <div className={styles.nodeBody}>
        <span className={styles.nodeLabel}>{data.label}</span>
        <span className={styles.nodeSubtext}>{duration}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className={styles.handle} id="out" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode,
};
