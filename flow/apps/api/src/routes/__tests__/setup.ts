/**
 * Test Setup & Shared Mocks
 *
 * Provides:
 * - Mock auth middleware
 * - Mock Drizzle DB with query builders
 * - Mock Redis/BullMQ queue
 * - Test user fixtures
 * - Helper functions for common test patterns
 */

import { vi } from "vitest";
import { Request, Response, NextFunction } from "express";

// ─────────────────────────────────────────────────────────────
// Test User Fixtures
// ─────────────────────────────────────────────────────────────

export const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
export const TEST_USER_ID_2 = "00000000-0000-0000-0000-000000000002";
export const TEST_USER_EMAIL = "test@flow.dev";
export const TEST_USER_EMAIL_2 = "other@flow.dev";

export const TEST_WORKFLOW_ID = "10000000-0000-0000-0000-000000000001";
export const TEST_NODE_ID = "20000000-0000-0000-0000-000000000001";
export const TEST_EDGE_ID = "30000000-0000-0000-0000-000000000001";
export const TEST_EXECUTION_ID = "40000000-0000-0000-0000-000000000001";

// Mock token (base64 encoded JSON)
export function createMockToken(
  userId: string = TEST_USER_ID,
  email: string = TEST_USER_EMAIL,
) {
  const now = Math.floor(Date.now() / 1000);
  return Buffer.from(
    JSON.stringify({
      sub: userId,
      email,
      iat: now,
      exp: now + 86400 * 7, // 7 days
    }),
  ).toString("base64");
}

export function createExpiredToken(userId: string = TEST_USER_ID) {
  const now = Math.floor(Date.now() / 1000);
  return Buffer.from(
    JSON.stringify({
      sub: userId,
      email: TEST_USER_EMAIL,
      iat: now - 86400 * 8,
      exp: now - 1, // Expired 1 second ago
    }),
  ).toString("base64");
}

// ─────────────────────────────────────────────────────────────
// Mock Auth Middleware
// ─────────────────────────────────────────────────────────────

export function mockAuthMiddleware(
  userId: string = TEST_USER_ID,
  email: string = TEST_USER_EMAIL,
) {
  return vi.fn((req: Request, res: Response, next: NextFunction) => {
    (req as any).user = {
      userId,
      email,
      token: createMockToken(userId, email),
    };
    next();
  });
}

// ─────────────────────────────────────────────────────────────
// Mock Drizzle DB Query Builders
// ─────────────────────────────────────────────────────────────

export function createMockDBSelect(initialData: any[] = []) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(initialData),
        limit: vi.fn().mockResolvedValue(initialData),
      }),
      orderBy: vi.fn().mockResolvedValue(initialData),
    }),
  };
}

export function createMockDBInsert(returnValue: any) {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([returnValue]),
      }),
    }),
  };
}

export function createMockDBUpdate(returnValue: any) {
  return {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([returnValue]),
        }),
      }),
    }),
  };
}

export function createMockDBDelete(returnValue: any = []) {
  return {
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(returnValue),
      }),
    }),
  };
}

export function createMockDBTransaction(callback: (tx: any) => Promise<void>) {
  return {
    transaction: vi.fn(async (cb) => {
      // Call the callback with a mock transaction object
      await cb({
        delete: vi.fn().mockResolvedValue(undefined),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(undefined),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });
    }),
  };
}

// ─────────────────────────────────────────────────────────────
// Mock Drizzle DB Query Interface
// ─────────────────────────────────────────────────────────────

export function createMockDBQuery(
  findFirstResult: any = null,
  findResult: any[] = [],
) {
  return {
    workflows: {
      findFirst: vi.fn().mockResolvedValue(findFirstResult),
      findMany: vi.fn().mockResolvedValue(findResult),
    },
    nodes: {
      findFirst: vi.fn().mockResolvedValue(findFirstResult),
      findMany: vi.fn().mockResolvedValue(findResult),
    },
    edges: {
      findFirst: vi.fn().mockResolvedValue(findFirstResult),
      findMany: vi.fn().mockResolvedValue(findResult),
    },
    executions: {
      findFirst: vi.fn().mockResolvedValue(findFirstResult),
      findMany: vi.fn().mockResolvedValue(findResult),
    },
    stepLogs: {
      findFirst: vi.fn().mockResolvedValue(findFirstResult),
      findMany: vi.fn().mockResolvedValue(findResult),
    },
    profiles: {
      findFirst: vi.fn().mockResolvedValue(findFirstResult),
      findMany: vi.fn().mockResolvedValue(findResult),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Mock Queue (BullMQ)
// ─────────────────────────────────────────────────────────────

export function createMockQueue() {
  return {
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
    process: vi.fn(),
  };
}

// ─────────────────────────────────────────────────────────────
// Common Test Data Fixtures
// ─────────────────────────────────────────────────────────────

export const mockWorkflow = {
  id: TEST_WORKFLOW_ID,
  userId: TEST_USER_ID,
  name: "Test Workflow",
  description: "A test workflow",
  isActive: false,
  webhookSecret: "whsec_test123",
  cronExpression: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockNode = {
  id: TEST_NODE_ID,
  workflowId: TEST_WORKFLOW_ID,
  type: "trigger",
  label: "Start",
  config: { subtype: "manual" },
  positionX: 0,
  positionY: 0,
  orderIndex: 0,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockEdge = {
  id: TEST_EDGE_ID,
  workflowId: TEST_WORKFLOW_ID,
  sourceId: TEST_NODE_ID,
  targetId: "30000000-0000-0000-0000-000000000002",
  branch: null,
  createdAt: new Date(),
};

export const mockExecution = {
  id: TEST_EXECUTION_ID,
  workflowId: TEST_WORKFLOW_ID,
  status: "completed",
  trigger: "manual",
  triggerPayload: {},
  totalSteps: 1,
  completedSteps: 1,
  startedAt: new Date(),
  finishedAt: new Date(),
  createdAt: new Date(),
  stepLogs: [],
};

export const mockProfile = {
  id: TEST_USER_ID,
  email: TEST_USER_EMAIL,
  username: "testuser",
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function makeRequest(
  app: any,
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  token?: string,
  body?: any,
) {
  const request = app[method.toLowerCase()](path);

  if (token) {
    request.set("Authorization", `Bearer ${token}`);
  }

  if (body) {
    request.send(body);
  }

  return request;
}
