'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { executions as executionsApi, type Execution, type StepLog } from '@/lib/api';
import styles from './runs.module.css';

type AnyStatus = Execution['status'] | 'skipped';

function statusColor(status: AnyStatus): string {
  return (
    { pending: '#94a3b8', running: '#6366f1', success: '#10b981', failed: '#ef4444', skipped: '#64748b' } as Record<string, string>
  )[status] ?? '#94a3b8';
}

function statusIcon(status: AnyStatus): string {
  return (
    { pending: '○', running: '⟳', success: '✓', failed: '✕', skipped: '—' } as Record<string, string>
  )[status] ?? '○';
}

function duration(start: string, end?: string): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function StepLogsPanel({ workflowId, executionId }: { workflowId: string; executionId: string }) {
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    executionsApi.logs(workflowId, executionId)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workflowId, executionId]);

  if (loading) return <div className={styles.logsLoading}>Loading…</div>;
  if (!logs.length) return <div className={styles.logsEmpty}>No step logs.</div>;

  return (
    <div className={styles.logsList}>
      {logs.map((log) => (
        <div key={log.id} className={styles.logRow}>
          <span className={styles.logStatus} style={{ color: statusColor(log.status as AnyStatus) }}>
            {statusIcon(log.status as AnyStatus)}
          </span>
          <div className={styles.logMeta}>
            <span className={styles.logLabel}>{log.nodeLabel}</span>
            <span className={styles.logType}>{log.nodeType}</span>
          </div>
          <span className={styles.logDuration}>{duration(log.startedAt ?? '', log.finishedAt)}</span>
          {log.error && <span className={styles.logError}>{log.error}</span>}
          {log.output && (
            <pre className={styles.logOutput}>
              {JSON.stringify(log.output, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

export default function RunsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [runs, setRuns] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    executionsApi.list(id)
      .then(setRuns)
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <div className={styles.page}>
      <header className={styles.toolbar}>
        <Link href={`/workflows/${id}`} className={styles.backBtn}>← Canvas</Link>
        <div className={styles.toolbarDivider} />
        <span className={styles.title}>Execution History</span>
      </header>

      <main className={styles.main}>
        {loading ? (
          <div className={styles.empty}>Loading…</div>
        ) : runs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>▶</div>
            <p>No runs yet. Activate and run the workflow from the canvas.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Status</span>
              <span>Trigger</span>
              <span>Started</span>
              <span>Duration</span>
              <span>Steps</span>
            </div>
            {runs.map((run) => (
              <div key={run.id}>
                <div
                  className={`${styles.tableRow} ${expandedId === run.id ? styles.tableRowExpanded : ''}`}
                  onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                >
                  <span className={styles.statusCell} style={{ color: statusColor(run.status) }}>
                    <span className={styles.statusDot} style={{ background: statusColor(run.status) }} />
                    {run.status}
                  </span>
                  <span className={styles.triggerCell}>{run.trigger}</span>
                  <span className={styles.timeCell}>{relativeTime(run.startedAt)}</span>
                  <span className={styles.durationCell}>{duration(run.startedAt, run.finishedAt)}</span>
                  <span className={styles.stepsCell}>
                    {run.completedSteps ?? '—'} / {run.totalSteps ?? '—'}
                  </span>
                </div>
                {expandedId === run.id && (
                  <div className={styles.logsPanel}>
                    <StepLogsPanel workflowId={id} executionId={run.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
