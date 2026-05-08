/**
 * Nodes Routes
 *
 * API endpoints for managing workflow nodes:
 * - PUT /api/workflows/:workflowId/nodes - Save all nodes (canvas save)
 * - POST /api/workflows/:workflowId/nodes/:nodeId - Update single node
 * - DELETE /api/workflows/:workflowId/nodes/:nodeId - Soft delete node
 */

import { Router, Request, Response } from "express";
import { neonAuthMiddleware } from "@/auth/neon-auth";
import { isValidUUID } from "@/lib/validateUUID";
import { db } from "@/db";
import { workflows, nodes, edges } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { syncWorkflowSchedule } from "@/scheduler";

const router = Router();

// All routes require authentication
router.use(neonAuthMiddleware);

/**
 * PUT /api/workflows/:workflowId/nodes
 * Save all nodes for a workflow (transactional canvas save)
 */
router.put("/:workflowId/nodes", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { workflowId } = req.params;
    const { nodes: newNodes } = req.body;

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

    // Extract cron expression from trigger node (if any) to keep workflow row in sync
    const cronExpression: string | null =
      Array.isArray(newNodes)
        ? (newNodes.find(
            (n: any) =>
              n.type === "trigger" &&
              n.config?.subtype === "cron" &&
              n.config?.expression,
          )?.config?.expression ?? null)
        : null;

    // Transactional replace: delete old nodes → insert new nodes
    await db.transaction(async (tx) => {
      // Delete existing nodes and edges
      await tx.delete(edges).where(eq(edges.workflowId, workflowId));
      await tx.delete(nodes).where(eq(nodes.workflowId, workflowId));

      // Insert new nodes
      if (newNodes && newNodes.length > 0) {
        await tx.insert(nodes).values(
          newNodes.map((node: any) => ({
            id: node.id || uuidv4(),
            workflowId,
            type: node.type,
            label: node.label,
            config: node.config || {},
            positionX: node.positionX || 0,
            positionY: node.positionY || 0,
            orderIndex: node.orderIndex || 0,
          })),
        );
      }

      // Keep cronExpression on the workflow row in sync with the trigger node config
      await tx
        .update(workflows)
        .set({ cronExpression, updatedAt: new Date() })
        .where(eq(workflows.id, workflowId));
    });

    // Re-evaluate the cron schedule in memory
    syncWorkflowSchedule(workflowId, workflow.isActive, cronExpression);

    res.json({ message: "Nodes saved successfully" });
  } catch (error) {
    console.error("Error saving nodes:", error);
    res.status(500).json({ error: "Failed to save nodes" });
  }
});

/**
 * POST /api/workflows/:workflowId/nodes/:nodeId
 * Update a single node
 */
router.post(
  "/:workflowId/nodes/:nodeId",
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { workflowId, nodeId } = req.params;
      const { label, config, positionX, positionY } = req.body;

      if (!workflowId || !nodeId) {
        return res
          .status(400)
          .json({ error: "Workflow ID and Node ID are required" });
      }

      if (!isValidUUID(workflowId)) {
        return res.status(400).json({ error: "Invalid workflow ID format" });
      }

      if (!isValidUUID(nodeId)) {
        return res.status(400).json({ error: "Invalid node ID format" });
      }

      // Verify workflow ownership
      const workflow = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const [updated] = await db
        .update(nodes)
        .set({
          label: label || undefined,
          config: config || undefined,
          positionX: positionX !== undefined ? positionX : undefined,
          positionY: positionY !== undefined ? positionY : undefined,
        })
        .where(and(eq(nodes.id, nodeId), eq(nodes.workflowId, workflowId)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Node not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating node:", error);
      res.status(500).json({ error: "Failed to update node" });
    }
  },
);

/**
 * DELETE /api/workflows/:workflowId/nodes/:nodeId
 * Soft delete a node
 */
router.delete(
  "/:workflowId/nodes/:nodeId",
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { workflowId, nodeId } = req.params;

      if (!workflowId || !nodeId) {
        return res
          .status(400)
          .json({ error: "Workflow ID and Node ID are required" });
      }

      if (!isValidUUID(workflowId)) {
        return res.status(400).json({ error: "Invalid workflow ID format" });
      }

      if (!isValidUUID(nodeId)) {
        return res.status(400).json({ error: "Invalid node ID format" });
      }

      // Verify workflow ownership
      const workflow = await db.query.workflows.findFirst({
        where: and(
          eq(workflows.id, workflowId),
          eq(workflows.userId, userId),
          isNull(workflows.deletedAt),
        ),
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const [deleted] = await db
        .update(nodes)
        .set({ deletedAt: new Date() })
        .where(and(eq(nodes.id, nodeId), eq(nodes.workflowId, workflowId)))
        .returning();

      if (!deleted) {
        return res.status(404).json({ error: "Node not found" });
      }

      res.json({ message: "Node deleted", node: deleted });
    } catch (error) {
      console.error("Error deleting node:", error);
      res.status(500).json({ error: "Failed to delete node" });
    }
  },
);

export default router;
