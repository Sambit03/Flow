/**
 * Webhook Routes
 *
 * Public API endpoints for triggering workflows via webhooks:
 * - POST /api/webhooks/:workflowId - Public webhook trigger (validates x-flow-secret header)
 *
 * This endpoint is public (no JWT auth) but validates the webhook secret instead.
 * It allows external systems to trigger workflows without authentication.
 */

import { Router, Request, Response } from "express";
import { db } from "@/db";
import { workflows, executions, stepLogs } from "@/db/schema";
import { workflowQueue } from "@/queue";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * POST /api/webhooks/:workflowId
 * Public webhook endpoint - triggered by external systems
 *
 * Security:
 * - No JWT auth required
 * - Validates x-flow-secret header against workflow.webhook_secret
 * - Returns 401 if secret doesn't match
 * - Returns 202 Accepted to indicate async processing
 */
router.post("/:workflowId", async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const webhookSecret = req.headers["x-flow-secret"] as string;

    if (!workflowId) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    if (!webhookSecret) {
      return res.status(401).json({ error: "Webhook secret is required" });
    }

    // Fetch workflow without user auth (public endpoint)
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
      with: {
        nodes: true,
      },
    });

    if (!workflow) {
      // Don't leak that workflow doesn't exist - return 401
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    // Verify webhook secret matches
    if (workflow.webhookSecret !== webhookSecret) {
      return res.status(401).json({ error: "Invalid webhook secret" });
    }

    // Verify workflow is active
    if (!workflow.isActive) {
      return res
        .status(403)
        .json({ error: "Workflow is not active and cannot be triggered" });
    }

    const workflowNodes = workflow.nodes ?? [];

    // Create execution record
    const [execution] = await db
      .insert(executions)
      .values({
        workflowId,
        status: "pending",
        trigger: "webhook",
        triggerPayload: req.body || {},
        totalSteps: workflowNodes.length,
        completedSteps: 0,
      })
      .returning();

    if (!execution) {
      return res.status(500).json({ error: "Failed to create execution" });
    }

    // Create step logs for all nodes
    if (workflowNodes.length > 0) {
      await db.insert(stepLogs).values(
        workflowNodes.map((node) => ({
          executionId: execution.id,
          nodeId: node.id,
          nodeType: node.type,
          nodeLabel: node.label,
          status: "pending",
          attemptNumber: 1,
        })),
      );
    }

    // Queue the execution job
    await workflowQueue.add(`execution-${execution.id}`, {
      executionId: execution.id,
      workflowId,
      payload: req.body || {},
      trigger: "webhook",
    });

    // Return 202 Accepted (async processing)
    res.status(202).json({
      executionId: execution.id,
      message: "Webhook accepted and queued for processing",
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

export default router;
