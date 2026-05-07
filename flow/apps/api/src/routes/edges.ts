/**
 * Edges Routes
 *
 * API endpoints for managing workflow edges (connections):
 * - PUT /api/workflows/:workflowId/edges - Save all edges
 * - DELETE /api/workflows/:workflowId/edges/:edgeId - Delete edge
 */

import { Router, Request, Response } from "express";
import { neonAuthMiddleware } from "@/auth/neon-auth";
import { isValidUUID } from "@/lib/validateUUID";
import { db } from "@/db";
import { workflows, edges } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// All routes require authentication
router.use(neonAuthMiddleware);

/**
 * PUT /api/workflows/:workflowId/edges
 * Save all edges for a workflow
 */
router.put("/:workflowId/edges", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { workflowId } = req.params;
    const { edges: newEdges } = req.body;

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

    // Delete and replace edges
    await db.delete(edges).where(eq(edges.workflowId, workflowId));
    if (newEdges && newEdges.length > 0) {
      await db.insert(edges).values(
        newEdges.map((edge: any) => ({
          id: edge.id || uuidv4(),
          workflowId: workflowId,
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          branch: edge.branch || null,
        })),
      );
    }

    res.json({ message: "Edges saved successfully" });
  } catch (error) {
    console.error("Error saving edges:", error);
    res.status(500).json({ error: "Failed to save edges" });
  }
});

/**
 * DELETE /api/workflows/:workflowId/edges/:edgeId
 * Delete a specific edge
 */
router.delete(
  "/:workflowId/edges/:edgeId",
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { workflowId, edgeId } = req.params;

      if (!workflowId || !edgeId) {
        return res
          .status(400)
          .json({ error: "Workflow ID and Edge ID are required" });
      }

      if (!isValidUUID(workflowId)) {
        return res.status(400).json({ error: "Invalid workflow ID format" });
      }

      if (!isValidUUID(edgeId)) {
        return res.status(400).json({ error: "Invalid edge ID format" });
      }

      // Verify workflow ownership
      const workflow = await db.query.workflows.findFirst({
        where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
      });

      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const result = await db
        .delete(edges)
        .where(and(eq(edges.id, edgeId), eq(edges.workflowId, workflowId)))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: "Edge not found" });
      }

      res.json({ message: "Edge deleted", edge: result[0] });
    } catch (error) {
      console.error("Error deleting edge:", error);
      res.status(500).json({ error: "Failed to delete edge" });
    }
  },
);

export default router;
