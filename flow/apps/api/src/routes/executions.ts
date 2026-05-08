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

export default router;
