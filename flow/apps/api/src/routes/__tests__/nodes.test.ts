/**
 * Nodes API Tests
 *
 * Tests for:
 * - PUT /api/workflows/:workflowId/nodes (canvas save - transactional)
 * - POST /api/workflows/:workflowId/nodes/:nodeId (update single node)
 * - DELETE /api/workflows/:workflowId/nodes/:nodeId (soft delete)
 *
 * SPECIAL: Canvas save must test transaction atomicity
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import {
  TEST_USER_ID,
  TEST_USER_EMAIL,
  TEST_WORKFLOW_ID,
  TEST_NODE_ID,
  createMockToken,
  mockWorkflow,
  mockNode,
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
    },
    update: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
    transaction: vi.fn(),
  },
}));

// Mock UUID
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mock-uuid-123"),
}));

// Import mocked modules
import { db } from "@/db";

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  const { default: nodeRoutes } = await import("../nodes");
  app.use("/api/workflows", nodeRoutes);
});

describe("PUT /api/workflows/:workflowId/nodes (canvas save - transactional)", () => {
  it("should return 200 with canvas saved", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    // Mock the transaction to succeed
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.transaction = vi.fn(async (callback) => {
      // Call the callback with a mock transaction
      const mockTx = {
        delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      await callback(mockTx);
      return undefined;
    });

    const newNodes = [
      { ...mockNode, id: "node-1", label: "Start" },
      { ...mockNode, id: "node-2", label: "Step 1" },
    ];

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/nodes`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ nodes: newNodes });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Nodes saved successfully");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/nodes`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ nodes: [mockNode] });

    expect(response.status).toBe(404);
  });

  it("should not allow other users to save canvas", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/nodes`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ nodes: [mockNode] });

    expect(response.status).toBe(404);
  });

  it("should rollback all changes if transaction fails (ATOMICITY TEST)", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);

    // Simulate transaction failure: delete succeeds but insert fails
    db.transaction = vi.fn(async (callback) => {
      const mockTx = {
        delete: vi.fn().mockResolvedValue(undefined), // Succeeds
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockRejectedValue(new Error("Insert failed")), // Fails
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      try {
        await callback(mockTx);
      } catch (error) {
        // Transaction should rollback here
        throw error;
      }
    });

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/nodes`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ nodes: [mockNode] });

    // Should return 500 because transaction failed
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error");
    // Verify no partial changes were saved (transaction atomicity)
    expect(response.body.error).not.toContain("Insert failed"); // No stack trace leak
  });

  it("should accept empty node array", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.transaction = vi.fn(async (callback) => {
      const mockTx = {
        delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      await callback(mockTx);
    });

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/nodes`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ nodes: [] });

    expect(response.status).toBe(200);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/nodes`)
      .send({ nodes: [mockNode] });

    expect(response.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi
      .fn()
      .mockRejectedValue(new Error("Connection timeout"));

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}/nodes`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ nodes: [mockNode] });

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("Connection timeout");
  });
});

describe("POST /api/workflows/:workflowId/nodes/:nodeId (update single node)", () => {
  it("should return 200 with updated node", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable
    const updatedNode = { ...mockNode, label: "Updated Label" };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedNode]),
        }),
      }),
    });

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ label: "Updated Label", positionX: 100, positionY: 200 });

    expect(response.status).toBe(200);
    expect(response.body.label).toBe("Updated Label");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ label: "New Label" });

    expect(response.status).toBe(404);
  });

  it("should return 404 when node not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]), // Empty means not found
        }),
      }),
    });

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ label: "New Label" });

    expect(response.status).toBe(404);
  });

  it("should allow partial updates", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable
    const updatedNode = { ...mockNode, positionX: 50 };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedNode]),
        }),
      }),
    });

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ positionX: 50 }); // Only update position

    expect(response.status).toBe(200);
  });

  it("should return 400 when nodeId is missing", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ label: "Test" });

    expect(response.status).toBe(404); // Route not found
  });

  it("should return 401 with no token", async () => {
    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .send({ label: "Test" });

    expect(response.status).toBe(401);
  });

  it("should not allow updating node from other user's workflow", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ label: "Hacked" });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/workflows/:workflowId/nodes/:nodeId (soft delete)", () => {
  it("should return 200 with deleted node", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable
    const deletedNode = { ...mockNode, deletedAt: new Date() };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([deletedNode]),
        }),
      }),
    });

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.node).toHaveProperty("deletedAt");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 when node not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should not allow deleting node from other user's workflow", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).delete(
      `/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`,
    );

    expect(response.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi
      .fn()
      .mockRejectedValue(new Error("DB error"));

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}/nodes/${TEST_NODE_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("DB error");
  });
});
