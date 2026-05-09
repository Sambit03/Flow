/**
 * Auth Routes
 *
 * Signup, login, and logout are handled by Neon Auth (via the Next.js app).
 * This file only exposes profile endpoints that require an authenticated session.
 *
 * GET  /auth/me  — return current user profile
 * PUT  /auth/me  — update current user profile
 */

import { Router, Request, Response } from "express";
import { neonAuthMiddleware, invalidateSession } from "@/auth/neon-auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/users";
import { eq } from "drizzle-orm";

const router = Router();

// POST /auth/logout — invalidates the server-side session cache immediately
// so the token cannot be reused even within the JWT TTL window.
router.post("/logout", neonAuthMiddleware, (req: Request, res: Response) => {
  const token = (req as any).user?.token as string | undefined;
  if (token) invalidateSession(token);
  res.json({ message: "Logged out" });
});

router.get("/me", neonAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, email } = (req as any).user;

    const profileList = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (profileList[0]) {
      return res.json(profileList[0]);
    }

    // First visit — create a profile row for this Neon Auth user
    const [created] = await db
      .insert(profiles)
      .values({ id: userId, email, username: email.split("@")[0] })
      .returning();

    res.json(created);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

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
