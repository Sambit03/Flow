/**
 * Execution Stream Routes
 *
 * Server-Sent Events (SSE) endpoints for real-time execution monitoring:
 * - GET /api/executions/:executionId/stream - SSE stream for execution updates
 *
 * This endpoint establishes a persistent connection that streams execution
 * step updates in real-time using Server-Sent Events (SSE).
 */

import { Router, Request, Response } from "express";
import { neonAuthMiddleware } from "@/auth/neon-auth";
import { isValidUUID } from "@/lib/validateUUID";
import { db } from "@/db";
import { workflows, executions, stepLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// All routes require authentication
router.use(neonAuthMiddleware);

/**
 * GET /api/executions/:executionId/stream
 * Server-Sent Events stream for real-time execution monitoring
 *
 * Response headers:
 * - Content-Type: text/event-stream
 * - Cache-Control: no-cache
 * - Connection: keep-alive
 *
 * Returns events in SSE format:
 * data: { executionId, stepId, status, ... }
 *
 * Keep-alive: Sends a comment every 30 seconds to prevent connection timeout
 */
router.get("/:executionId/stream", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { executionId } = req.params;

    if (!executionId) {
      return res.status(400).json({ error: "Execution ID is required" });
    }

    if (!isValidUUID(executionId)) {
      return res.status(400).json({ error: "Invalid execution ID format" });
    }

    // Verify user owns the workflow (indirectly through execution)
    // First, get the execution and verify the associated workflow belongs to user
    const execution = await db.query.executions.findFirst({
      where: eq(executions.id, executionId),
    });

    if (!execution) {
      return res.status(404).json({ error: "Execution not found" });
    }

    // Verify workflow belongs to user
    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, execution.workflowId),
        eq(workflows.userId, userId),
      ),
    });

    if (!workflow) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send initial message
    res.write(
      "data: " + JSON.stringify({ type: "connected", executionId }) + "\n\n",
    );

    // Keep-alive interval
    const keepAliveInterval = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 30000); // Send every 30 seconds

    // Simulate real-time updates (in production, use WebSockets or event emitter)
    // For now, send step logs with polling
    let lastLogId = 0;
    const pollInterval = setInterval(async () => {
      try {
        const logs = await db
          .select()
          .from(stepLogs)
          .where(eq(stepLogs.executionId, executionId))
          .orderBy(stepLogs.startedAt);

        // Send new logs since last poll
        const newLogs = logs.filter((log: any) => {
          const logId = parseInt(log.id.split("-")[0] || "0", 16);
          return logId > lastLogId;
        });

        for (const log of newLogs) {
          res.write(
            "data: " +
              JSON.stringify({
                type: "step_update",
                stepId: log.id,
                status: log.status,
                nodeLabel: log.nodeLabel,
                updatedAt: new Date().toISOString(),
              }) +
              "\n\n",
          );
        }

        // Update last log id
        if (logs.length > 0) {
          lastLogId = parseInt(
            logs[logs.length - 1].id.split("-")[0] || "0",
            16,
          );
        }

        // Check if execution is finished
        const updatedExecution = await db.query.executions.findFirst({
          where: eq(executions.id, executionId),
        });

        if (updatedExecution?.endedAt) {
          res.write(
            "data: " +
              JSON.stringify({
                type: "execution_completed",
                status: updatedExecution.status,
                completedAt: updatedExecution.endedAt,
              }) +
              "\n\n",
          );
          clearInterval(pollInterval);
          clearInterval(keepAliveInterval);
          res.end();
        }
      } catch (error) {
        console.error("Error polling execution updates:", error);
        clearInterval(pollInterval);
        clearInterval(keepAliveInterval);
        res.end();
      }
    }, 1000); // Poll every 1 second

    // Handle client disconnect
    req.on("close", () => {
      clearInterval(pollInterval);
      clearInterval(keepAliveInterval);
      res.end();
    });

    req.on("error", () => {
      clearInterval(pollInterval);
      clearInterval(keepAliveInterval);
      res.end();
    });
  } catch (error) {
    console.error("Error opening stream:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to open stream" });
    } else {
      res.end();
    }
  }
});

export default router;
