# Flow Web

Next.js 16 frontend for the Flow workflow automation platform.

## Tech Stack

- **Next.js** (App Router) — file-system routing, React Server Components
- **React 18** — concurrent rendering
- **ReactFlow** — drag-and-drop node-graph canvas
- **Zustand** — client state (`useAuthStore`, `useCanvasStore`)
- **Tailwind CSS** — utility-first styling with dark-mode-first design tokens
- **Better Auth** (client) — sign-up / login flows integrating with Neon Auth JWTs

## Key Pages

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/login` `/signup` | Auth flows |
| `/dashboard` | Workflow grid, stats row, recent runs |
| `/workflows/:id` | Canvas editor with live execution panel |
| `/workflows/:id/runs` | Execution history and step logs |
| `/settings` | User profile management |

## Development

```bash
# From monorepo root
npm run dev
```

Web app runs on **http://localhost:3000**. API must be running on port 5000.

## Real-Time Execution

The `useExecutionStream` hook (`hooks/useExecutionStream.ts`) opens a
Server-Sent Events connection to `/api/streams/:executionId` and calls
`useCanvasStore.setNodeStatus()` on each event, updating the colored status
rings on canvas nodes in real time.

## Environment

No `.env` is needed for the web app in local development — all API calls
go to `http://localhost:5000` via the `lib/api.ts` fetch wrapper.
