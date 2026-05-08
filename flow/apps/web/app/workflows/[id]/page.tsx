'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { nodeTypes } from '@/components/nodes/FlowNodes';
import NodeSidebar from '@/components/NodeSidebar/NodeSidebar';
import { LiveRunPanel } from '@/components/canvas/LiveRunPanel';
import { useCanvasStore, type CanvasNode, type CanvasEdge } from '@/store';
import { workflows as workflowsApi, type ApiNode, type ApiEdge } from '@/lib/api';
import { useExecutionStream } from '@/hooks/useExecutionStream';
import { useToast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';

// ── Data transform helpers ─────────────────────────────────

function toCanvasNode(n: ApiNode): CanvasNode {
  return {
    id: n.id,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: { label: n.label, type: n.type, config: n.config },
  };
}

function toCanvasEdge(e: ApiEdge): CanvasEdge {
  const sourceHandle = (e.branch === 'true' || e.branch === 'false') ? e.branch : 'out';
  return { id: e.id, source: e.sourceId, target: e.targetId, sourceHandle };
}

// ── Node palette ──────────────────────────────────────────

const PALETTE_ITEMS = [
  { type: 'trigger'   as const, label: 'Trigger',   icon: '⚡', color: '#39D353', desc: 'Entry point — webhook, cron, or manual' },
  { type: 'action'    as const, label: 'Action',    icon: '⚙', color: '#388BFD', desc: 'HTTP request, transform, or log' },
  { type: 'condition' as const, label: 'Condition', icon: '◈', color: '#D29922', desc: 'Branch based on a field value' },
  { type: 'delay'     as const, label: 'Delay',     icon: '⏱', color: '#484F58', desc: 'Pause execution for a duration' },
];

function NodePalette() {
  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        background: '#0D1117',
        borderRight: '1px solid #21262D',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 8px',
        gap: 4,
      }}
    >
      <p style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: '#484F58', letterSpacing: '0.1em', padding: '0 8px 8px', textTransform: 'uppercase' }}>
        Nodes
      </p>
      {PALETTE_ITEMS.map((item) => (
        <Tooltip key={item.type} content={item.desc} side="right">
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow', item.type);
              e.dataTransfer.effectAllowed = 'move';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              background: '#161B22',
              border: '1px solid #30363D',
              borderLeft: `3px solid ${item.color}`,
              borderRadius: 6,
              cursor: 'grab',
              color: '#8B949E',
              fontSize: 13,
              transition: 'all 0.12s',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = item.color;
              (e.currentTarget as HTMLElement).style.color = '#E6EDF3';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#30363D';
              (e.currentTarget as HTMLElement).style.borderLeftColor = item.color;
              (e.currentTarget as HTMLElement).style.color = '#8B949E';
            }}
          >
            <span style={{ fontSize: 14, color: item.color }}>{item.icon}</span>
            <span style={{ fontWeight: 500 }}>{item.label}</span>
          </div>
        </Tooltip>
      ))}
    </aside>
  );
}

// ── Canvas topbar ─────────────────────────────────────────

interface CanvasTopbarProps {
  workflowId: string;
  workflowName: string;
  onNameChange: (v: string) => void;
  onNameBlur: () => void;
  isDirty: boolean;
  isActive: boolean;
  saving: boolean;
  starting: boolean;
  toggling: boolean;
  isStreaming: boolean;
  lastResult: 'success' | 'failed' | null;
  onSave: () => void;
  onRun: () => void;
  onToggleActive: () => void;
}

function CanvasTopbar({
  workflowId, workflowName, onNameChange, onNameBlur, isDirty,
  isActive, saving, starting, toggling, isStreaming, lastResult,
  onSave, onRun, onToggleActive,
}: CanvasTopbarProps) {
  const saveLabel = saving ? 'Saving…' : isDirty ? 'Save ●' : 'Saved';
  const saveColor = isDirty ? '#388BFD' : '#484F58';

  return (
    <header
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        borderBottom: '1px solid #21262D',
        background: '#0D1117',
        flexShrink: 0,
      }}
    >
      <Link
        href="/dashboard"
        style={{ fontSize: 12, color: '#8B949E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
      >
        ← Dashboard
      </Link>
      <span style={{ color: '#21262D' }}>/</span>

      {/* Inline editable name */}
      <input
        value={workflowName}
        onChange={(e) => onNameChange(e.target.value)}
        onBlur={onNameBlur}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: 14,
          fontWeight: 500,
          color: '#E6EDF3',
          minWidth: 80,
          maxWidth: 240,
          width: `${Math.max(80, workflowName.length * 8.5)}px`,
        }}
        aria-label="Workflow name"
      />

      {/* Save status */}
      <span style={{ fontSize: 11, color: saveColor, fontFamily: 'IBM Plex Mono, monospace', whiteSpace: 'nowrap' }}>
        {saveLabel}
      </span>

      <div style={{ flex: 1 }} />

      {/* Run result badges */}
      {isStreaming && <Badge variant="running" pulse>Running</Badge>}
      {!isStreaming && lastResult === 'success' && <Badge variant="success">✓ Done</Badge>}
      {!isStreaming && lastResult === 'failed' && <Badge variant="failed">✕ Failed</Badge>}

      {/* Active toggle */}
      <Tooltip content={isActive ? 'Deactivate workflow' : 'Activate workflow'}>
        <button
          onClick={onToggleActive}
          disabled={toggling}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 30,
            padding: '0 12px',
            borderRadius: 6,
            border: isActive ? '1px solid rgba(63,185,80,0.4)' : '1px solid #30363D',
            background: isActive ? 'rgba(63,185,80,0.1)' : 'transparent',
            color: isActive ? '#3FB950' : '#484F58',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#3FB950' : '#484F58' }} />
          {isActive ? 'Active' : 'Inactive'}
        </button>
      </Tooltip>

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={starting || isStreaming || !isActive}
        title={!isActive ? 'Activate the workflow to run it' : undefined}
        style={{
          height: 30,
          padding: '0 14px',
          borderRadius: 6,
          border: 'none',
          background: starting || isStreaming ? '#21262D' : '#388BFD',
          color: starting || isStreaming ? '#484F58' : 'white',
          fontSize: 12,
          fontWeight: 500,
          cursor: starting || isStreaming || !isActive ? 'not-allowed' : 'pointer',
          transition: 'all 0.12s',
        }}
      >
        {starting ? '…' : '▶ Run'}
      </button>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving || !isDirty}
        style={{
          height: 30,
          padding: '0 14px',
          borderRadius: 6,
          border: '1px solid ' + (isDirty ? 'rgba(56,139,253,0.5)' : '#21262D'),
          background: isDirty ? 'rgba(56,139,253,0.1)' : 'transparent',
          color: isDirty ? '#388BFD' : '#484F58',
          fontSize: 12,
          fontWeight: 500,
          cursor: saving || !isDirty ? 'not-allowed' : 'pointer',
          transition: 'all 0.12s',
        }}
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
    </header>
  );
}

// ── Canvas page ───────────────────────────────────────────

export default function CanvasPage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params.id as string;
  const { toast } = useToast();

  const nodes           = useCanvasStore((s) => s.nodes);
  const edges           = useCanvasStore((s) => s.edges);
  const isDirty         = useCanvasStore((s) => s.isDirty);
  const selectedNodeId  = useCanvasStore((s) => s.selectedNodeId);
  const isActive        = useCanvasStore((s) => s.isActive);
  const activeExecId    = useCanvasStore((s) => s.activeExecutionId);
  const nodeStatuses    = useCanvasStore((s) => s.nodeStatuses);
  const setNodes        = useCanvasStore((s) => s.setNodes);
  const setEdges        = useCanvasStore((s) => s.setEdges);
  const markDirty       = useCanvasStore((s) => s.markDirty);
  const markClean       = useCanvasStore((s) => s.markClean);
  const selectNode      = useCanvasStore((s) => s.selectNode);
  const setActiveExec   = useCanvasStore((s) => s.setActiveExecution);
  const setWorkflowMeta = useCanvasStore((s) => s.setWorkflowMeta);
  const setIsActive     = useCanvasStore((s) => s.setIsActive);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const { isStreaming, lastResult } = useExecutionStream();

  const [workflowName, setWorkflowName] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [starting, setStarting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [loadError, setLoadError] = useState('');
  const [liveOpen, setLiveOpen] = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start/stop elapsed timer
  useEffect(() => {
    if (isStreaming) {
      setElapsed(0);
      setLiveOpen(true);
      elapsedRef.current = setInterval(() => setElapsed((e) => e + 100), 100);
    } else if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
    }
    return () => { if (elapsedRef.current) clearInterval(elapsedRef.current); };
  }, [isStreaming]);

  // Load workflow
  useEffect(() => {
    workflowsApi.get(id)
      .then((wf) => {
        setWorkflowName(wf.name);
        setNodes(wf.nodes.map(toCanvasNode));
        setEdges(wf.edges.map(toCanvasEdge));
        setWorkflowMeta({ workflowId: id, isActive: wf.isActive, webhookSecret: wf.webhookSecret });
        markClean();
      })
      .catch(() => setLoadError('Failed to load workflow'))
      .finally(() => setLoading(false));

    return () => {
      setNodes([]);
      setEdges([]);
      selectNode(null);
      markClean();
      setActiveExec(null);
      useCanvasStore.getState().clearNodeStatuses();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Unsaved changes guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── ReactFlow handlers ──────────────────────────────────

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const updated = applyNodeChanges(changes, nodesRef.current) as CanvasNode[];
    setNodes(updated);
    if (changes.some((c) => c.type !== 'select' && c.type !== 'dimensions')) markDirty();
  }, [setNodes, markDirty]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(applyEdgeChanges(changes, edgesRef.current as Edge[]) as CanvasEdge[]);
    markDirty();
  }, [setEdges, markDirty]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges(addEdge({ ...connection, id: crypto.randomUUID() }, edgesRef.current as Edge[]) as CanvasEdge[]);
    markDirty();
  }, [setEdges, markDirty]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow') as CanvasNode['data']['type'];
    if (!type || !rfInstance.current) return;
    const position = rfInstance.current.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes([...nodesRef.current, {
      id: crypto.randomUUID(),
      type,
      position,
      data: { label: type.charAt(0).toUpperCase() + type.slice(1), type, config: {} },
    }]);
    markDirty();
  }, [setNodes, markDirty]);

  // ── Save ────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const apiNodes: Array<Omit<ApiNode, 'workflowId'>> = nodesRef.current.map((n, i) => ({
        id: n.id, type: n.data.type, label: n.data.label, config: n.data.config,
        positionX: n.position.x, positionY: n.position.y, orderIndex: i,
      }));
      const apiEdges: Array<Omit<ApiEdge, 'workflowId'>> = edgesRef.current.map((e) => ({
        id: e.id, sourceId: e.source, targetId: e.target,
        branch: (e.sourceHandle === 'true' || e.sourceHandle === 'false') ? e.sourceHandle : null,
      }));
      await workflowsApi.saveCanvas(id, apiNodes, apiEdges);
      markClean();
      toast('Workflow saved', { type: 'success' });
    } catch {
      toast('Failed to save workflow', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  // ── Run ─────────────────────────────────────────────────

  async function handleRun() {
    setStarting(true);
    try {
      const result = await workflowsApi.execute(id);
      setActiveExec(result.execution.id);
      setLiveOpen(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Run failed', { type: 'error' });
    } finally {
      setStarting(false);
    }
  }

  // ── Toggle active ───────────────────────────────────────

  async function handleToggleActive() {
    setToggling(true);
    try {
      const updated = await workflowsApi.update(id, { isActive: !isActive });
      setIsActive(updated.isActive);
      toast(updated.isActive ? 'Workflow activated' : 'Workflow deactivated', { type: 'success' });
    } catch {
      toast('Failed to update workflow status', { type: 'error' });
    } finally {
      setToggling(false);
    }
  }

  // ── Name blur ───────────────────────────────────────────

  async function handleNameBlur() {
    const trimmed = workflowName.trim();
    if (!trimmed) return;
    await workflowsApi.update(id, { name: trimmed }).catch(() => {});
  }

  // ── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#484F58' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', padding: 32 }}>
          {[1,2,3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#8B949E' }}>
        <span style={{ fontSize: 32 }}>⚠</span>
        <p>{loadError}</p>
        <button onClick={() => router.push('/dashboard')} style={{ color: '#388BFD', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <CanvasTopbar
        workflowId={id}
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        onNameBlur={handleNameBlur}
        isDirty={isDirty}
        isActive={isActive}
        saving={saving}
        starting={starting}
        toggling={toggling}
        isStreaming={isStreaming}
        lastResult={lastResult}
        onSave={handleSave}
        onRun={handleRun}
        onToggleActive={handleToggleActive}
      />

      {/* Main canvas area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <NodePalette />

        <div style={{ flex: 1, position: 'relative' }} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              data: { ...n.data, status: nodeStatuses[n.id] },
            }))}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(inst) => { rfInstance.current = inst; }}
            onNodeClick={(_, node) => selectNode(node.id)}
            onPaneClick={() => selectNode(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: '#388BFD', strokeWidth: 2 },
            }}
          >
            <Background color="#21262D" gap={24} variant={'dots' as any} />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const c: Record<string, string> = { trigger: '#39D353', action: '#388BFD', condition: '#D29922', delay: '#484F58' };
                return c[n.type ?? ''] ?? '#30363D';
              }}
              maskColor="rgba(8,11,17,0.8)"
              style={{ background: '#0D1117' }}
            />
          </ReactFlow>
        </div>

        {selectedNodeId && <NodeSidebar />}
      </div>

      {/* Live run panel */}
      {liveOpen && activeExecId && (
        <LiveRunPanel
          executionId={activeExecId}
          workflowId={id}
          nodes={nodes}
          nodeStatuses={nodeStatuses as Record<string, any>}
          executionStatus={isStreaming ? 'running' : lastResult}
          elapsedMs={elapsed}
          onClose={() => setLiveOpen(false)}
        />
      )}
    </div>
  );
}
