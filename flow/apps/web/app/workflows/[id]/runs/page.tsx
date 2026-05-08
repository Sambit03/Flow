'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { executions as executionsApi, type Execution } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';

function duration(start: string, end?: string): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type FilterStatus  = 'all' | Execution['status'];
type FilterTrigger = 'all' | Execution['trigger'];

export default function RunsPage() {
  const { id } = useParams() as { id: string };
  const [runs, setRuns]         = useState<Execution[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filterStatus, setFilterStatus]   = useState<FilterStatus>('all');
  const [filterTrigger, setFilterTrigger] = useState<FilterTrigger>('all');

  useEffect(() => {
    executionsApi.list(id).then(setRuns).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const filtered = runs.filter((r) => {
    if (filterStatus !== 'all'  && r.status  !== filterStatus)  return false;
    if (filterTrigger !== 'all' && r.trigger !== filterTrigger) return false;
    return true;
  });

  const SkeletonRow = () => (
    <tr>
      {[1,2,3,4,5,6,7].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 skeleton rounded" />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Canvas',    href: `/workflows/${id}` },
          { label: 'Runs' },
        ]}
      />

      <main className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="h-8 px-3 text-sm bg-[#0D1117] text-[#8B949E] border border-[#30363D] rounded-md outline-none focus:border-[#388BFD] transition-colors"
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={filterTrigger}
            onChange={(e) => setFilterTrigger(e.target.value as FilterTrigger)}
            className="h-8 px-3 text-sm bg-[#0D1117] text-[#8B949E] border border-[#30363D] rounded-md outline-none focus:border-[#388BFD] transition-colors"
          >
            <option value="all">All triggers</option>
            <option value="webhook">Webhook</option>
            <option value="cron">Cron</option>
            <option value="manual">Manual</option>
          </select>
          <span className="text-xs text-[#484F58] ml-auto">
            {filtered.length} run{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden">
          {runs.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="text-4xl mb-3">○</span>
              <p className="text-sm text-[#8B949E]">This workflow hasn&apos;t been triggered yet.</p>
              <p className="text-xs text-[#484F58] mt-1">
                Click <Link href={`/workflows/${id}`} className="text-[#388BFD]">▶ Run</Link> on the canvas to test it.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#21262D]">
                  {['#', 'Trigger', 'Status', 'Steps', 'Duration', 'When', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-[#484F58] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [1,2,3].map((i) => <SkeletonRow key={i} />)
                  : filtered.map((run, i) => {
                    const isFailed  = run.status === 'failed';
                    const isRunning = run.status === 'running';

                    return (
                      <tr
                        key={run.id}
                        className="border-b border-[#21262D] hover:bg-[#161B22] transition-colors animate-fade-in-up"
                        style={{
                          animationDelay: `${i * 25}ms`,
                          borderLeft: isFailed ? '3px solid #F85149' : isRunning ? '3px solid #388BFD' : '3px solid transparent',
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-[#484F58]">
                          {run.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={run.trigger}>{run.trigger}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            <StatusDot
                              status={run.status as 'success' | 'failed' | 'running' | 'pending'}
                              pulse={isRunning}
                            />
                            <Badge variant={run.status as 'success' | 'failed' | 'running' | 'pending'}>
                              {run.status}
                            </Badge>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-[#8B949E] font-mono">
                              {run.completedSteps ?? 0}/{run.totalSteps ?? '?'}
                            </span>
                            {(run.totalSteps ?? 0) > 0 && (
                              <div className="w-16 h-1 rounded-full bg-[#21262D] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${Math.round(((run.completedSteps ?? 0) / (run.totalSteps ?? 1)) * 100)}%`,
                                    background: isFailed ? '#F85149' : '#3FB950',
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#8B949E]">
                          {duration(run.startedAt, run.finishedAt)}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#484F58]" title={run.startedAt}>
                          {relativeTime(run.startedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/workflows/${id}/runs/${run.id}`}
                            className="text-[#484F58] hover:text-[#388BFD] transition-colors text-base"
                          >
                            →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
