/**
 * Auth API Tests
 *
 * Tests for:
 * - POST /auth/signup (register user)
 * - POST /auth/login (authenticate user)
 * - POST /auth/logout (revoke token)
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

// Mock auth functions
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
  signup: vi.fn().mockResolvedValue({
    token: createMockToken(),
    user: { userId: TEST_USER_ID, email: TEST_USER_EMAIL },
  }),
  login: vi.fn().mockResolvedValue({
    token: createMockToken(),
    user: { userId: TEST_USER_ID, email: TEST_USER_EMAIL },
  }),
  logout: vi.fn().mockResolvedValue(undefined),
}));

// Mock Drizzle DB
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

// Import mocked modules
import { db } from "@/db";
import { signup, login, logout } from "@/auth/neon-auth";

const mockAuthFns = { signup, login, logout };

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const { default: authRoutes } = await import("../auth");
  app.use("/auth", authRoutes);
});

describe("POST /auth/signup (register user)", () => {
  it("should return 201 with token and user", async () => {
    // Using imported auth functions
    // Using imported db variable

    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockProfile]),
      }),
    });

    const response = await request(app).post("/auth/signup").send({
      email: "newuser@flow.dev",
      password: "SecurePassword123!",
      username: "newuser",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.token).toBeTruthy();
  });

  it("should return 400 when email is missing", async () => {
    const response = await request(app).post("/auth/signup").send({
      password: "SecurePassword123!",
      username: "newuser",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("email");
  });

  it("should return 400 when password is missing", async () => {
    const response = await request(app).post("/auth/signup").send({
      email: "newuser@flow.dev",
      username: "newuser",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("password");
  });

  it("should accept optional username", async () => {
    // Using imported db variable

    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockProfile]),
      }),
    });

    const response = await request(app).post("/auth/signup").send({
      email: "nouser@flow.dev",
      password: "SecurePassword123!",
    });

    expect(response.status).toBe(201);
  });

  it("should handle signup errors gracefully", async () => {
    // Using imported auth functions
    mockAuthFns.signup.mockRejectedValueOnce(new Error("Email already exists"));

    const response = await request(app).post("/auth/signup").send({
      email: "existing@flow.dev",
      password: "SecurePassword123!",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should not leak database errors", async () => {
    // Using imported db variable

    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error("Constraint violation")),
      }),
    });

    const response = await request(app).post("/auth/signup").send({
      email: "test@flow.dev",
      password: "SecurePassword123!",
    });

    // Should still return 201 because token was created
    // Profile creation failure is handled gracefully
    expect(response.status).toBe(201);
  });
});

describe("POST /auth/login (authenticate user)", () => {
  it("should return 200 with token and user", async () => {
    // Using imported auth functions

    const response = await request(app).post("/auth/login").send({
      email: TEST_USER_EMAIL,
      password: "CorrectPassword123!",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty("email", TEST_USER_EMAIL);
  });

  it("should return 400 when email is missing", async () => {
    const response = await request(app).post("/auth/login").send({
      password: "CorrectPassword123!",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("email");
  });

  it("should return 400 when password is missing", async () => {
    const response = await request(app).post("/auth/login").send({
      email: TEST_USER_EMAIL,
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("password");
  });

  it("should return 401 with invalid credentials", async () => {
    // Using imported auth functions
    mockAuthFns.login.mockRejectedValueOnce(new Error("Invalid credentials"));

    const response = await request(app).post("/auth/login").send({
      email: "wrong@flow.dev",
      password: "WrongPassword123!",
    });

    expect(response.status).toBe(401);
  });

  it("should not leak user existence via different error messages", async () => {
    // Using imported auth functions
    mockAuthFns.login.mockRejectedValueOnce(new Error("Invalid credentials"));

    const response = await request(app).post("/auth/login").send({
      email: "nonexistent@flow.dev",
      password: "AnyPassword123!",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).not.toContain("not found");
  });
});

describe("POST /auth/logout (revoke token)", () => {
  it("should return 200 with logout message", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).post("/auth/logout");

    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("should handle logout errors gracefully", async () => {
    // Using imported auth functions
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    mockAuthFns.logout.mockRejectedValueOnce(new Error("DB error"));

    const response = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});

describe("GET /auth/me (get current user profile)", () => {
  it("should return 200 with user profile", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

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

  it("should return 404 when profile not found", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
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
    // Using imported db variable

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
    // Using imported db variable
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
    // Using imported db variable

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
    // Using imported db variable
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
    // Using imported db variable

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
      .send({ username: "onlyusername" }); // Only update username

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
    // Using imported db variable

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
    // Using imported db variable

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
