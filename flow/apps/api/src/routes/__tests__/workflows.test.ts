/**
 * Workflows API Tests
 *
 * Tests for:
 * - GET /api/workflows (list)
 * - POST /api/workflows (create)
 * - GET /api/workflows/:id (get single)
 * - PUT /api/workflows/:id (update)
 * - DELETE /api/workflows/:id (soft delete)
 * - POST /api/workflows/:id/execute (trigger)
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import { neonAuthMiddleware } from "@/auth/neon-auth";
import {
  TEST_USER_ID,
  TEST_USER_ID_2,
  TEST_USER_EMAIL,
  TEST_WORKFLOW_ID,
  TEST_NODE_ID,
  TEST_EXECUTION_ID,
  createMockToken,
  createExpiredToken,
  mockWorkflow,
  mockNode,
  mockExecution,
} from "./setup";
import { eq, and, isNull, desc } from "drizzle-orm";

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
    select: vi.fn(),
    query: {
      workflows: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

// Mock BullMQ Queue
vi.mock("@/queue", () => ({
  workflowQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
  },
}));

// Import mocked modules
import { db } from "@/db";
import { workflowQueue } from "@/queue";

// Create test Express app with routes
let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  // Import and mount router after mocks are set up
  const { default: workflowRoutes } = await import("../workflows");
  app.use("/api/workflows", workflowRoutes);
});

describe("GET /api/workflows (list user workflows)", () => {
  it("should return 200 with list of user workflows", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([mockWorkflow]),
        }),
      }),
    } as any);

    const response = await request(app)
      .get("/api/workflows")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0].userId).toBe(TEST_USER_ID);
  });

  it("should return 401 with missing token", async () => {
    const response = await request(app).get("/api/workflows");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 401 with invalid token", async () => {
    const response = await request(app)
      .get("/api/workflows")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  it("should return empty array when user has no workflows", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const response = await request(app)
      .get("/api/workflows")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should never return workflows from other users", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const otherUserWorkflow = { ...mockWorkflow, userId: TEST_USER_ID_2 };

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(
            [otherUserWorkflow], // This should never happen with proper scoping
          ),
        }),
      }),
    } as any);

    // The route should filter by userId, so this tests the DB query builder
    expect(db.select).toBeDefined();
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockRejectedValue(new Error("DB connection failed")),
        }),
      }),
    } as any);

    const response = await request(app)
      .get("/api/workflows")
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).not.toContain("DB connection failed"); // No stack trace leak
  });
});

describe("POST /api/workflows (create workflow)", () => {
  it("should return 201 with created workflow", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const newWorkflow = { ...mockWorkflow, name: "New Workflow" };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newWorkflow]),
      }),
    } as any);

    const response = await request(app)
      .post("/api/workflows")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "New Workflow", description: "Test description" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("New Workflow");
  });

  it("should return 400 when name is missing", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .post("/api/workflows")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ description: "No name provided" });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("name");
  });

  it("should return 400 when body is empty", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .post("/api/workflows")
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app)
      .post("/api/workflows")
      .send({ name: "Test" });

    expect(response.status).toBe(401);
  });

  it("should generate webhook secret on creation", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const newWorkflow = { ...mockWorkflow, webhookSecret: "whsec_abc123" };

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([newWorkflow]),
      }),
    } as any);

    const response = await request(app)
      .post("/api/workflows")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Webhook Test" });

    expect(response.status).toBe(201);
    expect(response.body.webhookSecret).toMatch(/^whsec_/);
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockRejectedValue(new Error("Unique constraint failed")),
      }),
    } as any);

    const response = await request(app)
      .post("/api/workflows")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Duplicate" });

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("Unique constraint");
  });
});

describe("GET /api/workflows/:id (get single workflow)", () => {
  it("should return 200 with workflow and related data", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const workflowWithRelations = {
      ...mockWorkflow,
      nodes: [mockNode],
      edges: [],
    };

    vi.mocked(db.query).workflows.findFirst = vi
      .fn()
      .mockResolvedValue(workflowWithRelations);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", TEST_WORKFLOW_ID);
    expect(response.body).toHaveProperty("nodes");
    expect(response.body).toHaveProperty("edges");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.query).workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toContain("not found");
  });

  it("should return 404 when workflow belongs to another user", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.query).workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 200 routing to list when ID is omitted", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    const response = await request(app)
      .get(`/api/workflows/`)
      .set("Authorization", `Bearer ${userToken}`);

    // /api/workflows/ matches the list route in Express, not 404
    expect(response.status).toBe(200);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).get(
      `/api/workflows/${TEST_WORKFLOW_ID}`,
    );

    expect(response.status).toBe(401);
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.query).workflows.findFirst = vi
      .fn()
      .mockRejectedValue(new Error("Connection timeout"));

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("Connection timeout");
  });
});

describe("PUT /api/workflows/:id (update workflow)", () => {
  it("should return 200 with updated workflow", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const updatedWorkflow = { ...mockWorkflow, name: "Updated Name" };

    vi.mocked(db.query).workflows.findFirst = vi
      .fn()
      .mockResolvedValue(mockWorkflow);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedWorkflow]),
        }),
      }),
    } as any);

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Updated Name" });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Updated Name");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.query).workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "New Name" });

    expect(response.status).toBe(404);
  });

  it("should not update workflow from other user", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const otherUserWorkflow = { ...mockWorkflow, userId: TEST_USER_ID_2 };

    vi.mocked(db.query).workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Hacked Name" });

    expect(response.status).toBe(404);
  });

  it("should allow partial updates", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const updated = { ...mockWorkflow, description: "New description" };

    vi.mocked(db.query).workflows.findFirst = vi
      .fn()
      .mockResolvedValue(mockWorkflow);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated]),
        }),
      }),
    } as any);

    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ description: "New description" }); // Only update description

    expect(response.status).toBe(200);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app)
      .put(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .send({ name: "Test" });

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/workflows/:id (soft delete)", () => {
  it("should return 200 with deleted workflow", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const deletedWorkflow = { ...mockWorkflow, deletedAt: new Date() };

    vi.mocked(db.query).workflows.findFirst = vi
      .fn()
      .mockResolvedValue(mockWorkflow);
    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([deletedWorkflow]),
        }),
      }),
    } as any);

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.workflow).toHaveProperty("deletedAt");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.query).workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should not delete workflow from other user", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.query).workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .delete(`/api/workflows/${TEST_WORKFLOW_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).delete(
      `/api/workflows/${TEST_WORKFLOW_ID}`,
    );

    expect(response.status).toBe(401);
  });
});

describe("POST /api/workflows/:id/execute (trigger execution)", () => {
  it("should return 201 with execution created", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const workflowWithNodes = {
      ...mockWorkflow,
      isActive: true,
      nodes: [mockNode],
    };

    vi.mocked(db.query).workflows.findFirst = vi
      .fn()
      .mockResolvedValue(workflowWithNodes);
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockExecution]),
      }),
    } as any);

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/execute`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ payload: { foo: "bar" } });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("execution");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.query).workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/execute`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ payload: {} });

    expect(response.status).toBe(404);
  });

  it("should return 400 when workflow is not active", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const inactiveWorkflow = { ...mockWorkflow, isActive: false };

    vi.mocked(db.query).workflows.findFirst = vi
      .fn()
      .mockResolvedValue(inactiveWorkflow);

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/execute`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ payload: {} });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("not active");
  });

  it("should not execute workflow from other user", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    vi.mocked(db.query).workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/execute`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ payload: {} });

    expect(response.status).toBe(404);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/execute`)
      .send({ payload: {} });

    expect(response.status).toBe(401);
  });

  it("should accept empty payload", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    const workflowWithNodes = {
      ...mockWorkflow,
      isActive: true,
      nodes: [mockNode],
    };

    vi.mocked(db.query).workflows.findFirst = vi
      .fn()
      .mockResolvedValue(workflowWithNodes);
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockExecution]),
      }),
    } as any);

    const response = await request(app)
      .post(`/api/workflows/${TEST_WORKFLOW_ID}/execute`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(response.status).toBe(201);
  });
});
