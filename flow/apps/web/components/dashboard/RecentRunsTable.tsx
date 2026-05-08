'use client';

import Link from 'next/link';
import type { Execution, WorkflowSummary } from '@/lib/api';
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

interface RecentRunsTableProps {
  executions: Array<Execution & { workflowName?: string }>;
  workflowMap: Record<string, WorkflowSummary>;
}

export function RecentRunsTable({ executions, workflowMap }: RecentRunsTableProps) {
  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="text-3xl mb-3">○</span>
        <p className="text-sm text-[#8B949E]">No runs yet across any workflow.</p>
        <p className="text-xs text-[#484F58] mt-1">Run a workflow from the canvas to see activity here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#21262D]">
            {['Workflow', 'Trigger', 'Status', 'Steps', 'Duration', 'When', ''].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-medium text-[#484F58] uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {executions.map((ex, i) => {
            const wf = workflowMap[ex.workflowId];
            const isFailed = ex.status === 'failed';

            return (
              <tr
                key={ex.id}
                className="border-b border-[#21262D] hover:bg-[#1C2333] transition-colors animate-fade-in-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                {/* Left accent for failed */}
                <td className="px-3 py-2.5 relative">
                  {isFailed && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-[#F85149] rounded-r" />
                  )}
                  <Link
                    href={`/workflows/${ex.workflowId}`}
                    className="text-[#E6EDF3] hover:text-[#388BFD] transition-colors font-medium truncate max-w-[140px] block"
                  >
                    {wf?.name ?? ex.workflowId.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={ex.trigger as 'webhook' | 'cron' | 'manual'}>{ex.trigger}</Badge>
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1.5">
                    <StatusDot status={ex.status as 'success' | 'failed' | 'running' | 'pending'} pulse />
                    <Badge variant={ex.status as 'success' | 'failed' | 'running' | 'pending'}>{ex.status}</Badge>
                  </span>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-[#8B949E]">
                  {ex.completedSteps ?? 0}/{ex.totalSteps ?? '?'}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-[#8B949E]">
                  {duration(ex.startedAt, ex.finishedAt)}
                </td>
                <td className="px-3 py-2.5 text-xs text-[#484F58]" title={ex.startedAt}>
                  {relativeTime(ex.startedAt)}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/workflows/${ex.workflowId}/runs/${ex.id}`}
                    className="text-[#484F58] hover:text-[#388BFD] transition-colors"
                  >
                    →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
