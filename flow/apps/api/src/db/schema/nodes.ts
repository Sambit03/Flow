import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { workflows } from "./workflows";

// All valid node types — enforced at app level, stored as text for flexibility
export type NodeType = "trigger" | "action" | "condition" | "delay";
export type TriggerSub = "webhook" | "cron" | "manual";
export type ActionSub = "http_request" | "transform" | "log" | "notify";

// Config shape per node type (for TypeScript — not enforced in DB)
export interface TriggerConfig {
  subtype: TriggerSub;
  // webhook
  method?: "GET" | "POST" | "PUT" | "DELETE";
  // cron
  expression?: string; // e.g. "0 9 * * 1-5"
  timezone?: string; // e.g. "Asia/Kolkata"
}

export interface HttpActionConfig {
  subtype: "http_request";
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: string; // template string, supports {{input.field}} interpolation
  timeoutMs?: number; // default: 10000
}

export interface TransformConfig {
  subtype: "transform";
  expression: string; // e.g. "{ name: input.firstName + ' ' + input.lastName }"
}

export interface ConditionConfig {
  subtype?: string;
  field: string; // dot-path e.g. "input.status"
  operator: "eq" | "neq" | "gt" | "lt" | "contains" | "exists";
  value: string | number | boolean;
}

export interface DelayConfig {
  subtype?: string;
  durationMs: number; // max: 86400000 (24h)
}

export interface NotifyEmailConfig {
  subtype: "notify";
  channel: "email";
  to: string;
  subject: string;
  body: string;
}

export interface NotifySlackConfig {
  subtype: "notify";
  channel: "slack";
  webhookUrl: string;
  message: string;
  emoji?: string;
}

export type NotifyConfig = NotifyEmailConfig | NotifySlackConfig;

export type NodeConfig =
  | TriggerConfig
  | HttpActionConfig
  | TransformConfig
  | ConditionConfig
  | DelayConfig
  | NotifyConfig;

export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),

    type: text("type").notNull(), // NodeType
    label: text("label").notNull(),

    // Config varies by node type — see typed interfaces above
    config: jsonb("config").notNull().default({}),

    // Canvas coordinates — required for React Flow to render correctly
    positionX: real("position_x").notNull().default(0),
    positionY: real("position_y").notNull().default(0),

    // Execution order within the workflow (0-based, set on canvas save)
    // Used by the worker to traverse in the right order
    orderIndex: integer("order_index").notNull().default(0),

    // Soft delete — preserves step_logs references
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Nodes: load all nodes for a workflow canvas
    workflowIdIdx: index("idx_nodes_workflow_id").on(table.workflowId),
  }),
);

export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
