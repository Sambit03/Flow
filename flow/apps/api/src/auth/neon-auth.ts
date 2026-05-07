/**
 * Neon Auth Integration
 *
 * This module handles user authentication via Neon Auth.
 * Neon Auth provides JWT-based authentication integrated with PostgreSQL.
 *
 * Flow:
 * 1. User signs up/logs in via Neon Auth
 * 2. Neon Auth returns a JWT token
 * 3. Token is stored in HTTP-only cookie or sent in Authorization header
 * 4. API extracts JWT from request and passes it to Neon DB
 * 5. Neon DB uses JWT to enforce RLS policies
 */

import { Request, Response, NextFunction } from "express";
import { jwtDecode } from "jwt-decode";

export interface NeonAuthToken {
  sub: string; // user_id (UUID)
  email: string;
  iat: number; // issued at
  exp: number; // expiration
}

/**
 * Middleware to extract and verify Neon Auth JWT token (or mock token for testing)
 *
 * Expects token in:
 * 1. Authorization: Bearer <token> header
 * 2. Or in HTTP-only cookie (configure based on your setup)
 *
 * Adds `req.user` with decoded token information
 */
export function neonAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Missing authentication token" });
    }

    let decoded: any;

    // Try to decode as mock token (base64 JSON)
    try {
      const decodedStr = Buffer.from(token, "base64").toString("utf-8");
      decoded = JSON.parse(decodedStr);
    } catch {
      // Try to decode as JWT
      try {
        decoded = jwtDecode<NeonAuthToken>(token);
      } catch {
        return res.status(401).json({ error: "Invalid token format" });
      }
    }

    // Check expiration if present
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now) {
        return res.status(401).json({ error: "Token expired" });
      }
    }

    // Attach user info to request
    (req as any).user = {
      userId: decoded.sub || decoded.userId,
      email: decoded.email,
      token,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * Signup handler - creates new user via Neon Auth or mock for local testing
 *
 * Usage:
 * POST /auth/signup
 * Body: { email: string, password: string, username?: string }
 */
export async function signup(
  email: string,
  password: string,
  username?: string,
) {
  try {
    // Always use mock auth for development or when NEON_AUTH_URL is not set
    const useRealAuth =
      process.env.NEON_AUTH_URL && process.env.NODE_ENV !== "development";

    console.log(
      `[AUTH] Using ${useRealAuth ? "Neon Auth" : "MOCK auth"}. NEON_AUTH_URL=${process.env.NEON_AUTH_URL}, NODE_ENV=${process.env.NODE_ENV}`,
    );

    if (!useRealAuth) {
      const { v4: uuidv4 } = require("uuid");
      const userId = uuidv4();
      const now = Math.floor(Date.now() / 1000);
      const mockToken = Buffer.from(
        JSON.stringify({
          sub: userId,
          email: email,
          iat: now,
          exp: now + 86400 * 7, // 7 days
        }),
      ).toString("base64");

      console.log(`[AUTH] Mock signup: userId=${userId}, email=${email}`);

      return {
        token: mockToken,
        user: {
          userId,
          email,
        },
      };
    }

    const response = await fetch(`${process.env.NEON_AUTH_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        username: username || email.split("@")[0],
      }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      throw new Error(data?.message || "Signup failed");
    }

    return {
      token: data?.token,
      user: {
        userId: data?.user?.id,
        email: data?.user?.email,
      },
    };
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

/**
 * Login handler - authenticates user via Neon Auth or mock for local testing
 *
 * Usage:
 * POST /auth/login
 * Body: { email: string, password: string }
 */
export async function login(email: string, password: string) {
  try {
    // Always use mock auth for development or when NEON_AUTH_URL is not set
    const useRealAuth =
      process.env.NEON_AUTH_URL && process.env.NODE_ENV !== "development";

    if (!useRealAuth) {
      const { v4: uuidv4 } = require("uuid");
      const userId = uuidv4();
      const now = Math.floor(Date.now() / 1000);
      const mockToken = Buffer.from(
        JSON.stringify({
          sub: userId,
          email: email,
          iat: now,
          exp: now + 86400 * 7, // 7 days
        }),
      ).toString("base64");

      console.log(`[AUTH] Mock login: userId=${userId}, email=${email}`);

      return {
        token: mockToken,
        user: {
          userId,
          email,
        },
      };
    }

    const response = await fetch(`${process.env.NEON_AUTH_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as any;

    if (!response.ok) {
      throw new Error(data?.message || "Login failed");
    }

    return {
      token: data?.token,
      user: {
        userId: data?.user?.id,
        email: data?.user?.email,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * Logout handler - invalidates token (optional, depends on Neon Auth implementation)
 *
 * In JWT-based auth, logout is typically done client-side by removing the token.
 * Server-side logout would require token blacklisting.
 */
export async function logout(token: string) {
  try {
    // For local testing, logout is a no-op
    if (!process.env.NEON_AUTH_URL || process.env.NODE_ENV === "development") {
      return { success: true };
    }

    const response = await fetch(`${process.env.NEON_AUTH_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

/**
 * Extract user ID from Neon Auth JWT token
 * Used in database queries to enforce data isolation
 */
export function getUserIdFromToken(token: string): string {
  const decoded = jwtDecode<NeonAuthToken>(token);
  return decoded.sub; // user_id
}
