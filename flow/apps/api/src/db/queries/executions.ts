import { eq, and, desc } from "drizzle-orm";
import db from "../../lib/db";
import { executions, stepLogs } from "../schema";

// ── Execution Queries ──────────────────────────────────

export async function createExecution(
  workflowId: string,
  trigger: "webhook" | "cron" | "manual",
) {
  return await db
    .insert(executions)
    .values({
      workflowId,
      status: "running",
      trigger,
    })
    .returning();
}

export async function getExecutionById(executionId: string) {
  return await db.query.executions.findFirst({
    where: eq(executions.id, executionId),
    with: {
      stepLogs: {
        with: {
          node: true,
        },
      },
    },
  });
}

export async function getExecutionsByWorkflow(
  workflowId: string,
  limit: number = 50,
) {
  return await db.query.executions.findMany({
    where: eq(executions.workflowId, workflowId),
    limit,
    orderBy: desc(executions.startedAt),
    with: {
      stepLogs: true,
    },
  });
}

export async function updateExecutionStatus(
  executionId: string,
  status: "pending" | "running" | "success" | "failed",
) {
  return await db
    .update(executions)
    .set({
      status,
      ...(status === "success" || status === "failed"
        ? { finishedAt: new Date() }
        : {}),
    })
    .where(eq(executions.id, executionId))
    .returning();
}

// ── Step Log Queries ───────────────────────────────────

export async function createStepLog(
  executionId: string,
  nodeId: string,
  status: "pending" | "running" | "success" | "failed" = "pending",
) {
  return await db
    .insert(stepLogs)
    .values({
      executionId,
      nodeId,
      status,
      startedAt: new Date(),
    })
    .returning();
}

export async function updateStepLog(
  stepLogId: string,
  data: {
    status?: "pending" | "running" | "success" | "failed";
    output?: unknown;
    error?: string;
  },
) {
  return await db
    .update(stepLogs)
    .set({
      ...data,
      finishedAt:
        data.status && ["success", "failed"].includes(data.status)
          ? new Date()
          : undefined,
    })
    .where(eq(stepLogs.id, stepLogId))
    .returning();
}

export async function getStepLogsByExecution(executionId: string) {
  return await db.query.stepLogs.findMany({
    where: eq(stepLogs.executionId, executionId),
    with: {
      node: true,
    },
  });
}
