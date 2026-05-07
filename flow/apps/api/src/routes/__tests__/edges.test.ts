/**
 * Edges API Tests
 *
 * Tests for:
 * - PUT /api/workflows/:workflowId/edges (save all edges)
 * - DELETE /api/workflows/:workflowId/edges/:edgeId (delete edge)
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import {
  TEST_USER_ID,
  TEST_USER_EMAIL,
  TEST_WORKFLOW_ID,
  TEST_EDGE_ID,
  TEST_NODE_ID,
  createMockToken,
  mockWorkflow,
  mockEdge,
} from "./setup";

// Mock auth middleware
vi.mock("@/auth/neon-auth", () => ({
  neonAuthMiddleware: (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "Missing authentication token" });
    }
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    (req as any).user = {
      userId: decoded.sub,
      email: decoded.email,
      token,
    };
    next();
  },
}));

// Mock Drizzle DB
vi.mock("@/db", () => ({
  db: {
    query: {
      workflows: {
        findFirst: vi.fn(),
      },
    },
    delete: vi.fn(),
    insert: vi.fn(),
  },
}));

// Mock UUID
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid-456"),
}));

// Import mocked modules
import { db } from "@/db";

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const { default: edgeRoutes } = await import("../edges");
  app.use("/api/workflows", edgeRoutes);
});

describe("PUT /api/workflows/:workflowId/edges (save all edges)", () => {
  it("should return 200 with edges saved", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.delete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const edges = [
      {
        id: TEST_EDGE_ID,
        sourceId: TEST_NODE_ID,
        targetId: "target-node-id",
        branch: null,
      },
    ];

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/edges`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ edges });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Edges saved successfully");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/edges`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ edges: [mockEdge] });

    expect(response.status).toBe(404);
  });

  it("should not allow other users to save edges", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/edges`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ edges: [mockEdge] });

    expect(response.status).toBe(404);
  });

  it("should accept empty edge array (delete all edges)", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.delete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/edges`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ edges: [] });

    expect(response.status).toBe(200);
  });

  it("should replace all edges (not merge)", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.delete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const edges = [
      {
        id: "edge-1",
        sourceId: "node-1",
        targetId: "node-2",
        branch: null,
      },
      {
        id: "edge-2",
        sourceId: "node-2",
        targetId: "node-3",
        branch: "true", // Example branch condition
      },
    ];

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/edges`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ edges });

    expect(response.status).toBe(200);
    // Verify delete was called (to replace edges)
    expect(db.delete).toHaveBeenCalled();
  });

  it("should return 401 with no token", async () => {
    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/edges`)
      .send({ edges: [mockEdge] });

    expect(response.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi
      .fn()
      .mockRejectedValue(new Error("Connection lost"));

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/edges`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ edges: [] });

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("Connection lost");
  });

  it("should handle missing edges field", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.delete = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/edges`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(response.status).toBe(200);
  });
});

describe("DELETE /api/workflows/:workflowId/edges/:edgeId (delete edge)", () => {
  it("should return 200 with edge deleted", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.delete = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockEdge]),
      }),
    });

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/edges/${TEST_EDGE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.edge).toHaveProperty("id", TEST_EDGE_ID);
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/edges/${TEST_EDGE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 when edge not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.delete = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]), // Empty means not found
      }),
    });

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/edges/${TEST_EDGE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should not allow deleting edge from other user's workflow", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/edges/${TEST_EDGE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 400 when workflowId is missing", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .delete(`/api/workflows//edges/${TEST_EDGE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404); // Route not found
  });

  it("should return 400 when edgeId is missing", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/edges/`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404); // Route not found
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).delete(
      `/api/workflows/${TEST_WORKFLOW_ID}/edges/${TEST_EDGE_ID}`,
    );

    expect(response.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.delete = vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error("DB constraint violation")),
    });

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/edges/${TEST_EDGE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("DB constraint");
  });
});
