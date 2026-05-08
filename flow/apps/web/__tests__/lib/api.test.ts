import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from '@/store';

// Mock the Neon auth client before any imports resolve it
vi.mock('@/lib/auth/client', () => ({
  authClient: {
    getSession: vi.fn(),
  },
}));

// Import after mock is registered
import { authClient } from '@/lib/auth/client';
import { workflows, executions } from '@/lib/api';

const TOKEN = 'test-bearer-token';

function mockSession(token: string | null) {
  vi.mocked(authClient.getSession).mockResolvedValue({
    data: token ? { session: { token } } : null,
    error: null,
  } as ReturnType<typeof authClient.getSession> extends Promise<infer R> ? R : never);
}

function mockFetch(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null });
    vi.clearAllMocks();
    // Prevent jsdom navigation errors when handleExpiredSession runs
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── request() internals ──────────────────────────────────

  describe('request internals', () => {
    it('attaches Authorization header with Bearer token', async () => {
      mockSession(TOKEN);
      mockFetch(200, []);

      await workflows.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${TOKEN}`,
          }),
        })
      );
    });

    it('attaches Content-Type application/json', async () => {
      mockSession(TOKEN);
      mockFetch(200, []);

      await workflows.list();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('throws "Session expired" when session has no token', async () => {
      mockSession(null);
      await expect(workflows.list()).rejects.toThrow('Session expired');
    });

    it('throws with server error message on non-ok response', async () => {
      mockSession(TOKEN);
      mockFetch(500, { error: 'Internal server error' });
      await expect(workflows.list()).rejects.toThrow('Internal server error');
    });

    it('falls back to "Request failed" when body has no error field', async () => {
      mockSession(TOKEN);
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.reject(new Error('not json')),
      } as unknown as Response);

      await expect(workflows.list()).rejects.toThrow('Request failed');
    });

    it('clears auth and throws on 401', async () => {
      mockSession(TOKEN);
      useAuthStore.setState({ token: TOKEN, user: { userId: 'u1', email: 'a@b.com' } });
      mockFetch(401, { error: 'Unauthorized' });

      await expect(workflows.list()).rejects.toThrow('Session expired');
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  // ── workflows API ────────────────────────────────────────

  describe('workflows.list', () => {
    it('calls GET /api/workflows and returns parsed body', async () => {
      mockSession(TOKEN);
      const data = [{ id: 'wf-1', name: 'My Flow', isActive: false }];
      mockFetch(200, data);

      const result = await workflows.list();
      expect(result).toEqual(data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });
  });

  describe('workflows.get', () => {
    it('calls GET /api/workflows/:id', async () => {
      mockSession(TOKEN);
      mockFetch(200, { id: 'wf-1' });

      await workflows.get('wf-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows/wf-1'),
        expect.anything()
      );
    });
  });

  describe('workflows.create', () => {
    it('sends POST with name and description in body', async () => {
      mockSession(TOKEN);
      mockFetch(200, { id: 'wf-new', name: 'New Flow' });

      await workflows.create('New Flow', 'A description');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'New Flow', description: 'A description' }),
        })
      );
    });

    it('sends POST without description when omitted', async () => {
      mockSession(TOKEN);
      mockFetch(200, { id: 'wf-new' });

      await workflows.create('Unnamed');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Unnamed', description: undefined }),
        })
      );
    });
  });

  describe('workflows.update', () => {
    it('sends PUT with partial data', async () => {
      mockSession(TOKEN);
      mockFetch(200, { id: 'wf-1' });

      await workflows.update('wf-1', { isActive: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows/wf-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ isActive: true }),
        })
      );
    });
  });

  describe('workflows.delete', () => {
    it('sends DELETE to /api/workflows/:id', async () => {
      mockSession(TOKEN);
      mockFetch(200, {});

      await workflows.delete('wf-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows/wf-1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('workflows.execute', () => {
    it('sends POST to /api/workflows/:id/execute', async () => {
      mockSession(TOKEN);
      mockFetch(200, { execution: { id: 'exec-1' }, message: 'queued' });

      const result = await workflows.execute('wf-1', { key: 'val' });
      expect(result.execution.id).toBe('exec-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows/wf-1/execute'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ── executions API ───────────────────────────────────────

  describe('executions.list', () => {
    it('calls /api/workflows/:workflowId/executions', async () => {
      mockSession(TOKEN);
      mockFetch(200, []);

      await executions.list('wf-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows/wf-1/executions'),
        expect.anything()
      );
    });
  });

  describe('executions.get', () => {
    it('calls the correct nested path', async () => {
      mockSession(TOKEN);
      mockFetch(200, { id: 'exec-1', stepLogs: [] });

      await executions.get('wf-1', 'exec-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows/wf-1/executions/exec-1'),
        expect.anything()
      );
    });
  });

  describe('executions.logs', () => {
    it('calls the /logs sub-path', async () => {
      mockSession(TOKEN);
      mockFetch(200, []);

      await executions.logs('wf-1', 'exec-1');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/workflows/wf-1/executions/exec-1/logs'),
        expect.anything()
      );
    });
  });
});
