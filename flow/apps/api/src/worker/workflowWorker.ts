import { Worker, type Job } from "bullmq";
import { eq, and, asc, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { workflows, nodes, edges, executions, stepLogs } from "@/db/schema";
import { redis } from "@/queue";
import { executeNode } from "./executors";

export interface WorkflowJobData {
  executionId: string;
  workflowId: string;
  payload: Record<string, unknown>;
  trigger?: string;
}

async function processWorkflow(job: Job<WorkflowJobData>): Promise<void> {
  const { executionId, workflowId, payload } = job.data;

  // ── 1. Load workflow graph ────────────────────────────────────────────────
  // isNull(workflows.deletedAt) prevents jobs queued before a soft-delete
  // from executing after the user deletes the workflow.
  const workflow = await db.query.workflows.findFirst({
    where: and(eq(workflows.id, workflowId), isNull(workflows.deletedAt)),
    with: {
      nodes: {
        where: isNull(nodes.deletedAt),
        orderBy: [asc(nodes.orderIndex)],
      },
      edges: true,
    },
  });

  if (!workflow) {
    // Mark as failed rather than throwing — avoids BullMQ retrying a deleted workflow
    await db
      .update(executions)
      .set({ status: "failed", error: "Workflow not found or deleted", finishedAt: new Date() })
      .where(eq(executions.id, executionId));
    return;
  }

  // ── 2. Mark execution running ─────────────────────────────────────────────
  await db
    .update(executions)
    .set({ status: "running" })
    .where(eq(executions.id, executionId));

  // ── 3. Find trigger node ──────────────────────────────────────────────────
  const triggerNode = workflow.nodes.find((n) => n.type === "trigger");
  if (!triggerNode) {
    await db
      .update(executions)
      .set({ status: "failed", error: "No trigger node found", finishedAt: new Date() })
      .where(eq(executions.id, executionId));
    return;
  }

  // ── 4. Build adjacency map: sourceId → Edge[] ─────────────────────────────
  const adjacency = new Map<string, (typeof workflow.edges[number])[]>();
  for (const edge of workflow.edges) {
    const list = adjacency.get(edge.sourceId) ?? [];
    list.push(edge);
    adjacency.set(edge.sourceId, list);
  }

  // ── 5. BFS traversal ──────────────────────────────────────────────────────
  const queue: Array<{ nodeId: string; input: Record<string, unknown> }> = [
    { nodeId: triggerNode.id, input: payload ?? {} },
  ];

  let finalStatus: "success" | "failed" | "cancelled" = "success";
  let errorMsg: string | undefined;

  while (queue.length > 0) {
    const { nodeId, input } = queue.shift()!;
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    // Mark step running
    await db
      .update(stepLogs)
      .set({ status: "running", startedAt: new Date(), input })
      .where(
        and(
          eq(stepLogs.executionId, executionId),
          eq(stepLogs.nodeId, nodeId),
        ),
      );

    let output: unknown;
    try {
      output = await executeNode(node, input);

      // Mark step success
      await db
        .update(stepLogs)
        .set({ status: "success", finishedAt: new Date(), output })
        .where(
          and(
            eq(stepLogs.executionId, executionId),
            eq(stepLogs.nodeId, nodeId),
          ),
        );

      // Bump completedSteps counter
      await db
        .update(executions)
        .set({ completedSteps: sql`${executions.completedSteps} + 1` })
        .where(eq(executions.id, executionId));

      // Check for a cancellation signal written by the cancel endpoint
      const current = await db
        .select({ status: executions.status })
        .from(executions)
        .where(eq(executions.id, executionId))
        .then((rows) => rows[0]);

      if (current?.status === "cancelled") {
        await db
          .update(stepLogs)
          .set({ status: "skipped" })
          .where(
            and(
              eq(stepLogs.executionId, executionId),
              eq(stepLogs.status, "pending"),
            ),
          );
        finalStatus = "cancelled";
        break;
      }

      // Enqueue next nodes (respect condition branches)
      const outEdges = adjacency.get(nodeId) ?? [];
      for (const edge of outEdges) {
        if (node.type === "condition" && edge.branch !== null) {
          const branch = (output as Record<string, unknown>)?._branch;
          if (edge.branch !== branch) continue;
        }
        queue.push({
          nodeId: edge.targetId,
          input: output as Record<string, unknown>,
        });
      }
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);

      await db
        .update(stepLogs)
        .set({ status: "failed", finishedAt: new Date(), error: errorMsg })
        .where(
          and(
            eq(stepLogs.executionId, executionId),
            eq(stepLogs.nodeId, nodeId),
          ),
        );

      // Skip remaining pending steps (mark them skipped)
      await db
        .update(stepLogs)
        .set({ status: "skipped" })
        .where(
          and(
            eq(stepLogs.executionId, executionId),
            eq(stepLogs.status, "pending"),
          ),
        );

      finalStatus = "failed";
      break;
    }
  }

  // ── 6. Mark execution done ────────────────────────────────────────────────
  await db
    .update(executions)
    .set({
      status: finalStatus,
      finishedAt: new Date(),
      error: errorMsg ?? null,
    })
    .where(eq(executions.id, executionId));
}

// ── Worker instance (exported so index.ts can close it on shutdown) ───────────
export const workflowWorker = new Worker<WorkflowJobData>(
  "workflow-execution",
  processWorkflow,
  {
    connection: redis,
    concurrency: 5,
  },
);

workflowWorker.on("completed", (job) => {
  console.log(`✅ Execution job ${job.id} completed`);
});

workflowWorker.on("failed", (job, err) => {
  console.error(`❌ Execution job ${job?.id} failed:`, err.message);
});

workflowWorker.on("error", (err) => {
  console.error("Worker error:", err);
});
