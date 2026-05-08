import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '@/store';
import type { CanvasNode, CanvasEdge } from '@/store';

const RESET: Parameters<typeof useCanvasStore.setState>[0] = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
  activeExecutionId: null,
  nodeStatuses: {},
  workflowId: null,
  isActive: false,
  webhookSecret: null,
};

function makeNode(id: string, type: CanvasNode['data']['type'] = 'action'): CanvasNode {
  return {
    id,
    position: { x: 0, y: 0 },
    data: { label: `Node ${id}`, type, config: {} },
  };
}

function makeEdge(id: string, source: string, target: string): CanvasEdge {
  return { id, source, target };
}

describe('useCanvasStore', () => {
  beforeEach(() => {
    useCanvasStore.setState(RESET);
  });

  // ── setNodes / setEdges ──────────────────────────────────

  describe('setNodes', () => {
    it('replaces the nodes array', () => {
      const nodes = [makeNode('1'), makeNode('2')];
      useCanvasStore.getState().setNodes(nodes);
      expect(useCanvasStore.getState().nodes).toEqual(nodes);
    });

    it('clears nodes when given an empty array', () => {
      useCanvasStore.setState({ nodes: [makeNode('1')] });
      useCanvasStore.getState().setNodes([]);
      expect(useCanvasStore.getState().nodes).toHaveLength(0);
    });
  });

  describe('setEdges', () => {
    it('replaces the edges array', () => {
      const edges = [makeEdge('e1', '1', '2')];
      useCanvasStore.getState().setEdges(edges);
      expect(useCanvasStore.getState().edges).toEqual(edges);
    });
  });

  // ── selectNode ───────────────────────────────────────────

  describe('selectNode', () => {
    it('sets selectedNodeId to the given id', () => {
      useCanvasStore.getState().selectNode('node-abc');
      expect(useCanvasStore.getState().selectedNodeId).toBe('node-abc');
    });

    it('clears selectedNodeId when passed null', () => {
      useCanvasStore.setState({ selectedNodeId: 'node-abc' });
      useCanvasStore.getState().selectNode(null);
      expect(useCanvasStore.getState().selectedNodeId).toBeNull();
    });
  });

  // ── updateNodeConfig ─────────────────────────────────────

  describe('updateNodeConfig', () => {
    it('updates config on the matching node', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1')] });
      useCanvasStore.getState().updateNodeConfig('n1', { url: 'https://example.com' });
      expect(useCanvasStore.getState().nodes[0].data.config).toEqual({ url: 'https://example.com' });
    });

    it('marks the canvas as dirty', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1')] });
      useCanvasStore.getState().updateNodeConfig('n1', { key: 'val' });
      expect(useCanvasStore.getState().isDirty).toBe(true);
    });

    it('does not mutate unrelated nodes', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1'), makeNode('n2')] });
      useCanvasStore.getState().updateNodeConfig('n1', { foo: 'bar' });
      expect(useCanvasStore.getState().nodes[1].data.config).toEqual({});
    });

    it('does nothing when the node id does not exist', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1')] });
      useCanvasStore.getState().updateNodeConfig('nonexistent', { x: 1 });
      expect(useCanvasStore.getState().nodes[0].data.config).toEqual({});
    });
  });

  // ── updateNodeLabel ──────────────────────────────────────

  describe('updateNodeLabel', () => {
    it('updates the label of the matching node', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1')] });
      useCanvasStore.getState().updateNodeLabel('n1', 'Renamed');
      expect(useCanvasStore.getState().nodes[0].data.label).toBe('Renamed');
    });

    it('marks the canvas as dirty', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1')] });
      useCanvasStore.getState().updateNodeLabel('n1', 'Renamed');
      expect(useCanvasStore.getState().isDirty).toBe(true);
    });

    it('leaves other nodes unchanged', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1'), makeNode('n2')] });
      useCanvasStore.getState().updateNodeLabel('n1', 'X');
      expect(useCanvasStore.getState().nodes[1].data.label).toBe('Node n2');
    });
  });

  // ── markDirty / markClean ────────────────────────────────

  describe('markDirty', () => {
    it('sets isDirty to true', () => {
      useCanvasStore.getState().markDirty();
      expect(useCanvasStore.getState().isDirty).toBe(true);
    });
  });

  describe('markClean', () => {
    it('sets isDirty to false', () => {
      useCanvasStore.setState({ isDirty: true });
      useCanvasStore.getState().markClean();
      expect(useCanvasStore.getState().isDirty).toBe(false);
    });
  });

  // ── setActiveExecution ───────────────────────────────────

  describe('setActiveExecution', () => {
    it('stores the execution id', () => {
      useCanvasStore.getState().setActiveExecution('exec-123');
      expect(useCanvasStore.getState().activeExecutionId).toBe('exec-123');
    });

    it('clears the execution id when passed null', () => {
      useCanvasStore.setState({ activeExecutionId: 'exec-123' });
      useCanvasStore.getState().setActiveExecution(null);
      expect(useCanvasStore.getState().activeExecutionId).toBeNull();
    });
  });

  // ── setNodeStatus ────────────────────────────────────────

  describe('setNodeStatus', () => {
    it('updates nodeStatuses map', () => {
      useCanvasStore.getState().setNodeStatus('n1', 'running');
      expect(useCanvasStore.getState().nodeStatuses['n1']).toBe('running');
    });

    it('reflects status on the corresponding node data', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1')] });
      useCanvasStore.getState().setNodeStatus('n1', 'success');
      expect(useCanvasStore.getState().nodes[0].data.status).toBe('success');
    });

    it('can update from one status to another', () => {
      useCanvasStore.setState({ nodes: [makeNode('n1')] });
      useCanvasStore.getState().setNodeStatus('n1', 'running');
      useCanvasStore.getState().setNodeStatus('n1', 'failed');
      expect(useCanvasStore.getState().nodeStatuses['n1']).toBe('failed');
    });

    it('accumulates statuses for multiple nodes', () => {
      useCanvasStore.getState().setNodeStatus('n1', 'success');
      useCanvasStore.getState().setNodeStatus('n2', 'failed');
      const { nodeStatuses } = useCanvasStore.getState();
      expect(nodeStatuses['n1']).toBe('success');
      expect(nodeStatuses['n2']).toBe('failed');
    });
  });

  // ── clearNodeStatuses ────────────────────────────────────

  describe('clearNodeStatuses', () => {
    it('empties the nodeStatuses map', () => {
      useCanvasStore.setState({ nodeStatuses: { n1: 'success', n2: 'failed' } });
      useCanvasStore.getState().clearNodeStatuses();
      expect(useCanvasStore.getState().nodeStatuses).toEqual({});
    });

    it('removes status from all nodes', () => {
      const node = makeNode('n1');
      useCanvasStore.setState({
        nodes: [{ ...node, data: { ...node.data, status: 'success' } }],
        nodeStatuses: { n1: 'success' },
      });
      useCanvasStore.getState().clearNodeStatuses();
      expect(useCanvasStore.getState().nodes[0].data.status).toBeUndefined();
    });
  });

  // ── setWorkflowMeta ──────────────────────────────────────

  describe('setWorkflowMeta', () => {
    it('stores workflowId, isActive, and webhookSecret', () => {
      useCanvasStore.getState().setWorkflowMeta({
        workflowId: 'wf-42',
        isActive: true,
        webhookSecret: 'secret-xyz',
      });
      const state = useCanvasStore.getState();
      expect(state.workflowId).toBe('wf-42');
      expect(state.isActive).toBe(true);
      expect(state.webhookSecret).toBe('secret-xyz');
    });

    it('overwrites a previous meta call', () => {
      useCanvasStore.getState().setWorkflowMeta({ workflowId: 'wf-1', isActive: true, webhookSecret: 'a' });
      useCanvasStore.getState().setWorkflowMeta({ workflowId: 'wf-2', isActive: false, webhookSecret: 'b' });
      expect(useCanvasStore.getState().workflowId).toBe('wf-2');
    });
  });

  // ── setIsActive ──────────────────────────────────────────

  describe('setIsActive', () => {
    it('sets isActive to true', () => {
      useCanvasStore.getState().setIsActive(true);
      expect(useCanvasStore.getState().isActive).toBe(true);
    });

    it('sets isActive to false', () => {
      useCanvasStore.setState({ isActive: true });
      useCanvasStore.getState().setIsActive(false);
      expect(useCanvasStore.getState().isActive).toBe(false);
    });
  });
});
