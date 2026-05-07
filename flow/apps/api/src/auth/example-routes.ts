/**
 * Example Express Route using Neon Auth
 *
 * This file demonstrates how to set up authenticated API routes
 * that integrate with Neon Auth and the database.
 *
 * Copy this pattern for your own routes.
 */

import express, { Router, Request, Response } from "express";
import { neonAuthMiddleware } from "@/auth/neon-auth";
import { db } from "@/db";
import { profiles } from "@/db/schema/users";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /auth/me
 *
 * Returns the authenticated user's profile
 * Protected: requires valid Neon Auth JWT
 */
router.get("/me", neonAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    // Query the profiles table with the authenticated user's ID
    const profileList = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const profile = profileList[0];

    if (!profile) {
      // Create profile if it doesn't exist (first-time login)
      const [newProfile] = await db
        .insert(profiles)
        .values({
          id: userId,
          email: (req as any).user.email,
          username:
            (req as any).user.email.split("@")[0] +
            "_" +
            Math.random().toString(36).substr(2, 9),
        })
        .returning();

      return res.json(newProfile);
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * PUT /auth/me
 *
 * Updates the authenticated user's profile
 * Protected: requires valid Neon Auth JWT
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
