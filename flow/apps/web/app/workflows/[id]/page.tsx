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
import { useCanvasStore, type CanvasNode, type CanvasEdge } from '@/store';
import { workflows as workflowsApi, type ApiNode, type ApiEdge } from '@/lib/api';
import { useExecutionStream } from '@/hooks/useExecutionStream';
import styles from './canvas.module.css';

// ── Data transform helpers ────────────────────────────────

function toCanvasNode(n: ApiNode): CanvasNode {
  return {
    id: n.id,
    type: n.type,
    position: { x: n.positionX, y: n.positionY },
    data: { label: n.label, type: n.type, config: n.config },
  };
}

function toCanvasEdge(e: ApiEdge): CanvasEdge {
  // Map DB branch value back to the ReactFlow sourceHandle id
  const sourceHandle = (e.branch === 'true' || e.branch === 'false') ? e.branch : 'out';
  return { id: e.id, source: e.sourceId, target: e.targetId, sourceHandle };
}

// ── Node palette ──────────────────────────────────────────

const PALETTE_ITEMS = [
  { type: 'trigger'   as const, label: 'Trigger',   icon: '▶', color: '#10b981' },
  { type: 'action'    as const, label: 'Action',    icon: '⚙', color: '#6366f1' },
  { type: 'condition' as const, label: 'Condition', icon: '◆', color: '#f59e0b' },
  { type: 'delay'     as const, label: 'Delay',     icon: '⏱', color: '#8b5cf6' },
];

function NodePalette() {
  return (
    <div className={styles.palette}>
      <p className={styles.paletteTitle}>Nodes</p>
      {PALETTE_ITEMS.map((item) => (
        <div
          key={item.type}
          className={styles.paletteItem}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/reactflow', item.type);
            e.dataTransfer.effectAllowed = 'move';
          }}
          style={{ borderLeft: `3px solid ${item.color}` }}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Canvas page ───────────────────────────────────────────

export default function CanvasPage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params.id as string;

  const nodes           = useCanvasStore((s) => s.nodes);
  const edges           = useCanvasStore((s) => s.edges);
  const isDirty         = useCanvasStore((s) => s.isDirty);
  const selectedNodeId  = useCanvasStore((s) => s.selectedNodeId);
  const isActive        = useCanvasStore((s) => s.isActive);
  const setNodes        = useCanvasStore((s) => s.setNodes);
  const setEdges        = useCanvasStore((s) => s.setEdges);
  const markDirty       = useCanvasStore((s) => s.markDirty);
  const markClean       = useCanvasStore((s) => s.markClean);
  const selectNode      = useCanvasStore((s) => s.selectNode);
  const setActiveExec   = useCanvasStore((s) => s.setActiveExecution);
  const setWorkflowMeta = useCanvasStore((s) => s.setWorkflowMeta);
  const setIsActive     = useCanvasStore((s) => s.setIsActive);

  // Refs so callbacks always read latest state without re-creating
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const rfInstance = useRef<ReactFlowInstance | null>(null);

  const { isStreaming, lastResult } = useExecutionStream();

  const [workflowName, setWorkflowName] = useState('');
  const [saving,       setSaving]       = useState(false);
  const [starting,     setStarting]     = useState(false);
  const [toggling,     setToggling]     = useState(false);
  const [runError,     setRunError]     = useState('');
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState('');

  // Load workflow on mount
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

  // ── React Flow event handlers ───────────────────────────

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const updated = applyNodeChanges(changes, nodesRef.current) as CanvasNode[];
    setNodes(updated);
    const meaningful = changes.some((c) => c.type !== 'select' && c.type !== 'dimensions');
    if (meaningful) markDirty();
  }, [setNodes, markDirty]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const updated = applyEdgeChanges(changes, edgesRef.current as Edge[]) as CanvasEdge[];
    setEdges(updated);
    markDirty();
  }, [setEdges, markDirty]);

  const onConnect = useCallback((connection: Connection) => {
    const newEdge = { ...connection, id: crypto.randomUUID() };
    setEdges(addEdge(newEdge, edgesRef.current as Edge[]) as CanvasEdge[]);
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

    const position = rfInstance.current.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    });

    const newNode: CanvasNode = {
      id: crypto.randomUUID(),
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        type,
        config: {},
      },
    };
    setNodes([...nodesRef.current, newNode]);
    markDirty();
  }, [setNodes, markDirty]);

  // ── Save ────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const apiNodes: Array<Omit<ApiNode, 'workflowId'>> = nodesRef.current.map((n) => ({
        id:         n.id,
        type:       n.data.type,
        label:      n.data.label,
        config:     n.data.config,
        positionX:  n.position.x,
        positionY:  n.position.y,
        orderIndex: 0,
      }));
      const apiEdges: Array<Omit<ApiEdge, 'workflowId'>> = edgesRef.current.map((e) => ({
        id:       e.id,
        sourceId: e.source,
        targetId: e.target,
        // sourceHandle is 'true' or 'false' for condition nodes, 'out' for others
        branch: (e.sourceHandle === 'true' || e.sourceHandle === 'false') ? e.sourceHandle : null,
      }));
      await workflowsApi.saveCanvas(id, apiNodes, apiEdges);
      markClean();
    } catch {
      alert('Save failed — check the console for details.');
    } finally {
      setSaving(false);
    }
  }

  // ── Run ─────────────────────────────────────────────────

  async function handleRun() {
    setStarting(true);
    setRunError('');
    try {
      const result = await workflowsApi.execute(id);
      // Setting activeExecutionId triggers useExecutionStream to open the stream
      setActiveExec(result.execution.id);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setStarting(false);
    }
  }

  // ── Activate / Deactivate ───────────────────────────────

  async function handleToggleActive() {
    setToggling(true);
    try {
      const updated = await workflowsApi.update(id, { isActive: !isActive });
      setIsActive(updated.isActive);
    } catch {
      // ignore — could add a toast here
    } finally {
      setToggling(false);
    }
  }

  // ── Workflow name edit ──────────────────────────────────

  async function handleNameBlur() {
    const trimmed = workflowName.trim();
    if (!trimmed) return;
    await workflowsApi.update(id, { name: trimmed }).catch(() => {});
  }

  // ── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>Loading canvas…</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <span>{loadError}</span>
          <button onClick={() => router.push('/dashboard')}>← Back to dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <header className={styles.toolbar}>
        <Link href="/dashboard" className={styles.backBtn}>← Dashboard</Link>
        <div className={styles.toolbarDivider} />

        <input
          className={styles.nameInput}
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          aria-label="Workflow name"
        />

        {isDirty && <span className={styles.dirtyDot}>• unsaved</span>}

        <div className={styles.spacer} />

        {/* Execution status badge */}
        {runError && (
          <span className={`${styles.runBadge} ${styles.runBadgeFailed}`}>
            {runError}
          </span>
        )}
        {!runError && starting && (
          <span className={`${styles.runBadge} ${styles.runBadgeRunning}`}>Starting…</span>
        )}
        {!runError && !starting && isStreaming && (
          <span className={`${styles.runBadge} ${styles.runBadgeRunning}`}>Running…</span>
        )}
        {!runError && !isStreaming && lastResult === 'success' && (
          <span className={`${styles.runBadge} ${styles.runBadgeSuccess}`}>✓ Done</span>
        )}
        {!runError && !isStreaming && lastResult === 'failed' && (
          <span className={`${styles.runBadge} ${styles.runBadgeFailed}`}>✕ Failed</span>
        )}

        <button
          className={`${styles.btnToggle} ${isActive ? styles.btnDeactivate : styles.btnActivate}`}
          onClick={handleToggleActive}
          disabled={toggling}
          title={isActive ? 'Deactivate workflow' : 'Activate workflow'}
        >
          {toggling ? '…' : isActive ? '⏸ Active' : '▶ Inactive'}
        </button>

        <button
          className={styles.btnRun}
          onClick={handleRun}
          disabled={starting || isStreaming || !isActive}
          title={!isActive ? 'Activate the workflow to run it' : undefined}
        >
          {starting ? '…' : '▶ Run'}
        </button>

        <button
          className={styles.btnSave}
          onClick={handleSave}
          disabled={saving || !isDirty}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      {/* Body */}
      <div className={styles.body}>
        <NodePalette />

        <div className={styles.canvasWrap} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => { rfInstance.current = instance; }}
            onNodeClick={(_, node) => selectNode(node.id)}
            onPaneClick={() => selectNode(null)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            deleteKeyCode="Delete"
          >
            <Background color="rgba(255,255,255,0.04)" gap={24} />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const colors: Record<string, string> = {
                  trigger: '#10b981', action: '#6366f1', condition: '#f59e0b', delay: '#8b5cf6',
                };
                return colors[n.type ?? ''] ?? '#52525b';
              }}
              maskColor="rgba(0,0,0,0.5)"
            />
          </ReactFlow>
        </div>

        {selectedNodeId && <NodeSidebar />}
      </div>
    </div>
  );
}
