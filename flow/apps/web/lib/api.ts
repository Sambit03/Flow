/**
 * API client for the Flow backend.
 * All calls attach the Bearer token from the active Neon Auth session.
 */

import { authClient } from '@/lib/auth/client';
import { useAuthStore } from '@/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function isJWT(token: string | null | undefined): boolean {
  return typeof token === 'string' && token.split('.').length === 3;
}

async function getToken(): Promise<string | null> {
  const { data } = await authClient.getSession();
  const sessionToken = data?.session?.token;

  // Prefer the token from authClient only if it is a JWT (set-auth-jwt was
  // present in the Neon Auth response).  Raw Better Auth session tokens are
  // NOT recognised by the Express backend's JWKS validation path.
  if (isJWT(sessionToken)) return sessionToken!;

  // Fall back to the Zustand-persisted token which was set at login time when
  // set-auth-jwt was present.  This preserves the JWT across getSession()
  // calls that return a raw token instead of a JWT.
  return useAuthStore.getState().token;
}

function handleExpiredSession(): never {
  useAuthStore.getState().clearAuth();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  throw new Error('Session expired. Please log in again.');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  // If token is null, send the request anyway — the backend 401 response is the
  // authoritative signal that the session is gone (handled two lines below).

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      handleExpiredSession();
    }
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

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
  webhookSecret: string;
  cronExpression?: string | null;
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
  branch?: string | null;
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
      body: JSON.stringify({ edges: edges.map((e) => ({ ...e, branch: e.branch ?? null })) }),
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
  totalSteps?: number;
  completedSteps?: number;
  error?: string | null;
}

export interface StepLog {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
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
