import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth Store ──────────────────────────────────────────

interface AuthState {
  token: string | null;
  user: { userId: string; email: string; username?: string } | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'flow-auth',
      // sessionStorage is cleared when the tab closes — the token never persists
      // across browser sessions. authClient.getSession() re-hydrates the JWT on
      // each new session without requiring the user to re-enter credentials.
      storage: typeof window !== 'undefined'
        ? {
            getItem: (k) => sessionStorage.getItem(k),
            setItem: (k, v) => sessionStorage.setItem(k, v),
            removeItem: (k) => sessionStorage.removeItem(k),
          }
        : undefined,
    }
  )
);

// ── Canvas / Workflow Store ─────────────────────────────

import type { Node, Edge } from 'reactflow';

export interface CanvasNode extends Node {
  data: {
    label: string;
    type: 'trigger' | 'action' | 'condition' | 'delay';
    config: Record<string, unknown>;
    status?: 'pending' | 'running' | 'success' | 'failed';
  };
}

export type CanvasEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  data?: Record<string, unknown>;
};

export interface ConsoleEntry {
  id: string;
  level: 'log' | 'warning' | 'error';
  timestamp: number;
  nodeId: string;
  nodeLabel: string;
  message: string;
  input?: unknown;
  output?: unknown;
}

interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  activeExecutionId: string | null;
  nodeStatuses: Record<string, 'pending' | 'running' | 'success' | 'failed'>;

  // Workflow metadata (set when a workflow is loaded on the canvas)
  workflowId: string | null;
  isActive: boolean;
  webhookSecret: string | null;

  setNodes: (nodes: CanvasNode[]) => void;
  setEdges: (edges: CanvasEdge[]) => void;
  selectNode: (id: string | null) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  updateNodeLabel: (id: string, label: string) => void;
  markDirty: () => void;
  markClean: () => void;
  setActiveExecution: (id: string | null) => void;
  setNodeStatus: (nodeId: string, status: 'pending' | 'running' | 'success' | 'failed') => void;
  clearNodeStatuses: () => void;
  setWorkflowMeta: (meta: { workflowId: string; isActive: boolean; webhookSecret: string }) => void;
  setIsActive: (active: boolean) => void;

  consoleLogs: ConsoleEntry[];
  isConsoleOpen: boolean;
  consoleFilter: 'all' | 'error' | 'warning' | 'log';
  unreadErrorCount: number;
  addConsoleEntry: (entry: Omit<ConsoleEntry, 'id' | 'timestamp'>) => void;
  clearConsoleLogs: () => void;
  openConsole: () => void;
  closeConsole: () => void;
  setConsoleFilter: (filter: CanvasState['consoleFilter']) => void;
}

export const useCanvasStore = create<CanvasState>()((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
  activeExecutionId: null,
  nodeStatuses: {},
  workflowId: null,
  isActive: false,
  webhookSecret: null,
  consoleLogs: [],
  isConsoleOpen: false,
  consoleFilter: 'all',
  unreadErrorCount: 0,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (id) => set({ selectedNodeId: id }),

  updateNodeConfig: (id, config) =>
    set((state) => ({
      isDirty: true,
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, config } } : n
      ),
    })),

  updateNodeLabel: (id, label) =>
    set((state) => ({
      isDirty: true,
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, label } } : n
      ),
    })),

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  setActiveExecution: (id) => set({ activeExecutionId: id }),

  setNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodeStatuses: { ...state.nodeStatuses, [nodeId]: status },
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n
      ),
    })),

  clearNodeStatuses: () =>
    set((state) => ({
      nodeStatuses: {},
      nodes: state.nodes.map((n) => ({
        ...n,
        data: { ...n.data, status: undefined },
      })),
    })),

  setWorkflowMeta: (meta) =>
    set({ workflowId: meta.workflowId, isActive: meta.isActive, webhookSecret: meta.webhookSecret }),

  setIsActive: (active) => set({ isActive: active }),

  addConsoleEntry: (entry) =>
    set((state) => {
      const newEntry: ConsoleEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() };
      const consoleLogs = [...state.consoleLogs, newEntry].slice(-200);
      const unreadErrorCount =
        entry.level === 'error' && !state.isConsoleOpen
          ? state.unreadErrorCount + 1
          : state.unreadErrorCount;
      return { consoleLogs, unreadErrorCount };
    }),

  clearConsoleLogs: () => set({ consoleLogs: [], unreadErrorCount: 0 }),
  openConsole: () => set({ isConsoleOpen: true, unreadErrorCount: 0 }),
  closeConsole: () => set({ isConsoleOpen: false }),
  setConsoleFilter: (filter) => set({ consoleFilter: filter }),
}));
