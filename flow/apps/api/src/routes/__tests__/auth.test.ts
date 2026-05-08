/**
 * Auth API Tests
 *
 * Tests for:
 * - GET /auth/me (get profile)
 * - PUT /auth/me (update profile)
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import {
  TEST_USER_ID,
  TEST_USER_EMAIL,
  createMockToken,
  mockProfile,
} from "./setup";

vi.mock("@/auth/neon-auth", () => ({
  neonAuthMiddleware: (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Missing authentication token" });
    }
    try {
      const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
      if (!decoded.sub) throw new Error("Invalid token");
      (req as any).user = {
        userId: decoded.sub,
        email: decoded.email,
        token,
      };
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  },
}));

vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    query: {
      profiles: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { db } from "@/db";

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const { default: authRoutes } = await import("../auth");
  app.use("/auth", authRoutes);
});

describe("GET /auth/me (get current user profile)", () => {
  it("should return 200 with user profile", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockProfile]),
        }),
      }),
    });

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("email", TEST_USER_EMAIL);
    expect(response.body).toHaveProperty("username");
  });

  it("should create profile on first visit", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockProfile]),
      }),
    });

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error("DB timeout")),
        }),
      }),
    });

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("DB timeout");
  });
});

describe("PUT /auth/me (update profile)", () => {
  it("should return 200 with updated profile", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const updatedProfile = { ...mockProfile, username: "newusername" };

    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedProfile]),
        }),
      }),
    });

    const response = await request(app)
      .put("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "newusername" });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe("newusername");
  });

  it("should allow updating username", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProfile]),
        }),
      }),
    });

    const response = await request(app)
      .put("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "updateduser" });

    expect(response.status).toBe(200);
  });

  it("should allow updating avatar URL", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const updatedProfile = {
      ...mockProfile,
      avatarUrl: "https://example.com/avatar.jpg",
    };

    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedProfile]),
        }),
      }),
    });

    const response = await request(app)
      .put("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ avatarUrl: "https://example.com/avatar.jpg" });

    expect(response.status).toBe(200);
  });

  it("should allow partial updates", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProfile]),
        }),
      }),
    });

    const response = await request(app)
      .put("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "onlyusername" });

    expect(response.status).toBe(200);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app)
      .put("/auth/me")
      .send({ username: "newuser" });

    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const response = await request(app)
      .put("/auth/me")
      .set("Authorization", "Bearer invalid-token")
      .send({ username: "newuser" });

    expect(response.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error("Update failed")),
        }),
      }),
    });

    const response = await request(app)
      .put("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "test" });

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("Update failed");
  });

  it("should accept empty body (no-op)", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockProfile]),
        }),
      }),
    });

    const response = await request(app)
      .put("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(200);
  });
});
