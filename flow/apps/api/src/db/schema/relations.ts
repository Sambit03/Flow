import { relations } from "drizzle-orm";
import { profiles } from "./users";
import { workflows } from "./workflows";
import { nodes } from "./nodes";
import { edges } from "./edges";
import { executions } from "./executions";
import { stepLogs } from "./stepLogs";

export const profileRelations = relations(profiles, ({ many }) => ({
  workflows: many(workflows),
}));

export const workflowRelations = relations(workflows, ({ one, many }) => ({
  user: one(profiles, {
    fields: [workflows.userId],
    references: [profiles.id],
  }),
  nodes: many(nodes),
  edges: many(edges),
  executions: many(executions),
}));

export const nodeRelations = relations(nodes, ({ one }) => ({
  workflow: one(workflows, {
    fields: [nodes.workflowId],
    references: [workflows.id],
  }),
}));

export const edgeRelations = relations(edges, ({ one }) => ({
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

export const executionRelations = relations(executions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [executions.workflowId],
    references: [workflows.id],
  }),
  stepLogs: many(stepLogs),
}));

export const stepLogRelations = relations(stepLogs, ({ one }) => ({
  execution: one(executions, {
    fields: [stepLogs.executionId],
    references: [executions.id],
  }),
}));
