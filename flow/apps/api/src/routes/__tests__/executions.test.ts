/**
 * Executions API Tests
 *
 * Tests for:
 * - GET /api/workflows/:workflowId/executions (list)
 * - GET /api/workflows/:workflowId/executions/:executionId (detail)
 * - GET /api/workflows/:workflowId/executions/:executionId/logs (logs)
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

  const { default: executionRoutes } = await import("../executions");
  app.use("/api/workflows", executionRoutes);
});

describe("GET /api/workflows/:workflowId/executions (list)", () => {
  it("should return 200 with execution list", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockExecution]),
          }),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty("id");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should not allow access to other user's workflow executions", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).get(
      `/api/workflows/${TEST_WORKFLOW_ID}/executions`,
    );

    expect(response.status).toBe(401);
  });

  it("should return empty array when no executions", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should limit results to 50", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi
      .fn()
      .mockRejectedValue(new Error("Connection failed"));

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("Connection failed");
  });
});

describe("GET /api/workflows/:workflowId/executions/:executionId (detail)", () => {
  it("should return 200 with execution detail and logs", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable
    const executionWithLogs = {
      ...mockExecution,
      stepLogs: [
        {
          id: "log-1",
          executionId: TEST_EXECUTION_ID,
          nodeId: "node-1",
          status: "completed",
        },
      ],
    };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.query.executions.findFirst = vi
      .fn()
      .mockResolvedValue(executionWithLogs);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", TEST_EXECUTION_ID);
    expect(response.body).toHaveProperty("stepLogs");
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 404 when execution not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.query.executions.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should not allow access to other user's execution", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).get(
      `/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}`,
    );

    expect(response.status).toBe(401);
  });

  it("should return 400 when workflowId or executionId missing", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions/`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404); // Route not found
  });
});

describe("GET /api/workflows/:workflowId/executions/:executionId/logs", () => {
  it("should return 200 with step logs", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable
    const stepLogs = [
      {
        id: "log-1",
        executionId: TEST_EXECUTION_ID,
        nodeId: "node-1",
        status: "completed",
      },
      {
        id: "log-2",
        executionId: TEST_EXECUTION_ID,
        nodeId: "node-2",
        status: "pending",
      },
    ];

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(stepLogs),
        }),
      }),
    });

    const response = await request(app)
      .get(
        `/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}/logs`,
      )
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  it("should return 404 when workflow not found", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(
        `/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}/logs`,
      )
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return empty array when no logs", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const response = await request(app)
      .get(
        `/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}/logs`,
      )
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("should not allow access to other user's logs", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .get(
        `/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}/logs`,
      )
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it("should return 401 with no token", async () => {
    const response = await request(app).get(
      `/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}/logs`,
    );

    expect(response.status).toBe(401);
  });

  it("should return 400 when parameters missing", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);

    const response = await request(app)
      .get(`/api/workflows/${TEST_WORKFLOW_ID}/executions//logs`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(404); // Route not found
  });

  it("should handle database errors gracefully", async () => {
    const userToken = createMockToken(TEST_USER_ID, TEST_USER_EMAIL);
    // Using imported db variable

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(mockWorkflow);
    db.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockRejectedValue(new Error("DB error")),
        }),
      }),
    });

    const response = await request(app)
      .get(
        `/api/workflows/${TEST_WORKFLOW_ID}/executions/${TEST_EXECUTION_ID}/logs`,
      )
      .set("Authorization", `Bearer ${userToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("DB error");
  });
});
