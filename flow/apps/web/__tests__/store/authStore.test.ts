import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store';

const mockUser = { userId: 'u1', email: 'test@example.com' };

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ token: null, user: null });
  });

  // ── initial state ────────────────────────────────────────

  describe('initial state', () => {
    it('starts unauthenticated', () => {
      const { token, user } = useAuthStore.getState();
      expect(token).toBeNull();
      expect(user).toBeNull();
    });
  });

  // ── setAuth ──────────────────────────────────────────────

  describe('setAuth', () => {
    it('stores the token in state', () => {
      useAuthStore.getState().setAuth('tok-123', mockUser);
      expect(useAuthStore.getState().token).toBe('tok-123');
    });

    it('stores the user object in state', () => {
      useAuthStore.getState().setAuth('tok-123', mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('writes the token to localStorage', () => {
      useAuthStore.getState().setAuth('tok-123', mockUser);
      expect(localStorage.getItem('flow_token')).toBe('tok-123');
    });

    it('overwrites a previous token', () => {
      useAuthStore.getState().setAuth('old-tok', mockUser);
      useAuthStore.getState().setAuth('new-tok', mockUser);
      expect(useAuthStore.getState().token).toBe('new-tok');
      expect(localStorage.getItem('flow_token')).toBe('new-tok');
    });

    it('includes optional username when provided', () => {
      const userWithName = { ...mockUser, username: 'sambit' };
      useAuthStore.getState().setAuth('tok', userWithName);
      expect(useAuthStore.getState().user?.username).toBe('sambit');
    });

    it('accepts a user without username', () => {
      useAuthStore.getState().setAuth('tok', mockUser);
      expect(useAuthStore.getState().user?.username).toBeUndefined();
    });
  });

  // ── clearAuth ────────────────────────────────────────────

  describe('clearAuth', () => {
    it('sets token to null', () => {
      useAuthStore.getState().setAuth('tok-123', mockUser);
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().token).toBeNull();
    });

    it('sets user to null', () => {
      useAuthStore.getState().setAuth('tok-123', mockUser);
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('removes flow_token from localStorage', () => {
      localStorage.setItem('flow_token', 'tok-123');
      useAuthStore.getState().clearAuth();
      expect(localStorage.getItem('flow_token')).toBeNull();
    });

    it('is idempotent when already cleared', () => {
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  // ── setAuth → clearAuth round-trip ──────────────────────

  describe('round-trip', () => {
    it('can authenticate then sign out multiple times', () => {
      useAuthStore.getState().setAuth('tok-1', mockUser);
      expect(useAuthStore.getState().token).toBe('tok-1');

      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().token).toBeNull();

      useAuthStore.getState().setAuth('tok-2', { userId: 'u2', email: 'b@b.com' });
      expect(useAuthStore.getState().token).toBe('tok-2');
      expect(localStorage.getItem('flow_token')).toBe('tok-2');
    });
  });
});
