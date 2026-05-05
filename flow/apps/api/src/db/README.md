# Drizzle ORM Setup

This folder contains the Drizzle ORM schema and query helpers for Flow's database operations.

## Files

- **schema.ts** — Table definitions with relations
- **migrations/** — Generated SQL migrations
- **queries/workflows.ts** — Workflow CRUD queries
- **queries/executions.ts** — Execution and step log queries

## Quick Start

### Generate Migrations

When you update `schema.ts`, generate migrations:

```bash
npm run db:generate
```

This creates SQL files in `src/db/migrations/`.

### Apply Migrations

Run migrations against your database:

```bash
npm run db:migrate
```

Or for production:

```bash
DATABASE_URL=... npm run db:migrate
```

### Drizzle Studio (GUI)

View and edit your database in a browser UI:

```bash
npm run db:studio
```

Then visit `http://localhost:3000`

---

## Usage Examples

### Import and Use Queries

```typescript
// In a route handler
import { getWorkflowsByUser, updateWorkflowStatus } from "@/db/queries";

export async function getMyWorkflows(req: AuthenticatedRequest, res: Response) {
  const workflows = await getWorkflowsByUser(req.user!.id);
  res.json(workflows);
}
```

### Writing New Queries

Add queries to `queries/workflows.ts` or `queries/executions.ts`:

```typescript
import { eq } from "drizzle-orm";
import db from "../../lib/db";
import { workflows } from "../schema";

export async function getWorkflowsByStatus(userId: string, isActive: boolean) {
  return await db.query.workflows.findMany({
    where: and(eq(workflows.userId, userId), eq(workflows.isActive, isActive)),
  });
}
```

### Type Safety

All queries are fully typed. Drizzle infers types from your schema:

```typescript
// This is type-safe — workflow has all fields
const workflow = await getWorkflowById(id, userId);
//    ^ type: workflows | undefined (includes nodes, edges, etc.)
```

---

## Schema Structure

Tables and their relationships:

```
workflows (1) ──── (many) nodes
           (1) ──── (many) edges
           (1) ──── (many) executions

executions (1) ──── (many) step_logs

nodes (1) ──── (many) edges (as source)
       (1) ──── (many) edges (as target)
       (1) ──── (many) step_logs
```

## Features

✅ **Type-safe queries** — Full TypeScript support  
✅ **Relations** — Query with `.with()` for nested data  
✅ **Indexes** — All common queries are indexed  
✅ **Migrations** — Version controlled schema changes  
✅ **Lightweight** — No runtime overhead vs raw SQL

## Common Patterns

### Fetch with Relations

```typescript
const workflow = await db.query.workflows.findFirst({
  where: eq(workflows.id, workflowId),
  with: {
    nodes: true, // Include all nodes
    edges: true, // Include all edges
    executions: {
      limit: 10, // Limit related executions
      orderBy: desc(executions.startedAt),
    },
  },
});
```

### Insert with Returning

```typescript
const [newWorkflow] = await db
  .insert(workflows)
  .values({
    userId,
    name,
    description,
  })
  .returning();
```

### Batch Operations

```typescript
// Delete old data and insert new
await db.delete(nodes).where(eq(nodes.workflowId, id));
await db.insert(nodes).values(newNodesData);
```

## Troubleshooting

**Q: Migration fails**  
A: Check `DATABASE_URL` in `.env.local` and ensure database is running.

**Q: Type errors on queries**  
A: Run `npm run db:generate` after schema changes.

**Q: Need raw SQL?**  
A: Use `db.execute()` for direct SQL when Drizzle isn't expressive enough.

---

See [Drizzle Docs](https://orm.drizzle.team) for more.
