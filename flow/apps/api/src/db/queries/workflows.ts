import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import db from "../../lib/db";
import { workflows, nodes, edges, executions, stepLogs } from "../schema";

// ── Workflow Queries ───────────────────────────────────

export async function getWorkflowsByUser(userId: string) {
  return await db.query.workflows.findMany({
    where: eq(workflows.userId, userId),
    with: {
      nodes: true,
      edges: true,
    },
  });
}

export async function getWorkflowById(workflowId: string, userId: string) {
  return await db.query.workflows.findFirst({
    where: and(eq(workflows.id, workflowId), eq(workflows.userId, userId)),
    with: {
      nodes: true,
      edges: true,
      executions: {
        limit: 10,
        orderBy: (e) => [e.startedAt],
      },
    },
  });
}

export async function createWorkflow(
  userId: string,
  name: string,
  description?: string,
) {
  const webhookSecret = `whsec_${uuidv4()}`;
  return await db
    .insert(workflows)
    .values({
      userId,
      name,
      description,
      webhookSecret,
      isActive: false,
    })
    .returning();
}

export async function updateWorkflow(
  workflowId: string,
  userId: string,
  data: Partial<typeof workflows.$inferInsert>,
) {
  return await db
    .update(workflows)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
    .returning();
}

export async function deleteWorkflow(workflowId: string, userId: string) {
  return await db
    .delete(workflows)
    .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
    .returning();
}

export async function toggleWorkflowActive(
  workflowId: string,
  userId: string,
  isActive: boolean,
) {
  return await db
    .update(workflows)
    .set({ isActive })
    .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
    .returning();
}

// ── Canvas Save (Nodes + Edges) ────────────────────────

export async function saveCanvas(
  workflowId: string,
  userId: string,
  nodesData: (typeof nodes.$inferInsert)[],
  edgesData: (typeof edges.$inferInsert)[],
) {
  // Delete existing nodes and edges (cascades to step_logs)
  await db.delete(nodes).where(eq(nodes.workflowId, workflowId));
  await db.delete(edges).where(eq(edges.workflowId, workflowId));

  // Insert new nodes
  if (nodesData.length > 0) {
    await db.insert(nodes).values(nodesData);
  }

  // Insert new edges
  if (edgesData.length > 0) {
    await db.insert(edges).values(edgesData);
  }

  // Update workflow updated_at
  await db
    .update(workflows)
    .set({ updatedAt: new Date() })
    .where(eq(workflows.id, workflowId));

  return true;
}
