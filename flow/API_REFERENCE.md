# Flow API Reference

Base URL: `http://localhost:5000`

All protected routes require `Authorization: Bearer <token>` header.

---

## Health

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| `GET` | `/health` | None | `{ status, service, timestamp, environment }` |

---

## Auth

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| `GET` | `/auth/me` | JWT | Current user profile — creates one on first visit |
| `PUT` | `/auth/me` | JWT | Updated profile |

**PUT `/auth/me` body:**
```json
{
  "username": "string",
  "avatarUrl": "string"
}
```

---

## Workflows

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| `GET` | `/api/workflows` | JWT | Array of all non-deleted workflows for the current user |
| `GET` | `/api/workflows/:id` | JWT | Workflow with nested `nodes` and `edges` |
| `POST` | `/api/workflows` | JWT | Newly created workflow |
| `PUT` | `/api/workflows/:id` | JWT | Updated workflow |
| `DELETE` | `/api/workflows/:id` | JWT | `{ message, workflow }` — soft delete |
| `POST` | `/api/workflows/:id/execute` | JWT | `{ execution, message }` — queues a manual execution |

**POST `/api/workflows` body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

**PUT `/api/workflows/:id` body:**
```json
{
  "name": "string",
  "description": "string",
  "isActive": true,
  "cronExpression": "0 * * * *"
}
```

**POST `/api/workflows/:id/execute` body:**
```json
{
  "payload": {}
}
```

---

## Nodes

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| `PUT` | `/api/workflows/:workflowId/nodes` | JWT | `{ message: "Nodes saved successfully" }` — transactional replace of all nodes |
| `POST` | `/api/workflows/:workflowId/nodes/:nodeId` | JWT | Updated node object |
| `DELETE` | `/api/workflows/:workflowId/nodes/:nodeId` | JWT | `{ message, node }` — soft delete |

**PUT `/api/workflows/:workflowId/nodes` body:**
```json
{
  "nodes": [
    {
      "id": "uuid",
      "type": "string",
      "label": "string",
      "config": {},
      "positionX": 0,
      "positionY": 0,
      "orderIndex": 0
    }
  ]
}
```

**POST `/api/workflows/:workflowId/nodes/:nodeId` body:**
```json
{
  "label": "string",
  "config": {},
  "positionX": 0,
  "positionY": 0
}
```

---

## Edges

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| `PUT` | `/api/workflows/:workflowId/edges` | JWT | `{ message: "Edges saved successfully" }` — replaces all edges |
| `DELETE` | `/api/workflows/:workflowId/edges/:edgeId` | JWT | `{ message, edge }` — hard delete |

**PUT `/api/workflows/:workflowId/edges` body:**
```json
{
  "edges": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "targetId": "uuid",
      "branch": "string or null"
    }
  ]
}
```

---

## Executions

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| `GET` | `/api/workflows/:workflowId/executions` | JWT | Array of last 50 executions, newest first |
| `GET` | `/api/workflows/:workflowId/executions/:executionId` | JWT | Execution with nested `stepLogs` array |
| `GET` | `/api/workflows/:workflowId/executions/:executionId/logs` | JWT | Step logs array ordered by `startedAt` |

**Step log object:**
```json
{
  "id": "uuid",
  "executionId": "uuid",
  "nodeId": "uuid",
  "nodeType": "string",
  "nodeLabel": "string",
  "status": "pending | running | success | failed | skipped",
  "attemptNumber": 1,
  "input": {},
  "output": {},
  "error": "string or null",
  "startedAt": "ISO 8601",
  "finishedAt": "ISO 8601"
}
```

---

## Streams (SSE)

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| `GET` | `/api/executions/:executionId/stream` | JWT | `text/event-stream` — real-time execution updates |

**Event types:**

```
data: { "type": "connected", "executionId": "uuid" }

data: { "type": "step_update", "stepLogId": "uuid", "nodeId": "uuid",
        "nodeLabel": "string", "status": "running", "output": {},
        "error": null, "startedAt": "ISO 8601", "finishedAt": null }

data: { "type": "execution_completed", "status": "success | failed",
        "finishedAt": "ISO 8601", "error": null }
```

Keep-alive comment sent every 30 seconds: `: keep-alive`

---

## Webhooks

| Method | Endpoint | Auth | Returns |
|--------|----------|------|---------|
| `POST` | `/api/webhooks/:workflowId` | Secret header | `{ executionId, message }` — 202 Accepted |

Requires header: `x-flow-secret: <workflow.webhookSecret>`

No JWT needed. Returns 401 if the secret is missing or wrong, 403 if the workflow is inactive.
