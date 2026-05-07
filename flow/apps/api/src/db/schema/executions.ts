import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

export type ExecutionStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "timed_out"
  | "cancelled";
export type TriggerType = "webhook" | "cron" | "manual";

export const executions = pgTable(
  "executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),

    status: text("status").notNull().default("pending"), // ExecutionStatus
    trigger: text("trigger").notNull(), // TriggerType

    // The raw payload that triggered this execution
    // For webhook: the request body
    // For cron/manual: {}
    triggerPayload: jsonb("trigger_payload").default({}),

    // Total steps in this execution (set when execution starts)
    // Used for progress calculation without counting step_logs
    totalSteps: integer("total_steps").default(0),
    completedSteps: integer("completed_steps").default(0),

    // Error captured at execution level (e.g. workflow misconfigured)
    error: text("error"),

    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => ({
    // Run history for a workflow
    workflowIdStartedIdx: index("idx_executions_workflow_id_started").on(
      table.workflowId,
      table.startedAt,
    ),

    // Find stuck running executions for cleanup
    statusStartedIdx: index("idx_executions_status_started").on(
      table.status,
      table.startedAt,
    ),
  }),
);

export type Execution = typeof executions.$inferSelect;
export type NewExecution = typeof executions.$inferInsert;
