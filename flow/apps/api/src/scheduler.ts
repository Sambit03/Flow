import * as cron from "node-cron";
import type { ScheduledTask } from "node-cron";
import { eq, and, isNull, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { workflows, nodes, executions, stepLogs } from "@/db/schema";
import { workflowQueue } from "@/queue";

// ── Internal job registry ────────────────────────────────────────────────────

const scheduledJobs = new Map<string, ScheduledTask>();

// ── Trigger a workflow via cron ──────────────────────────────────────────────

async function triggerCron(workflowId: string): Promise<void> {
  const workflow = await db.query.workflows.findFirst({
    where: and(eq(workflows.id, workflowId), isNull(workflows.deletedAt)),
    with: { nodes: { where: isNull(nodes.deletedAt) } },
  });

  if (!workflow?.isActive) return;

  const workflowNodes = workflow.nodes ?? [];

  const [execution] = await db
    .insert(executions)
    .values({
      workflowId,
      status: "pending",
      trigger: "cron",
      triggerPayload: {},
      totalSteps: workflowNodes.length,
      completedSteps: 0,
    })
    .returning();

  if (!execution) return;

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

  await workflowQueue.add(`execution-${execution.id}`, {
    executionId: execution.id,
    workflowId,
    payload: {},
    trigger: "cron",
  });

  console.log(
    `[Scheduler] Triggered cron execution ${execution.id} for workflow ${workflowId}`,
  );
}

// ── Public API ───────────────────────────────────────────────────────────────

export function scheduleWorkflow(
  workflowId: string,
  expression: string,
): void {
  // Cancel any existing job for this workflow before (re-)scheduling
  cancelWorkflow(workflowId);

  if (!cron.validate(expression)) {
    console.warn(
      `[Scheduler] Invalid cron expression "${expression}" for workflow ${workflowId} — skipping`,
    );
    return;
  }

  const task = cron.schedule(expression, async () => {
    try {
      await triggerCron(workflowId);
    } catch (err) {
      console.error(
        `[Scheduler] Error triggering workflow ${workflowId}:`,
        err,
      );
    }
  });

  scheduledJobs.set(workflowId, task);
  console.log(
    `[Scheduler] Scheduled workflow ${workflowId}  expression="${expression}"`,
  );
}

export function cancelWorkflow(workflowId: string): void {
  const task = scheduledJobs.get(workflowId);
  if (task) {
    task.stop();
    scheduledJobs.delete(workflowId);
    console.log(`[Scheduler] Cancelled cron for workflow ${workflowId}`);
  }
}

/** Called whenever a workflow's isActive or cronExpression changes. */
export function syncWorkflowSchedule(
  workflowId: string,
  isActive: boolean,
  cronExpression: string | null | undefined,
): void {
  if (isActive && cronExpression) {
    scheduleWorkflow(workflowId, cronExpression);
  } else {
    cancelWorkflow(workflowId);
  }
}

/**
 * Mark any execution that has been stuck in "running" for more than 30 minutes
 * as failed. This handles the case where the worker process crashed mid-execution
 * and left the execution record in a terminal-less state.
 */
async function cleanStaleExecutions(): Promise<void> {
  const staleThreshold = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago
  const result = await db
    .update(executions)
    .set({ status: "failed", error: "Execution timed out (worker restart)", finishedAt: new Date() })
    .where(
      and(
        eq(executions.status, "running"),
        lt(executions.startedAt, staleThreshold),
      ),
    )
    .returning({ id: executions.id });

  if (result.length > 0) {
    console.log(`[Scheduler] Marked ${result.length} stale execution(s) as failed`);
  }
}

/** Load all active cron workflows from DB and schedule them. Call once on startup. */
export async function startScheduler(): Promise<void> {
  console.log("[Scheduler] Starting…");

  await cleanStaleExecutions();

  const activeWorkflows = await db.query.workflows.findMany({
    where: and(
      eq(workflows.isActive, true),
      isNotNull(workflows.cronExpression),
      isNull(workflows.deletedAt),
    ),
  });

  let scheduled = 0;
  for (const wf of activeWorkflows) {
    if (wf.cronExpression) {
      scheduleWorkflow(wf.id, wf.cronExpression);
      scheduled++;
    }
  }

  console.log(`[Scheduler] ${scheduled} cron job(s) running`);
}
