# Flow

**Flow** is a visual workflow automation platform — think n8n or Zapier, built from scratch. It lets users design multi-step automated workflows on a drag-and-drop canvas, trigger them via webhooks or cron schedules, and watch each node execute in real time. Built as a full-stack capstone project to demonstrate end-to-end product engineering: monorepo architecture, async job processing, live streaming, and a polished Bloomberg Terminal–inspired UI.

---

## Features

- **Visual Workflow Canvas** — Drag-and-drop node-based editor powered by ReactFlow. Add trigger, action, condition, and delay nodes; connect them with edges to define execution order.
- **JWT Authentication** — Secure sign-up and login via Neon Auth. Tokens are validated on every protected API route through middleware; user sessions persist in Zustand.
- **Real-Time Execution Updates** — Server-Sent Events (SSE) stream per-node status changes (`pending → running → success/failed`) live to the canvas as a workflow executes, with color-coded status rings on each node.
- **Async Job Queue** — Workflow execution is offloaded to a BullMQ worker backed by Redis. HTTP responses return immediately with an execution ID; the heavy lifting happens out-of-band at concurrency 5.
- **Cron & Webhook Triggers** — Workflows support manual triggers, scheduled cron expressions, and inbound webhook endpoints with per-workflow secrets.
- **Execution History & Logs** — Full audit trail per run: step-level input/output JSON, error messages, duration, attempt count, and overall status with a visual timeline.
- **Dashboard Overview** — Stats row (total workflows, active count, recent runs, success rate), workflow grid with status badges and run history dots, and a recent runs table.
- **Soft Delete & Data Safety** — Workflows and nodes use `deletedAt` soft-delete columns; no data is permanently destroyed on user action.
- **Row-Level Security** — Postgres RLS policies enforce that users can only query their own workflows, executions, and logs.
- **Rate Limiting** — API-level rate limiting (configurable window + max requests) protects all routes.
- **Shared TypeScript Types** — A `@flow/types` package shared across the monorepo ensures compile-time consistency between frontend and backend contracts.
- **Responsive UI** — Dark-mode-first design using IBM Plex Mono/Sans, CSS custom properties, and Tailwind — consistent across viewport sizes.

---

## Tech Stack

### Frontend
| Technology | Version | Why |
|---|---|---|
| **Next.js** (App Router) | 16.2.4 | File-system routing, React Server Components, and layout nesting — ideal for a multi-page SPA with shared shell components |
| **React** | 18.2.0 | Component model; concurrent features (transitions, Suspense) for smooth UI during async data fetches |
| **ReactFlow** | 11.10.0 | Purpose-built for node-graph editors — handles canvas panning, zoom, edge routing, and drag-and-drop out of the box |
| **Tailwind CSS** | 3.4.0 | Utility-first styling with a custom design token layer; pairs well with CSS variables for a themeable dark UI |
| **IBM Plex Mono / Sans** | — | Monospace display font for a terminal-inspired aesthetic; sans-serif for body readability |

### Backend
| Technology | Version | Why |
|---|---|---|
| **Express.js** | 4.18 | Minimal, well-understood HTTP framework; easy to layer middleware (auth, rate limiting, CORS) without opinion lock-in |
| **TypeScript** | 5.9.2 | Catches contract mismatches between routes and DB queries at build time rather than runtime |
| **Vitest + Supertest** | 4.1.5 | Fast unit/integration test runner; Supertest spins up the Express app in-process so tests hit real route handlers |

### Database
| Technology | Version | Why |
|---|---|---|
| **PostgreSQL** | 16 | ACID-compliant relational DB; JSONB columns for flexible `config`, `triggerPayload`, `input`/`output` on execution logs |
| **Neon** (cloud) | — | Serverless Postgres with connection pooling — no server to manage; branches for safe schema testing |
| **Drizzle ORM** | 0.45.2 | Type-safe query builder that generates plain SQL — no magic, easy to debug, great TypeScript inference without a code-gen step |

### Authentication
| Technology | Why |
|---|---|
| **Neon Auth (JWT)** | Serverless JWT issuer integrated with Neon Postgres — zero extra auth service to run; tokens validated via `neonAuthMiddleware` on every protected route |
| **Better Auth (client)** | Client-side auth helper for sign-up/login flows; integrates with Next.js API routes |

### Queue / Workers
| Technology | Version | Why |
|---|---|---|
| **BullMQ** | 5.0.0 | Robust Redis-backed job queue with retries, concurrency control, and job lifecycle events — critical for keeping HTTP responses fast while workflows execute asynchronously |
| **Redis** (ioredis) | 7 | In-memory data store for BullMQ backing; also ideal for session state and pub/sub if extended |

### State Management
| Technology | Version | Why |
|---|---|---|
| **Zustand** | 4.4.0 | Minimal boilerplate compared to Redux; slice-based stores (`useAuthStore`, `useCanvasStore`) with `localStorage` persistence for auth tokens; reactive enough for canvas node-status updates |

### Deployment / Infrastructure
| Technology | Why |
|---|---|
| **Docker Compose** | Local Postgres 16 + Redis 7 containers — single `docker-compose up` spins up the full local infrastructure |
| **Turborepo** | Monorepo build orchestrator with task graph caching — `turbo dev` runs all apps in dependency order; incremental builds skip unchanged packages |

### Dev Tools
| Technology | Why |
|---|---|
| **npm workspaces** | Native monorepo package linking — `@flow/types` is available to both `apps/web` and `apps/api` without publishing |
| **ESLint + Prettier** | Shared configs in `packages/eslint-config` enforce consistent style across the repo |
| **`@repo/typescript-config`** | Base `tsconfig.json` extended per-app so strict settings stay uniform |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth Store │  │ Canvas Store │  │  lib/api.ts       │  │
│  │  (Zustand)  │  │  (Zustand)   │  │  fetch wrapper    │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                │                   │             │
│         └────────────────┴───────────────────┘             │
│                          │  Bearer JWT                      │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP + SSE
┌──────────────────────────▼──────────────────────────────────┐
│                    Express API  (:5000)                      │
│  ┌────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ neonAuthMiddle │  │   Route Handlers │  │  streams.ts  │  │
│  │ware (JWT check)│  │ workflows/nodes/ │  │  (SSE /sse)  │  │
│  └────────────────┘  │ edges/executions │  └──────┬───────┘  │
│                      │ auth/webhooks    │         │          │
│                      └────────┬─────────┘         │          │
│                               │                   │          │
│                      ┌────────▼─────────┐         │          │
│                      │   Drizzle ORM    │         │          │
│                      └────────┬─────────┘         │          │
└───────────────────────────────┼───────────────────┼──────────┘
                                │                   │
              ┌─────────────────▼──┐   ┌────────────▼──────────┐
              │  PostgreSQL (Neon) │   │        Redis           │
              │  users / workflows │   │  BullMQ queue backing  │
              │  nodes / edges     │   │  + SSE event bus       │
              │  executions / logs │   └────────────┬───────────┘
              └────────────────────┘                │
                                         ┌──────────▼──────────┐
                                         │   BullMQ Worker      │
                                         │  workflowWorker.ts   │
                                         │  concurrency: 5      │
                                         │  executors.ts        │
                                         │  (node-by-node run)  │
                                         └─────────────────────┘
```

### Frontend Flow
1. User opens the app → `AuthProvider` checks `localStorage` for a token → populates `useAuthStore`.
2. All data fetches go through `lib/api.ts`, a namespaced `fetch` wrapper that auto-injects the `Authorization: Bearer <token>` header.
3. Canvas state (nodes, edges, selected node, execution status per node) lives in `useCanvasStore` — components subscribe to only the slices they need, avoiding unnecessary re-renders.
4. When a workflow executes, `useExecutionStream` opens an SSE connection to `/api/streams/:executionId` and calls `setNodeStatus()` on each event, updating status rings in real time.

### Backend Flow
1. Every request hits `neonAuthMiddleware` first — it validates the JWT and attaches the `userId` to `req`.
2. Route handlers call Drizzle query helpers (`src/db/queries/`) that enforce `userId` equality in every `WHERE` clause — data isolation without RLS alone.
3. `POST /api/workflows/:id/execute` enqueues a BullMQ job and returns `{ executionId }` immediately — the HTTP response completes in milliseconds.

### Queue & Async Execution
1. The BullMQ worker (`workflowWorker.ts`) picks up jobs, loads the workflow's nodes and edges from Postgres, and walks them in topological order.
2. `executors.ts` contains per-node-type execution logic (HTTP request, delay, condition branch, etc.).
3. After each node, the worker writes a `stepLog` record and emits a status event over Redis pub/sub, which `streams.ts` fans out as an SSE message to any connected browser.

### Authentication Flow
```
Client                     Next.js API Route           Neon Auth
  │── POST /api/auth/login ──►│                             │
  │                           │── verify credentials ──────►│
  │                           │◄── JWT token ───────────────│
  │◄── { token, user } ───────│                             │
  │                           │                             │
  │── GET /api/workflows ─────────────────────────────►Express
  │   Authorization: Bearer <token>                         │
  │                                              neonAuthMiddleware
  │                                              validates JWT locally
  │◄── 200 { workflows: [...] } ────────────────────────────│
```

---

## Folder Structure

```bash
flow/                              # Turborepo monorepo root
├── apps/
│   ├── web/                       # Next.js 16 frontend (port 3000)
│   │   ├── app/
│   │   │   ├── (marketing)/       # Public marketing + docs pages
│   │   │   │   └── docs/
│   │   │   ├── api/auth/          # Next.js API route — Neon Auth handler
│   │   │   ├── dashboard/         # /dashboard — stats, workflow grid
│   │   │   ├── login/             # /login
│   │   │   ├── signup/            # /signup
│   │   │   ├── settings/          # /settings — profile management
│   │   │   └── workflows/
│   │   │       └── [id]/          # /workflows/:id — canvas editor
│   │   │           └── runs/      # /workflows/:id/runs — execution history
│   │   ├── components/
│   │   │   ├── canvas/            # LiveRunPanel (SSE drawer), ConsolePanel
│   │   │   ├── dashboard/         # StatsRow, WorkflowCard, RecentRunsTable, CreateWorkflowModal
│   │   │   ├── layout/            # AppShell, Sidebar, Topbar
│   │   │   ├── marketing/         # MarketingNav
│   │   │   ├── nodes/             # FlowNodes (custom ReactFlow node shell)
│   │   │   ├── NodeSidebar/       # Config panel for selected node
│   │   │   ├── ui/                # Badge, Button, Modal, StatusDot, Toast, Tooltip
│   │   │   └── AuthProvider.tsx   # Client-side auth bootstrap
│   │   ├── hooks/
│   │   │   └── useExecutionStream.ts  # SSE hook → drives canvas status rings
│   │   ├── lib/
│   │   │   ├── api.ts             # Namespaced fetch client (auth/workflows/executions)
│   │   │   └── auth/
│   │   │       ├── client.ts      # Better Auth client config
│   │   │       └── server.ts      # Better Auth server config
│   │   ├── store/
│   │   │   └── index.ts           # useAuthStore + useCanvasStore (Zustand)
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   └── next.config.js
│   │
│   └── api/                       # Express.js backend (port 5000)
│       └── src/
│           ├── auth/
│           │   └── neon-auth.ts   # JWT validation middleware
│           ├── db/
│           │   ├── schema/        # Drizzle table definitions
│           │   │   ├── users.ts
│           │   │   ├── workflows.ts
│           │   │   ├── nodes.ts
│           │   │   ├── edges.ts
│           │   │   ├── executions.ts
│           │   │   ├── stepLogs.ts
│           │   │   └── relations.ts
│           │   ├── queries/       # Typed Drizzle query helpers
│           │   │   ├── workflows.ts
│           │   │   └── executions.ts
│           │   └── migrations/    # Drizzle-generated SQL migrations
│           ├── routes/
│           │   ├── auth.ts
│           │   ├── workflows.ts
│           │   ├── nodes.ts
│           │   ├── edges.ts
│           │   ├── executions.ts
│           │   ├── webhooks.ts
│           │   ├── streams.ts     # SSE endpoint for live execution updates
│           │   └── __tests__/     # Vitest + Supertest integration tests
│           ├── worker/
│           │   ├── workflowWorker.ts  # BullMQ worker — topological node execution
│           │   └── executors.ts       # Per-node-type execution logic
│           ├── lib/
│           │   ├── db.ts          # Drizzle client singleton
│           │   └── validateUUID.ts
│           ├── queue.ts           # BullMQ queue setup
│           ├── scheduler.ts       # Cron trigger scheduler
│           └── index.ts           # Express app entry point
│
├── packages/
│   ├── types/                     # @flow/types — shared TypeScript interfaces
│   │   └── src/index.ts           # Workflow, WorkflowNode, Execution, StepLog, etc.
│   ├── ui/                        # @repo/ui — shared React component stubs
│   ├── eslint-config/             # Shared ESLint rules
│   └── typescript-config/         # Base tsconfig.json
│
├── scripts/                       # Utility scripts (migrations, seeds)
├── docker-compose.yml             # Local Postgres 16 + Redis 7
├── .env                           # Environment variables (see below)
├── turbo.json                     # Turborepo task graph config
└── package.json                   # Workspace root
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 11
- **Docker** (for local Postgres + Redis) — or a [Neon](https://neon.tech) database URL

### 1. Clone & Install

```bash
git clone <repo-url>
cd flow
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database — use Docker local or your Neon connection string
DATABASE_URL=postgresql://user:password@localhost:5432/flow_db

# Redis — local Docker default
REDIS_HOST=localhost
REDIS_PORT=6379

# API & Web ports
API_PORT=5000
WEB_PORT=3000

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Start Local Infrastructure

```bash
docker-compose up -d   # starts Postgres 16 on :5432 and Redis 7 on :6379
```

### 4. Run Database Migrations

```bash
cd apps/api
npx drizzle-kit migrate
cd ../..
```

### 5. Start Development Servers

```bash
npm run dev   # Turborepo starts api (:5000) and web (:3000) in parallel
```

Open [http://localhost:3000](http://localhost:3000) — sign up, create a workflow, and start automating.

---

## Running Tests

Integration tests run against the Express app in-process using Supertest:

```bash
cd apps/api
npm test
```

Tests cover auth routes, workflow CRUD, node/edge management, execution lifecycle, webhook handling, and SSE streams.

---

## API Reference

All routes are prefixed `/api` and require `Authorization: Bearer <token>` unless noted.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/auth/me` | Current user profile |
| `GET` | `/api/workflows` | List user's workflows |
| `POST` | `/api/workflows` | Create workflow |
| `GET` | `/api/workflows/:id` | Get workflow + nodes + edges |
| `PUT` | `/api/workflows/:id` | Update workflow metadata |
| `DELETE` | `/api/workflows/:id` | Soft-delete workflow |
| `POST` | `/api/workflows/:id/execute` | Trigger execution (enqueues BullMQ job) |
| `GET` | `/api/executions/:id` | Get execution status |
| `GET` | `/api/executions/:id/logs` | Step-level logs for an execution |
| `GET` | `/api/streams/:executionId` | SSE stream — live node status updates |
| `POST` | `/api/webhooks/:workflowId` | Inbound webhook trigger |

---

## Design Decisions

**Why BullMQ instead of running execution synchronously?**
Workflows can contain HTTP calls, delays, and branching logic that may take seconds or minutes. Synchronous execution would hold HTTP connections open and time out on long workflows. BullMQ decouples the trigger (instant HTTP response) from the work (async, retryable, observable).

**Why SSE instead of WebSockets?**
SSE is unidirectional server-to-client, which is exactly what's needed for execution status — the server pushes events, the client only reads. SSE works over plain HTTP/1.1 with no protocol upgrade, is trivially proxied, and doesn't require a separate WebSocket server.

**Why Drizzle instead of Prisma?**
Drizzle generates plain SQL, has zero runtime overhead, and its TypeScript inference is excellent without requiring a separate `prisma generate` step. Schema-as-code in TypeScript keeps the DB definition co-located with the rest of the API source.

**Why Neon for Postgres?**
Serverless branching allows creating database branches for feature development and testing without spinning up new instances. The connection pooler handles the stateless nature of serverless/edge deployments.

---

## License

MIT
