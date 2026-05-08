'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { executions as executionsApi, type Execution, type StepLog } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';

function duration(start?: string, end?: string): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/* ── Step timeline ───────────────────────────────────────── */

const STEP_ICONS: Record<string, string> = {
  trigger:   '⚡',
  action:    '⚙',
  condition: '◈',
  delay:     '⏱',
};

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  success: { icon: '✓', color: '#3FB950' },
  failed:  { icon: '✕', color: '#F85149' },
  running: { icon: '◉', color: '#388BFD' },
  pending: { icon: '○', color: '#484F58' },
  skipped: { icon: '⊘', color: '#484F58' },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      style={{
        fontSize: 10, padding: '2px 6px', borderRadius: 3,
        border: '1px solid #30363D', background: 'transparent',
        color: copied ? '#3FB950' : '#484F58', cursor: 'pointer',
      }}
    >
      {copied ? '✓' : 'copy'}
    </button>
  );
}

function JsonBlock({ data, label }: { data: unknown; label: string }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  const json = JSON.stringify(data, null, 2);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ fontSize: 11, color: '#8B949E', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <span>{open ? '▾' : '▸'}</span>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10 }}>{label}</span>
      </button>
      {open && (
        <div style={{ marginTop: 6, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 6, right: 8 }}>
            <CopyButton text={json} />
          </div>
          <pre style={{
            background: '#080B11', border: '1px solid #21262D', borderRadius: 6,
            padding: '10px 12px', fontSize: 11, color: '#8B949E',
            fontFamily: 'IBM Plex Mono, monospace', overflowX: 'auto',
            lineHeight: 1.6, maxHeight: 240,
          }}>
            {json}
          </pre>
        </div>
      )}
    </div>
  );
}

function StepRow({ log, index }: { log: StepLog; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_ICONS[log.status] ?? STATUS_ICONS['pending']!;
  const dur = duration(log.startedAt, log.finishedAt);

  return (
    <div
      style={{
        borderBottom: '1px solid #21262D',
        borderLeft: log.status === 'failed' ? '3px solid #F85149' : '3px solid transparent',
      }}
    >
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded((o) => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 14, color: status.color, width: 18, textAlign: 'center', flexShrink: 0 }}>
          {status.icon}
        </span>
        <span style={{ fontSize: 12, color: '#484F58', fontFamily: 'IBM Plex Mono, monospace', width: 24, flexShrink: 0 }}>
          {index + 1}.
        </span>
        <span style={{ fontSize: 13, color: '#E6EDF3', flex: 1, fontWeight: 500 }}>{log.nodeLabel}</span>
        <span style={{ fontSize: 11, color: '#8B949E', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0 }}>
          {STEP_ICONS[log.nodeType] ?? '●'} {log.nodeType}
        </span>
        <span style={{ fontSize: 11, color: '#484F58', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0, minWidth: 48, textAlign: 'right' }}>
          {dur}
        </span>
        <span style={{ color: '#484F58', fontSize: 11, marginLeft: 4 }}>{expanded ? '▾' : '▸'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 16px 58px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {log.startedAt && (
            <p style={{ fontSize: 11, color: '#484F58', fontFamily: 'IBM Plex Mono, monospace' }}>
              {formatDateTime(log.startedAt)} → {log.finishedAt ? formatDateTime(log.finishedAt) : '…'} ({dur})
            </p>
          )}
          {log.error && (
            <div style={{ padding: '8px 12px', background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: 6, fontSize: 12, color: '#F85149' }}>
              {log.error}
            </div>
          )}
          <JsonBlock data={log.input}  label="Input" />
          <JsonBlock data={log.output} label="Output" />
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export default function RunDetailPage() {
  const { id: workflowId, executionId } = useParams() as { id: string; executionId: string };
  const [exec, setExec] = useState<(Execution & { stepLogs: StepLog[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    executionsApi.get(workflowId, executionId)
      .then(setExec)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workflowId, executionId]);

  const shortId = executionId.slice(0, 8);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        breadcrumbs={[
          { label: 'Dashboard',  href: '/dashboard' },
          { label: 'Canvas',     href: `/workflows/${workflowId}` },
          { label: 'Runs',       href: `/workflows/${workflowId}/runs` },
          { label: `#${shortId}` },
        ]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            <div className="h-32 skeleton rounded-lg" />
            <div className="h-64 skeleton rounded-lg" />
          </div>
        ) : !exec ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-3">⚠</span>
            <p className="text-sm text-[#8B949E]">Run not found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            {/* Summary card */}
            <div className="flex flex-col gap-1">
              {/* Summary */}
              <div className="bg-[#0D1117] border border-[#30363D] rounded-lg p-5 flex flex-col gap-4">
                <h2 className="text-sm font-semibold text-[#E6EDF3]">Summary</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8B949E]">Status</span>
                    <span className="flex items-center gap-1.5">
                      <StatusDot status={exec.status as 'success' | 'failed' | 'running' | 'pending'} pulse={exec.status === 'running'} />
                      <Badge variant={exec.status as 'success' | 'failed' | 'running' | 'pending'}>{exec.status}</Badge>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8B949E]">Trigger</span>
                    <Badge variant={exec.trigger}>{exec.trigger}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8B949E]">Duration</span>
                    <span className="text-xs font-mono text-[#E6EDF3]">{duration(exec.startedAt, exec.finishedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8B949E]">Steps</span>
                    <span className="text-xs font-mono text-[#E6EDF3]">{exec.completedSteps ?? 0}/{exec.totalSteps ?? '?'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8B949E]">Started</span>
                    <span className="text-xs font-mono text-[#E6EDF3]">{formatDateTime(exec.startedAt)}</span>
                  </div>
                  {exec.error && (
                    <div className="mt-1 p-2 bg-[rgba(248,81,73,0.08)] border border-[rgba(248,81,73,0.25)] rounded text-xs text-[#F85149]">
                      {exec.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Trigger payload */}
              {(exec as any).triggerPayload && Object.keys((exec as any).triggerPayload ?? {}).length > 0 && (
                <div className="mt-4 bg-[#0D1117] border border-[#30363D] rounded-lg p-5 flex flex-col gap-3">
                  <h2 className="text-sm font-semibold text-[#E6EDF3]">Trigger Payload</h2>
                  <pre className="text-xs text-[#8B949E] font-mono overflow-x-auto leading-relaxed">
                    {JSON.stringify((exec as any).triggerPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Step timeline */}
            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b border-[#21262D]">
                <h2 className="text-sm font-semibold text-[#E6EDF3]">Step Timeline</h2>
              </div>
              {exec.stepLogs.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-[#484F58]">
                  No step logs recorded.
                </div>
              ) : (
                exec.stepLogs.map((log, i) => (
                  <StepRow key={log.id} log={log} index={i} />
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
