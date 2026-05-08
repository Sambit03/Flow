'use client';

import { createAuthClient } from '@neondatabase/auth/next';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient = createAuthClient() as any as ReturnType<typeof createAuthClient>;
