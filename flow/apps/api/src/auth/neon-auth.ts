import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema/users";

export interface NeonAuthUser {
  userId: string;
  email: string;
  token: string;
}

const sessionCache = new Map<string, { user: NeonAuthUser; expiresAt: number }>();

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(baseUrl: string) {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${baseUrl}/.well-known/jwks.json`));
  }
  return jwks;
}

interface NeonJWTPayload extends JWTPayload {
  email?: string;
}

function isJWT(token: string) {
  return token.split(".").length === 3;
}

async function validateSession(token: string): Promise<NeonAuthUser> {
  const cached = sessionCache.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached.user;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  if (!baseUrl) throw new Error("NEON_AUTH_BASE_URL is not set");

  // ── Path 1: JWKS signature verification (for JWTs from set-auth-jwt) ──
  if (isJWT(token)) {
    try {
      const { payload } = await jwtVerify<NeonJWTPayload>(token, getJWKS(baseUrl));
      if (!payload.sub) throw new Error("JWT missing sub claim");

      const user: NeonAuthUser = { userId: payload.sub, email: payload.email ?? "", token };
      const ttl = payload.exp
        ? Math.min(payload.exp * 1000 - Date.now(), 60_000)
        : 30_000;
      if (ttl > 0) sessionCache.set(token, { user, expiresAt: Date.now() + ttl });
      pruneCache();
      return user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[validateSession] JWKS failed (${msg}) — falling back to DB`);
    }
  }

  // ── Path 2: Database lookup (works for raw session tokens) ───────────
  // The neon_auth schema is in the same PostgreSQL database, so we can
  // validate sessions directly without any external API call.
  const rows = await db.execute(sql`
    SELECT s."userId", u.email
    FROM neon_auth.session s
    JOIN neon_auth.user u ON u.id = s."userId"
    WHERE s.token = ${token}
      AND s."expiresAt" > NOW()
    LIMIT 1
  `);

  const row = (rows as any).rows?.[0];
  if (!row?.userId) throw new Error("Session not found or expired");

  const user: NeonAuthUser = {
    userId: row.userId,
    email: row.email ?? "",
    token,
  };
  sessionCache.set(token, { user, expiresAt: Date.now() + 30_000 });
  pruneCache();
  return user;
}

function pruneCache() {
  if (sessionCache.size > 1000) {
    const firstKey = sessionCache.keys().next().value;
    if (firstKey !== undefined) sessionCache.delete(firstKey);
  }
}

/** Remove a token from the in-memory cache immediately on logout. */
export function invalidateSession(token: string): void {
  sessionCache.delete(token);
}

export async function neonAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token" });
  }

  try {
    const user = await validateSession(token);
    (req as any).user = user;

    // Ensure a profiles row exists so FK constraints on downstream tables never fail.
    // onConflictDoNothing targets the PK so this is a no-op after the first request.
    await db
      .insert(profiles)
      .values({
        id: user.userId,
        email: user.email,
        username: user.email.split("@")[0] ?? user.userId,
      })
      .onConflictDoNothing();

    next();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[neonAuthMiddleware] validation failed:", msg);
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
