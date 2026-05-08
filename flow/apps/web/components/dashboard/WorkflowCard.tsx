'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { executions as executionsApi, workflows as workflowsApi, type WorkflowSummary, type Execution } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';

type TriggerType = 'webhook' | 'cron' | 'manual';

function inferTrigger(workflow: WorkflowSummary & { cronExpression?: string | null }, executions: Execution[]): TriggerType {
  if (workflow.cronExpression) return 'cron';
  const last = executions[0];
  if (last) return last.trigger as TriggerType;
  return 'webhook';
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

interface RunDotProps { status: Execution['status'] }
function RunDot({ status }: RunDotProps) {
  const color =
    status === 'success' ? '#3FB950' :
    status === 'failed'  ? '#F85149' :
    '#30363D';
  return (
    <span
      title={status}
      style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
    />
  );
}

interface WorkflowCardProps {
  workflow: WorkflowSummary & { cronExpression?: string | null };
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => Promise<void>;
}

export function WorkflowCard({ workflow, onDelete, onToggle }: WorkflowCardProps) {
  const router = useRouter();
  const [execs, setExecs] = useState<Execution[]>([]);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    executionsApi.list(workflow.id).then(setExecs).catch(() => {});
  }, [workflow.id]);

  const last10 = execs.slice(0, 10);
  const dots   = [...last10, ...Array(Math.max(0, 10 - last10.length)).fill(null)];
  const trigger = inferTrigger(workflow, execs);
  const lastRun = execs[0];

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setToggling(true);
    try { await onToggle(workflow.id, !workflow.isActive); }
    finally { setToggling(false); }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${workflow.name}"?`)) return;
    setDeleting(true);
    try { await onDelete(workflow.id); }
    catch { setDeleting(false); }
  }

  return (
    <div
      onClick={() => router.push(`/workflows/${workflow.id}`)}
      className="group flex flex-col gap-3 p-4 bg-[#0D1117] border border-[#30363D] rounded-lg cursor-pointer transition-all duration-[200ms] hover:-translate-y-0.5 hover:border-[#388BFD] hover:shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
        >
          <StatusDot status={workflow.isActive ? 'success' : 'inactive'} size={7} />
          <span className={workflow.isActive ? 'text-[#3FB950]' : 'text-[#484F58]'}>
            {workflow.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </button>
        <Badge variant={trigger}>{trigger}</Badge>
      </div>

      {/* Name + description */}
      <div>
        <h3 className="font-medium text-[#E6EDF3] truncate leading-snug">{workflow.name}</h3>
        {workflow.description && (
          <p className="text-sm text-[#8B949E] mt-0.5 line-clamp-2 leading-relaxed">{workflow.description}</p>
        )}
      </div>

      {/* Run dots */}
      <div className="flex items-center gap-1.5">
        {dots.map((ex, i) =>
          ex ? (
            <RunDot key={i} status={(ex as Execution).status} />
          ) : (
            <span key={i} style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', backgroundColor: '#21262D', flexShrink: 0 }} />
          )
        )}
        <span className="ml-auto text-xs text-[#484F58]">
          {lastRun ? `Last run ${relativeTime(lastRun.startedAt)}` : 'Never run'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#21262D]">
        <Link
          href={`/workflows/${workflow.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-center text-xs py-1.5 rounded border border-[#30363D] text-[#8B949E] hover:border-[#388BFD] hover:text-[#388BFD] transition-colors"
        >
          Open Canvas
        </Link>
        <Link
          href={`/workflows/${workflow.id}/runs`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs px-3 py-1.5 rounded border border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#484F58] transition-colors"
        >
          Runs
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2 py-1.5 rounded text-[#484F58] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.08)] transition-colors"
          title="Delete workflow"
        >
          {deleting ? '…' : '🗑'}
        </button>
      </div>
    </div>
  );
}
