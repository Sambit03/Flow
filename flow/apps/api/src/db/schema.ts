import {
  pgTable,
  uuid,
  text,
  jsonb,
  boolean,
  timestamp,
  real,
  primaryKey,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Workflows Table ────────────────────────────────────
export const workflows = pgTable(
  "workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_workflows_user_id").on(table.userId),
    activeIdx: index("idx_workflows_active").on(table.isActive),
  }),
);

// ── Nodes Table ───────────────────────────────────────
export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // 'trigger' | 'action' | 'condition' | 'delay'
    label: text("label").notNull(),
    config: jsonb("config").default({}),
    positionX: real("position_x").default(0),
    positionY: real("position_y").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    workflowIdIdx: index("idx_nodes_workflow_id").on(table.workflowId),
  }),
);

// ── Edges Table ───────────────────────────────────────
export const edges = pgTable(
  "edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
  },
  (table) => ({
    workflowIdIdx: index("idx_edges_workflow_id").on(table.workflowId),
  }),
);

// ── Executions Table ──────────────────────────────────
export const executions = pgTable(
  "executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    status: text("status").default("pending"), // 'pending' | 'running' | 'success' | 'failed'
    trigger: text("trigger").notNull(), // 'webhook' | 'cron' | 'manual'
    startedAt: timestamp("started_at").defaultNow(),
    finishedAt: timestamp("finished_at"),
  },
  (table) => ({
    workflowIdIdx: index("idx_executions_workflow_id").on(table.workflowId),
    statusIdx: index("idx_executions_status").on(table.status),
    createdAtIdx: index("idx_executions_created_at").on(table.startedAt),
  }),
);

// ── Step Logs Table ───────────────────────────────────
export const stepLogs = pgTable(
  "step_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => executions.id, { onDelete: "cascade" }),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => nodes.id, { onDelete: "cascade" }),
    status: text("status").default("pending"), // 'pending' | 'running' | 'success' | 'failed'
    input: jsonb("input"),
    output: jsonb("output"),
    error: text("error"),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
  },
  (table) => ({
    executionIdIdx: index("idx_step_logs_execution_id").on(table.executionId),
    nodeIdIdx: index("idx_step_logs_node_id").on(table.nodeId),
    statusIdx: index("idx_step_logs_status").on(table.status),
  }),
);

// ── Relations ──────────────────────────────────────────
export const workflowsRelations = relations(workflows, ({ many }) => ({
  nodes: many(nodes),
  edges: many(edges),
  executions: many(executions),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [nodes.workflowId],
    references: [workflows.id],
  }),
  edgesFrom: many(edges), // edges where this is source
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  workflow: one(workflows, {
    fields: [edges.workflowId],
    references: [workflows.id],
  }),
  source: one(nodes, {
    fields: [edges.sourceId],
    references: [nodes.id],
  }),
  target: one(nodes, {
    fields: [edges.targetId],
    references: [nodes.id],
  }),
}));

export const executionsRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id],
  }),
  stepLogs: many(stepLogs),
}));

export const stepLogsRelations = relations(stepLogs, ({ one }) => ({
  execution: one(executions, {
    fields: [stepLogs.executionId],
    references: [executions.id],
  }),
  node: one(nodes, {
    fields: [stepLogs.nodeId],
    references: [nodes.id],
  }),
}));
