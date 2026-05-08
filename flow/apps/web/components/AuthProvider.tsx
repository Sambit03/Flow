'use client';

import { useEffect } from 'react';
import { authClient } from '@/lib/auth/client';
import { useAuthStore } from '@/store';

function isJWT(token: string | null | undefined): boolean {
  return typeof token === 'string' && token.split('.').length === 3;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    function syncSession() {
      authClient.getSession().then(({ data }) => {
        if (data?.session && data?.user) {
          const newToken = data.session.token;
          // Prefer a JWT. If Neon Auth didn't include set-auth-jwt in this
          // response, session.token is the raw session token — keep the
          // existing Zustand JWT so the backend can still validate it.
          const storedToken = useAuthStore.getState().token;
          const tokenToStore = isJWT(newToken) ? newToken : (storedToken ?? newToken);
          setAuth(tokenToStore, {
            userId: data.user.id,
            email: data.user.email,
            username: data.user.name ?? undefined,
          });
        }
        // Do NOT call clearAuth() here. Session expiry is handled authoritatively
        // by the 401 path in api.ts (handleExpiredSession).
      });
    }

    syncSession();

    // Re-sync when the tab regains focus to refresh the stored token
    window.addEventListener('focus', syncSession);
    return () => window.removeEventListener('focus', syncSession);
  }, [setAuth]);

  return <>{children}</>;
}
