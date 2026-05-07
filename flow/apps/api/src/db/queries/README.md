# Database Queries

Common query patterns and helpers for the Flow database schema.

## Setup

All queries use the `db` instance from `db/index.ts`:

```typescript
import { db } from "@/db";
```

## Usage

Query helpers are organized by entity type:

- `workflows.ts` - Workflow-related queries
- `executions.ts` - Execution and step log queries

## Examples

### Load Workflow with Full Graph

```typescript
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { workflows } from "@/db/schema";

const workflow = await db.query.workflows.findFirst({
  where: (w, { eq, and, isNull }) =>
    and(eq(w.id, workflowId), eq(w.userId, userId), isNull(w.deletedAt)),
  with: {
    nodes: {
      where: (n, { isNull }) => isNull(n.deletedAt),
      orderBy: (n, { asc }) => [asc(n.orderIndex)],
    },
    edges: true,
  },
});
```

### Save Canvas (Transactional)

```typescript
import { db } from "@/db";
import { nodes, edges, workflows } from "@/db/schema";
import { eq } from "drizzle-orm";

await db.transaction(async (tx) => {
  // Delete existing
  await tx.delete(edges).where(eq(edges.workflowId, workflowId));
  await tx.delete(nodes).where(eq(nodes.workflowId, workflowId));

  // Insert new
  if (newNodes.length > 0) {
    await tx.insert(nodes).values(newNodes);
  }
  if (newEdges.length > 0) {
    await tx.insert(edges).values(newEdges);
  }

  // Update workflow
  await tx
    .update(workflows)
    .set({ updatedAt: new Date() })
    .where(eq(workflows.id, workflowId));
});
```

### Create Execution with Step Logs

```typescript
import { db } from "@/db";
import { executions, stepLogs } from "@/db/schema";

const [execution] = await db
  .insert(executions)
  .values({
    workflowId,
    status: "pending",
    trigger: "manual",
    triggerPayload: {},
    totalSteps: nodes.length,
  })
  .returning();

// Create pending step logs for all nodes
await db.insert(stepLogs).values(
  nodes.map((node) => ({
    executionId: execution.id,
    nodeId: node.id,
    nodeType: node.type,
    nodeLabel: node.label,
    status: "pending" as const,
  })),
);
```

### Fetch Run History

```typescript
import { db } from "@/db";
import { executions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const runs = await db
  .select({
    id: executions.id,
    status: executions.status,
    trigger: executions.trigger,
    totalSteps: executions.totalSteps,
    completedSteps: executions.completedSteps,
    startedAt: executions.startedAt,
    finishedAt: executions.finishedAt,
  })
  .from(executions)
  .where(eq(executions.workflowId, workflowId))
  .orderBy(desc(executions.startedAt))
  .limit(20);
```

## See Also

- [FLOW_SCHEMA.md](../FLOW_SCHEMA.md) - Full schema documentation
- [drizzle.config.ts](../../drizzle.config.ts) - Drizzle configuration
