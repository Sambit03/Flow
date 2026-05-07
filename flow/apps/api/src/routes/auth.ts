/**
 * Auth Routes
 *
 * API endpoints for user authentication:
 * - POST /auth/signup - Create new user
 * - POST /auth/login - Authenticate user
 * - POST /auth/logout - Logout user
 * - GET /auth/me - Get current user profile
 * - PUT /auth/me - Update user profile
 */

import { Router, Request, Response } from "express";
import { signup, login, logout, neonAuthMiddleware } from "@/auth/neon-auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/users";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * POST /auth/signup
 * Create a new user account
 */
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // Sign up via Neon Auth
    const result = await signup(email, password, username);
    console.log(`[SIGNUP] Result from signup():`, result);

    // Create profile record with returned user info
    try {
      const [profile] = await db
        .insert(profiles)
        .values({
          id: result.user.userId,
          email: result.user.email,
          username: username || email.split("@")[0],
        })
        .returning();

      console.log(`[SIGNUP] Profile created:`, profile);

      res.status(201).json({
        token: result.token,
        user: profile || result.user,
      });
    } catch (profileError) {
      console.error(`[SIGNUP] Profile creation error:`, profileError);
      // If profile creation fails, still return the token but log the error
      res.status(201).json({
        token: result.token,
        user: result.user,
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Signup failed",
    });
  }
});

/**
 * POST /auth/login
 * Authenticate and login user
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const result = await login(email, password);

    res.json({
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({
      error: error instanceof Error ? error.message : "Login failed",
    });
  }
});

/**
 * POST /auth/logout
 * Logout user (invalidate token)
 */
router.post(
  "/logout",
  neonAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const token = (req as any).user.token;
      await logout(token);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(400).json({
        error: error instanceof Error ? error.message : "Logout failed",
      });
    }
  },
);

/**
 * GET /auth/me
 * Get current user's profile
 */
router.get("/me", neonAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    const profileList = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const profile = profileList[0];

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PUT /auth/me
 * Update user profile
 */
router.put("/me", neonAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { username, avatarUrl } = req.body;

    const [updated] = await db
      .update(profiles)
      .set({
        username: username || undefined,
        avatarUrl: avatarUrl || undefined,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, userId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
