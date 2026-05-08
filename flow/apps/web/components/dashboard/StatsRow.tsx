'use client';

import type { WorkflowSummary, Execution } from '@/lib/api';

interface StatsRowProps {
  workflows: WorkflowSummary[];
  recentExecutions: Execution[];
}

interface StatCard {
  label: string;
  value: string | number;
  sub?: string;
  accentColor: string;
}

function StatCard({ label, value, sub, accentColor }: StatCard) {
  return (
    <div className="relative flex flex-col gap-3 px-5 py-4 bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentColor }} />
      <span className="text-xs font-medium text-[#8B949E] uppercase tracking-wide">{label}</span>
      <div className="flex items-end justify-between">
        <span className="font-mono text-3xl font-semibold text-[#E6EDF3]">{value}</span>
        {sub && <span className="text-xs text-[#484F58] mb-1">{sub}</span>}
      </div>
    </div>
  );
}

function formatToday(executions: Execution[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return executions.filter((e) => new Date(e.startedAt) >= today).length;
}

function formatSuccessRate(executions: Execution[]): string {
  if (executions.length === 0) return '—';
  const last50 = executions.slice(0, 50);
  const success = last50.filter((e) => e.status === 'success').length;
  return `${Math.round((success / last50.length) * 100)}%`;
}

export function StatsRow({ workflows, recentExecutions }: StatsRowProps) {
  const total  = workflows.length;
  const active = workflows.filter((w) => w.isActive).length;
  const runsToday = formatToday(recentExecutions);
  const successRate = formatSuccessRate(recentExecutions);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Workflows"
        value={total}
        sub={`${active} active`}
        accentColor="#388BFD"
      />
      <StatCard
        label="Active"
        value={active}
        sub={`of ${total} total`}
        accentColor="#3FB950"
      />
      <StatCard
        label="Runs Today"
        value={runsToday}
        accentColor="#D29922"
      />
      <StatCard
        label="Success Rate"
        value={successRate}
        sub="last 50 runs"
        accentColor="#3FB950"
      />
    </div>
  );
}
