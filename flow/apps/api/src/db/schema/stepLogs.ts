import {
  pgTable,
  uuid,
  text,
  jsonb,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { executions } from "./executions";

export type StepStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export const stepLogs = pgTable(
  "step_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),

    // Intentionally NOT a foreign key — node may be deleted after execution
    // but we still want the log. Store as uuid text reference only.
    nodeId: uuid("node_id").notNull(),
    nodeType: text("node_type").notNull(), // snapshot of node.type at time of execution
    nodeLabel: text("node_label").notNull(), // snapshot of node.label at time of execution

    status: text("status").notNull().default("pending"), // StepStatus

    // Which attempt this is (1 = first try, 2 = first retry, etc.)
    attemptNumber: integer("attempt_number").notNull().default(1),

    // The data passed INTO this step (output of previous step)
    input: jsonb("input").default({}),

    // The data this step produced (passed to next step)
    output: jsonb("output"),

    // Error message if status = 'failed'
    error: text("error"),

    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => ({
    // Prevent duplicate log rows for the same step attempt
    uniqueStepAttempt: unique().on(
      table.executionId,
      table.nodeId,
      table.attemptNumber,
    ),

    // Load all steps for an execution detail page
    executionIdIdx: index("idx_step_logs_execution_id").on(table.executionId),
  }),
);

export type StepLog = typeof stepLogs.$inferSelect;
export type NewStepLog = typeof stepLogs.$inferInsert;
