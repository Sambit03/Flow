import { pgTable, uuid, text, index, unique } from "drizzle-orm/pg-core";
import { workflows } from "./workflows";
import { nodes } from "./nodes";

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

    // For condition nodes: 'true' | 'false' | null (for non-condition edges)
    // The worker reads this to know which path to take
    branch: text("branch"), // null | 'true' | 'false'
  },
  (table) => ({
    // Prevent duplicate edges on the same branch
    uniqueEdge: unique().on(table.sourceId, table.targetId, table.branch),

    // Resolve graph traversal during execution
    sourceIdIdx: index("idx_edges_source_id").on(table.sourceId),
    workflowIdIdx: index("idx_edges_workflow_id").on(table.workflowId),
  }),
);

export type Edge = typeof edges.$inferSelect;
export type NewEdge = typeof edges.$inferInsert;
