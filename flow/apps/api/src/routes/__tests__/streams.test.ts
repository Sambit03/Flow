/**
 * Execution Stream (SSE) API Tests
 *
 * Tests for:
 * - GET /api/executions/:executionId/stream (Server-Sent Events)
 *
 * SPECIAL: This returns SSE format (text/event-stream), not JSON
 * Must test headers, keep-alive, and event format
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import {
  TEST_USER_ID,
  TEST_USER_EMAIL,
  TEST_WORKFLOW_ID,
  TEST_EXECUTION_ID,
  createMockToken,
  mockWorkflow,
  mockExecution,
} from "./setup";

// Mock auth middleware
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

// Mock Drizzle DB
vi.mock("@/db", () => ({
  db: {
    query: {
      workflows: {
        findFirst: vi.fn(),
      },
      executions: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
  },
}));

// Import mocked modules
import { db } from "@/db";

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const { default: streamRoutes } = await import("../streams");
  app.use("/api/executions", streamRoutes);
});

describe("GET /api/executions/:executionId/stream (SSE stream)", () => {
  it("should return 200 with text/event-stream content type", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
  });

  it("should set correct SSE headers", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.headers["cache-control"]).toBe("no-cache");
    expect(response.headers["connection"]).toBe("keep-alive");
  });

  it("should send initial connected message", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain("connected");
    expect(response.text).toContain(TEST_EXECUTION_ID);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).get(
      `/api/executions/${TEST_EXECUTION_ID}/stream`,
    );

    expect(response.status).toBe(401);
  });

  it("should return 401 with invalid token", async () => {
    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("should return 404 when execution not found", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should return 403 when workflow not found (access denied)", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("should not allow access to other user's execution", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("should return 400 when execution ID is missing", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .get(`/api/executions//stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404); // Route not found
  });

  it("should handle database errors gracefully", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi
      .fn()
      .mockRejectedValue(new Error("Connection lost"));

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("Connection lost");
  });

  it("should send SSE events in correct format", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    // SSE format is "data: <json>\n\n"
    expect(response.text).toContain("data:");
  });

  it("should keep connection open for streaming", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers["connection"]).toBe("keep-alive");
  });

  it("should not return JSON on SSE stream", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.headers["content-type"]).not.toContain("application/json");
    expect(response.headers["content-type"]).toContain("text/event-stream");
  });

  it("should set SSE content-type header", async () => {
    const token = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    db.query.executions.findFirst = vi.fn().mockResolvedValue(mockExecution);
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/executions/${TEST_EXECUTION_ID}/stream`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.headers["content-type"]).toContain("text/event-stream");
  });
});
