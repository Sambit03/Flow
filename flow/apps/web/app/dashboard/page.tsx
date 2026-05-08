'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { workflows as workflowsApi, executions as executionsApi, type WorkflowSummary, type Execution } from '@/lib/api';
import { Topbar } from '@/components/layout/Topbar';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { WorkflowCard } from '@/components/dashboard/WorkflowCard';
import { CreateWorkflowModal } from '@/components/dashboard/CreateWorkflowModal';
import { RecentRunsTable } from '@/components/dashboard/RecentRunsTable';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

type WFWithCron = WorkflowSummary & { cronExpression?: string | null };

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [wfList, setWfList]     = useState<WFWithCron[]>([]);
  const [allExecs, setAllExecs] = useState<Execution[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const wfs = await workflowsApi.list() as WFWithCron[];
        setWfList(wfs);

        // Fetch executions for all workflows in parallel (for stats + recent runs)
        const allExecResults = await Promise.allSettled(
          wfs.map((w) => executionsApi.list(w.id))
        );
        const flat: Execution[] = [];
        allExecResults.forEach((r) => {
          if (r.status === 'fulfilled') flat.push(...r.value);
        });
        flat.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        setAllExecs(flat);
      } catch {
        toast('Failed to load dashboard data', { type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [toast]);

  const workflowMap = Object.fromEntries(wfList.map((w) => [w.id, w]));

  const handleDelete = useCallback(async (id: string) => {
    await workflowsApi.delete(id);
    setWfList((prev) => prev.filter((w) => w.id !== id));
    setAllExecs((prev) => prev.filter((e) => e.workflowId !== id));
    toast('Workflow deleted', { type: 'info' });
  }, [toast]);

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    // Optimistic update
    setWfList((prev) => prev.map((w) => w.id === id ? { ...w, isActive: active } : w));
    try {
      await workflowsApi.update(id, { isActive: active });
      toast(active ? 'Workflow activated' : 'Workflow deactivated', { type: 'success' });
    } catch {
      // Roll back
      setWfList((prev) => prev.map((w) => w.id === id ? { ...w, isActive: !active } : w));
      toast('Failed to update workflow', { type: 'error' });
    }
  }, [toast]);

  const handleCreated = useCallback((w: WorkflowSummary) => {
    setShowCreate(false);
    router.push(`/workflows/${w.id}`);
  }, [router]);

  const filtered = wfList.filter((w) =>
    !search || w.name.toLowerCase().includes(search.toLowerCase())
  );

  const SkeletonCard = () => (
    <div className="h-[180px] rounded-lg bg-[#0D1117] border border-[#21262D] skeleton" />
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Topbar breadcrumbs={[{ label: 'Dashboard' }]} />

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Stats */}
        {!loading && <StatsRow workflows={wfList} recentExecutions={allExecs} />}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <div key={i} className="h-24 rounded-lg skeleton" />)}
          </div>
        )}

        {/* Workflow grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#E6EDF3]">Workflows</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search workflows…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 px-3 text-sm bg-[#0D1117] text-[#E6EDF3] placeholder:text-[#484F58] border border-[#30363D] rounded-md outline-none focus:border-[#388BFD] transition-colors w-48"
              />
              <Button size="sm" onClick={() => setShowCreate(true)}>+ New Workflow</Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 && !search ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#30363D] rounded-lg">
              <span className="text-5xl mb-4">⚡</span>
              <h3 className="text-base font-semibold text-[#E6EDF3] mb-2">No workflows yet</h3>
              <p className="text-sm text-[#8B949E] mb-6 max-w-xs">
                Build your first automation in minutes — no code required.
              </p>
              <Button onClick={() => setShowCreate(true)}>+ Create Workflow</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((w) => (
                <WorkflowCard
                  key={w.id}
                  workflow={w}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
              {/* Ghost "New" card */}
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center justify-center h-[180px] rounded-lg border border-dashed border-[#30363D] text-[#484F58] hover:border-[#388BFD] hover:text-[#388BFD] transition-colors group"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl group-hover:scale-110 transition-transform">+</span>
                  <span className="text-sm">New Workflow</span>
                </div>
              </button>
            </div>
          )}
        </section>

        {/* Recent Runs */}
        {!loading && (
          <section>
            <h2 className="text-base font-semibold text-[#E6EDF3] mb-4">Recent Runs</h2>
            <div className="bg-[#0D1117] border border-[#30363D] rounded-lg overflow-hidden">
              <RecentRunsTable
                executions={allExecs.slice(0, 10)}
                workflowMap={workflowMap}
              />
            </div>
          </section>
        )}
      </main>

      <CreateWorkflowModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreated}
      />
    </div>
  );
}
