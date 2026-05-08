/**
 * Workflow Routes
 *
 * API endpoints for managing workflows:
 * - GET /api/workflows - List user's workflows
 * - GET /api/workflows/:id - Get specific workflow
 * - POST /api/workflows - Create new workflow
 * - PUT /api/workflows/:id - Update workflow
 * - DELETE /api/workflows/:id - Soft delete workflow
 * - POST /api/workflows/:id/execute - Trigger execution
 */

import { Router, Request, Response } from "express";
import { neonAuthMiddleware } from "@/auth/neon-auth";
import { isValidUUID } from "@/lib/validateUUID";
import { db } from "@/db";
import { workflows, nodes, edges, executions, stepLogs } from "@/db/schema";
import { workflowQueue } from "@/queue";
import { eq, and, isNull, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { syncWorkflowSchedule } from "@/scheduler";

const router = Router();

// All routes require authentication
router.use(neonAuthMiddleware);

/**
 * GET /api/workflows
 * List all workflows for the authenticated user (not deleted)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;

    const userWorkflows = await db
      .select()
      .from(workflows)
      .where(and(eq(workflows.userId, userId), isNull(workflows.deletedAt)))
      .orderBy(desc(workflows.createdAt));

    res.json(userWorkflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

/**
 * GET /api/workflows/:id
 * Get a specific workflow with its nodes and edges
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid workflow ID format" });
    }

    const workflow = await db.query.workflows.findFirst({
      where: and(
        eq(workflows.id, id),
        eq(workflows.userId, userId),
        isNull(workflows.deletedAt),
      ),
      with: {
        nodes: {
          where: isNull(nodes.deletedAt),
          orderBy: (n, { asc }) => [asc(n.orderIndex)],
        },
        edges: true,
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    res.status(500).json({ error: "Failed to fetch workflow" });
  }
});

/**
 * POST /api/workflows
 * Create a new workflow
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Workflow name is required" });
    }

    const webhookSecret = `whsec_${uuidv4()}`;

    const [newWorkflow] = await db
      .insert(workflows)
      .values({
        userId,
        name,
        description: description || null,
        isActive: false,
        webhookSecret,
        cronExpression: null,
      })
      .returning();

    res.status(201).json(newWorkflow);
  } catch (error) {
    console.error("Error creating workflow:", error);
    res.status(500).json({ error: "Failed to create workflow" });
  }
});

/**
 * PUT /api/workflows/:id
 * Update a workflow
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const { name, description, isActive, cronExpression } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid workflow ID format" });
    }

    // Check ownership
    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, id), eq(workflows.userId, userId)),
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const [updated] = await db
      .update(workflows)
      .set({
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        cronExpression:
          cronExpression !== undefined ? cronExpression : undefined,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, id))
      .returning();

    // Sync the in-memory cron scheduler whenever isActive changes
    if (isActive !== undefined && updated) {
      syncWorkflowSchedule(id, updated.isActive, updated.cronExpression);
    }

    res.json(updated);
  } catch (error) {
    console.error("Error updating workflow:", error);
    res.status(500).json({ error: "Failed to update workflow" });
  }
});

/**
 * DELETE /api/workflows/:id
 * Soft delete a workflow
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid workflow ID format" });
    }

    // Check ownership
    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, id), eq(workflows.userId, userId)),
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const [deleted] = await db
      .update(workflows)
      .set({ deletedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();

    res.json({ message: "Workflow deleted", workflow: deleted });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    res.status(500).json({ error: "Failed to delete workflow" });
  }
});

/**
 * POST /api/workflows/:id/execute
 * Trigger a workflow execution (manual trigger)
 */
router.post("/:id/execute", async (req: Request, res: Response) => {
  try {
    const { userId } = (req as any).user;
    const { id } = req.params;
    const { payload } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Workflow ID is required" });
    }

    if (!isValidUUID(id)) {
      return res.status(400).json({ error: "Invalid workflow ID format" });
    }

    // Check workflow exists and belongs to user
    const workflow = await db.query.workflows.findFirst({
      where: and(eq(workflows.id, id), eq(workflows.userId, userId)),
      with: {
        nodes: true,
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    if (!workflow.isActive) {
      return res.status(400).json({ error: "Workflow is not active" });
    }

    // Create execution record
    const [execution] = await db
      .insert(executions)
      .values({
        workflowId: id,
        status: "pending",
        trigger: "manual",
        triggerPayload: payload || {},
        totalSteps: workflow.nodes.length,
        completedSteps: 0,
      })
      .returning();

    if (!execution) {
      return res.status(500).json({ error: "Failed to create execution" });
    }

    // Create step logs for all nodes (guard: values([]) throws in Postgres)
    if (workflow.nodes.length > 0) {
      await db.insert(stepLogs).values(
        workflow.nodes.map((node) => ({
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
      workflowId: id,
      payload: payload || {},
    });

    res
      .status(201)
      .json({ execution, message: "Execution started and queued" });
  } catch (error) {
    console.error("Error executing workflow:", error);
    res.status(500).json({ error: "Failed to execute workflow" });
  }
});

export default router;
