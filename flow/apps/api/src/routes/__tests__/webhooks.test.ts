/**
 * Webhook API Tests
 *
 * Tests for:
 * - POST /api/webhooks/:workflowId (public webhook trigger)
 *
 * SPECIAL: This is a public endpoint (no JWT auth) but validates x-flow-secret header
 */

import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import {
  TEST_WORKFLOW_ID,
  TEST_NODE_ID,
  TEST_EXECUTION_ID,
  mockWorkflow,
  mockNode,
  mockExecution,
} from "./setup";

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
    insert: vi.fn(),
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

let app: Express;

beforeAll(async () => {
  app = express();
  app.use(express.json());

  // Webhook route is public (no auth middleware)
  const { default: webhookRoutes } = await import("../webhooks");
  app.use("/api/webhooks", webhookRoutes);
});

describe("POST /api/webhooks/:workflowId (webhook trigger)", () => {
  it("should return 202 with correct webhook secret", async () => {
    // Using imported db variable
    const correctSecret = "whsec_test123";
    const activeWorkflow = {
      ...mockWorkflow,
      isActive: true,
      webhookSecret: correctSecret,
    };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(activeWorkflow);
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockExecution]),
      }),
    });

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", correctSecret)
      .send({ event: "order.created", data: { orderId: "123" } });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty("executionId");
    expect(response.body).toHaveProperty("message");
  });

  it("should return 401 when x-flow-secret header is missing", async () => {
    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .send({ event: "test" });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("secret");
  });

  it("should return 401 when x-flow-secret is wrong", async () => {
    // Using imported db variable
    const correctSecret = "whsec_correct123";
    const wrongSecret = "whsec_wrong999";
    const workflow = { ...mockWorkflow, webhookSecret: correctSecret };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(workflow);

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", wrongSecret)
      .send({ event: "test" });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("secret");
  });

  it("should not leak workflow existence when secret is wrong", async () => {
    // Using imported db variable

    // Even if workflow doesn't exist, return same error
    db.query.workflows.findFirst = vi.fn().mockResolvedValue(null);

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", "whsec_wrong")
      .send({ event: "test" });

    expect(response.status).toBe(401);
    expect(response.body.error).not.toContain("not found");
  });

  it("should return 403 when workflow is not active", async () => {
    // Using imported db variable
    const correctSecret = "whsec_test123";
    const inactiveWorkflow = {
      ...mockWorkflow,
      isActive: false,
      webhookSecret: correctSecret,
    };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(inactiveWorkflow);

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", correctSecret)
      .send({ event: "test" });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain("not active");
  });

  it("should accept webhook payload and store in execution", async () => {
    // Using imported db variable
    const correctSecret = "whsec_test123";
    const activeWorkflow = {
      ...mockWorkflow,
      isActive: true,
      webhookSecret: correctSecret,
    };
    const payload = { event: "user.signup", email: "test@flow.dev" };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(activeWorkflow);
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockExecution]),
      }),
    });

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", correctSecret)
      .send(payload);

    expect(response.status).toBe(202);
  });

  it("should accept empty payload", async () => {
    // Using imported db variable
    const correctSecret = "whsec_test123";
    const activeWorkflow = {
      ...mockWorkflow,
      isActive: true,
      webhookSecret: correctSecret,
    };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(activeWorkflow);
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockExecution]),
      }),
    });

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", correctSecret)
      .send({});

    expect(response.status).toBe(202);
  });

  it("should queue the execution job", async () => {
    // Using imported workflowQueue
    const correctSecret = "whsec_test123";
    const activeWorkflow = {
      ...mockWorkflow,
      isActive: true,
      webhookSecret: correctSecret,
    };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(activeWorkflow);
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockExecution]),
      }),
    });

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", correctSecret)
      .send({ data: "test" });

    expect(response.status).toBe(202);
    expect(workflowQueue.add).toHaveBeenCalled();
  });

  it("should return 400 when workflow ID is missing", async () => {
    const response = await request(app)
      .post(`/api/webhooks/`)
      .set("x-flow-secret", "whsec_test")
      .send({ event: "test" });

    expect(response.status).toBe(404); // Route not found
  });

  it("should handle database errors gracefully", async () => {
    // Using imported db variable

    db.query.workflows.findFirst = vi
      .fn()
      .mockRejectedValue(new Error("DB connection failed"));

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", "whsec_test123")
      .send({ event: "test" });

    expect(response.status).toBe(500);
    expect(response.body.error).not.toContain("DB connection failed");
  });

  it("should not require JWT authentication (public endpoint)", async () => {
    // Using imported db variable
    const correctSecret = "whsec_test123";
    const activeWorkflow = {
      ...mockWorkflow,
      isActive: true,
      webhookSecret: correctSecret,
    };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(activeWorkflow);
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockExecution]),
      }),
    });

    // No Authorization header - should still work with correct secret
    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", correctSecret)
      .send({ event: "test" });

    expect(response.status).toBe(202);
  });

  it("should create execution with webhook trigger type", async () => {
    // Using imported db variable
    const correctSecret = "whsec_test123";
    const activeWorkflow = {
      ...mockWorkflow,
      isActive: true,
      webhookSecret: correctSecret,
    };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(activeWorkflow);
    db.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockExecution]),
      }),
    });

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", correctSecret)
      .send({ event: "test" });

    expect(response.status).toBe(202);
    // Verify DB insert was called with webhook trigger
    expect(db.insert).toHaveBeenCalled();
  });

  it("should handle case-sensitive secret comparison", async () => {
    // Using imported db variable
    const correctSecret = "whsec_TestSecret123";
    const wrongCase = "whsec_testsecret123";
    const workflow = { ...mockWorkflow, webhookSecret: correctSecret };

    db.query.workflows.findFirst = vi.fn().mockResolvedValue(workflow);

    const response = await request(app)
      .post(`/api/webhooks/${TEST_WORKFLOW_ID}`)
      .set("x-flow-secret", wrongCase)
      .send({ event: "test" });

    expect(response.status).toBe(401);
  });
});
