/**
 * Executions Routes
 *
 * API endpoints for workflow executions:
 * - GET /api/workflows/:workflowId/executions - List executions
 * - GET /api/workflows/:workflowId/executions/:executionId - Get execution details
 * - GET /api/workflows/:workflowId/executions/:executionId/logs - Get step logs
 */

import { Router, Request, Response } from "express";
import { neonAuthMiddleware } from "@/auth/neon-auth";
import { isValidUUID } from "@/lib/validateUUID";
import { db } from "@/db";
import { workflows, executions, stepLogs } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { workflowQueue } from "@/queue";

const router = Router();

// All routes require authentication
router.use(neonAuthMiddleware);

/**
 * GET /api/workflows/:workflowId/executions
 * List all executions for a workflow
 */
router.get("/:workflowId/executions", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { workflowId } = req.params;

    if (!workflowId) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    if (!isValidUUID(workflowId)) {
      return res.status(400).json({ error: "Invalid workflow ID format" });
    }

    // Verify ownership
    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const executionList = await db
      .select()
      .from(executions)
      .where(eq(executions.workflowId, workflowId))
      .orderBy(desc(executions.startedAt))
      .limit(50);

    res.json(executionList);
  } catch (error) {
    console.error("Error fetching executions:", error);
    res.status(500).json({ error: "Failed to fetch executions" });
  }
});

/**
 * GET /api/workflows/:workflowId/executions/:executionId
 * Get a specific execution with its details
 */
router.get(
  "/:workflowId/executions/:executionId",
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { workflowId, executionId } = req.params;

      if (!workflowId || !executionId) {
        return res
          .status(400)
          .json({ error: "Workflow ID and Execution ID are required" });
      }

      if (!isValidUUID(workflowId)) {
        return res.status(400).json({ error: "Invalid workflow ID format" });
      }

      if (!isValidUUID(executionId)) {
        return res.status(400).json({ error: "Invalid execution ID format" });
      }

      // Verify workflow ownership
      const workflow = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const execution = await db.query.executions.findFirst({
        where: and(
          eq(executions.id, executionId),
          eq(executions.workflowId, workflowId),
        ),
        with: {
          stepLogs: true,
        },
      });

      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }

      res.json(execution);
    } catch (error) {
      console.error("Error fetching execution:", error);
      res.status(500).json({ error: "Failed to fetch execution" });
    }
  },
);

/**
 * GET /api/workflows/:workflowId/executions/:executionId/logs
 * Get step logs for an execution
 */
router.get(
  "/:workflowId/executions/:executionId/logs",
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { workflowId, executionId } = req.params;

      if (!workflowId || !executionId) {
        return res
          .status(400)
          .json({ error: "Workflow ID and Execution ID are required" });
      }

      // Verify workflow ownership
      const workflow = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const logs = await db
        .select()
        .from(stepLogs)
        .where(eq(stepLogs.executionId, executionId))
        .orderBy(stepLogs.startedAt);

      res.json(logs);
    } catch (error) {
      console.error("Error fetching step logs:", error);
      res.status(500).json({ error: "Failed to fetch step logs" });
    }
  },
);

/**
 * POST /api/workflows/:workflowId/executions/:executionId/cancel
 * Cancel a pending or running execution
 */
router.post(
  "/:workflowId/executions/:executionId/cancel",
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const workflowId = req.params.workflowId as string;
      const executionId = req.params.executionId as string;

      if (!isValidUUID(workflowId) || !isValidUUID(executionId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const workflow = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const execution = await db.query.executions.findFirst({
        where: and(
          eq(executions.id, executionId),
          eq(executions.workflowId, workflowId),
        ),
      });

      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }

      if (!["pending", "running"].includes(execution.status)) {
        return res.status(400).json({
          error: `Cannot cancel execution with status "${execution.status}"`,
        });
      }

      // Remove from BullMQ if it is still waiting in the queue
      const job = await workflowQueue.getJob(executionId);
      if (job) {
        const state = await job.getState();
        if (state === "waiting" || state === "delayed") {
          await job.remove();
        }
      }

      // Signal cancellation — the worker checks this after each step
      await db
        .update(executions)
        .set({ status: "cancelled", finishedAt: new Date() })
        .where(eq(executions.id, executionId));

      // Mark all still-pending step logs as skipped
      await db
        .update(stepLogs)
        .set({ status: "skipped" })
        .where(
          and(
            eq(stepLogs.executionId, executionId),
            eq(stepLogs.status, "pending"),
          ),
        );

      res.json({ message: "Execution cancelled" });
    } catch (error) {
      console.error("Error cancelling execution:", error);
      res.status(500).json({ error: "Failed to cancel execution" });
    }
  },
);

export default router;
