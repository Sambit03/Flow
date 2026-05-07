/**
 * API client for the Flow backend.
 * All calls attach the Bearer token from localStorage.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('flow_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────

export interface AuthResult {
  token: string;
  user: { userId: string; email: string; username?: string };
}

export const auth = {
  signup: (email: string, password: string, username?: string) =>
    request<AuthResult>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),

  login: (email: string, password: string) =>
    request<AuthResult>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),

  me: () =>
    request<{ id: string; email: string; username: string }>('/auth/me'),
};

// ── Workflows ─────────────────────────────────────────────

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDetail extends WorkflowSummary {
  nodes: ApiNode[];
  edges: ApiEdge[];
}

export interface ApiNode {
  id: string;
  workflowId: string;
  type: 'trigger' | 'action' | 'condition' | 'delay';
  label: string;
  config: Record<string, unknown>;
  positionX: number;
  positionY: number;
  orderIndex?: number;
}

export interface ApiEdge {
  id: string;
  workflowId: string;
  sourceId: string;
  targetId: string;
}

export const workflows = {
  list: () => request<WorkflowSummary[]>('/api/workflows'),

  get: (id: string) => request<WorkflowDetail>(`/api/workflows/${id}`),

  create: (name: string, description?: string) =>
    request<WorkflowSummary>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  update: (id: string, data: Partial<{ name: string; description: string; isActive: boolean; cronExpression: string }>) =>
    request<WorkflowSummary>(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/api/workflows/${id}`, { method: 'DELETE' }),

  saveCanvas: async (
    id: string,
    nodes: Array<Omit<ApiNode, 'workflowId'>>,
    edges: Array<Omit<ApiEdge, 'workflowId'>>
  ) => {
    await request(`/api/workflows/${id}/nodes`, {
      method: 'PUT',
      body: JSON.stringify({ nodes }),
    });
    await request(`/api/workflows/${id}/edges`, {
      method: 'PUT',
      body: JSON.stringify({ edges }),
    });
  },

  execute: (id: string, payload?: Record<string, unknown>) =>
    request<{ execution: { id: string }; message: string }>(`/api/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    }),
};

// ── Executions ────────────────────────────────────────────

export interface Execution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  trigger: 'webhook' | 'cron' | 'manual';
  startedAt: string;
  finishedAt?: string;
}

export interface StepLog {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  input?: unknown;
  output?: unknown;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
}

export const executions = {
  list: (workflowId: string) =>
    request<Execution[]>(`/api/workflows/${workflowId}/executions`),

  get: (workflowId: string, executionId: string) =>
    request<Execution & { stepLogs: StepLog[] }>(`/api/workflows/${workflowId}/executions/${executionId}`),

  logs: (workflowId: string, executionId: string) =>
    request<StepLog[]>(`/api/workflows/${workflowId}/executions/${executionId}/logs`),
};
