# Flow — Frontend Design System & Page Specifications
## Complete UI/UX Blueprint

> **Stack:** Next.js 14 (App Router) · Tailwind CSS · React Flow · Zustand · Framer Motion
> **API Base:** `http://localhost:5000` (see API_REFERENCE.md)
> **Design Direction:** Precision instrument — dark, data-dense, surgical. Think Bloomberg terminal meets Linear. Every pixel earns its place.

---

## Aesthetic Direction

### The Concept
Flow is a tool for engineers. It should feel like a **high-precision instrument** — not a colorful SaaS marketing page. Dark background, sharp typographic hierarchy, information-dense layouts with generous breathing room where it counts. The UI should communicate "this thing is serious and reliable."

### Fonts
```css
/* Display / Headings — sharp, technical, geometric */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

--font-display: 'IBM Plex Mono', monospace;   /* brand name, nav labels, badges */
--font-body:    'IBM Plex Sans', sans-serif;  /* all body copy, form fields */
```

### Color System
```css
:root {
  /* Backgrounds — layered depth */
  --bg-base:     #080B11;   /* page background */
  --bg-surface:  #0D1117;   /* cards, panels */
  --bg-elevated: #161B22;   /* modals, dropdowns */
  --bg-overlay:  #1C2333;   /* hover states, selected rows */

  /* Borders */
  --border-dim:    #21262D;  /* subtle dividers */
  --border-muted:  #30363D;  /* card borders */
  --border-active: #388BFD;  /* focused inputs */

  /* Text */
  --text-primary:   #E6EDF3;  /* headings, important values */
  --text-secondary: #8B949E;  /* labels, descriptions */
  --text-muted:     #484F58;  /* placeholders, timestamps */
  --text-link:      #58A6FF;  /* links */

  /* Accents */
  --accent-blue:   #388BFD;  /* primary CTA, active states */
  --accent-green:  #3FB950;  /* success, active workflow */
  --accent-yellow: #D29922;  /* warning, cron trigger */
  --accent-red:    #F85149;  /* error, failed run */
  --accent-purple: #BC8CFF;  /* manual trigger */
  --accent-teal:   #39D353;  /* webhook trigger */

  /* Gradients */
  --gradient-blue: linear-gradient(135deg, #0D419D 0%, #388BFD 100%);
  --gradient-subtle: linear-gradient(180deg, #161B22 0%, #0D1117 100%);
}
```

### Spacing Scale (Tailwind custom)
```
2px  → gap-0.5  → between badge items
4px  → gap-1    → icon + label
8px  → gap-2    → form field spacing
12px → gap-3    → card padding (compact)
16px → gap-4    → standard component gap
24px → gap-6    → section padding
32px → gap-8    → major section gap
48px → gap-12   → page-level spacing
```

### Motion Tokens
```css
--ease-snap:    cubic-bezier(0.2, 0, 0, 1);     /* UI interactions */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* modals, cards */
--ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);   /* page transitions */

--duration-fast:   120ms;  /* hover states */
--duration-base:   200ms;  /* most transitions */
--duration-slow:   350ms;  /* page transitions, modals */
```

---

## App Structure

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              ← AppShell (sidebar + topbar)
│   │   ├── dashboard/page.tsx      ← Workflow grid + stats
│   │   ├── workflows/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx        ← Canvas editor
│   │   │   │   └── runs/
│   │   │   │       ├── page.tsx    ← Run history list
│   │   │   │       └── [executionId]/page.tsx  ← Run detail
│   │   └── settings/page.tsx       ← Profile settings
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── dashboard/
│   │   ├── StatsRow.tsx
│   │   ├── WorkflowCard.tsx
│   │   ├── WorkflowGrid.tsx
│   │   └── CreateWorkflowModal.tsx
│   ├── canvas/
│   │   ├── FlowCanvas.tsx
│   │   ├── CanvasToolbar.tsx
│   │   ├── NodePalette.tsx
│   │   ├── NodeConfigPanel.tsx
│   │   └── nodes/
│   │       ├── TriggerNode.tsx
│   │       ├── ActionNode.tsx
│   │       ├── ConditionNode.tsx
│   │       └── DelayNode.tsx
│   ├── runs/
│   │   ├── RunsTable.tsx
│   │   ├── RunStatusBadge.tsx
│   │   ├── StepTimeline.tsx
│   │   └── LiveRunPanel.tsx
│   └── ui/                         ← Design system primitives
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Tooltip.tsx
│       └── StatusDot.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useWorkflows.ts
│   ├── useExecution.ts
│   └── useSSE.ts
├── store/
│   └── workflowStore.ts
└── lib/
    ├── supabase.ts
    └── api.ts                      ← Typed API client
```

---

## Page 1 — Login / Signup

### Route
`/login` · `/signup`

### Layout
Full viewport. No sidebar. Centered split layout.

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│   Left panel         │   Right panel        │
│   Dark bg            │   Form               │
│   Brand + tagline    │                      │
│   Animated node      │   Logo (small)       │
│   graph preview      │   "Welcome back"     │
│                      │   Email field        │
│                      │   Password field     │
│                      │   [Sign in] button   │
│                      │   "No account? →"    │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

### Design Details
- Left panel: animated SVG node graph slowly drifting — the canvas itself as a visual, faded at 20% opacity over a dark gradient
- "Flow" wordmark in `IBM Plex Mono`, weight 600, letter-spacing: 0.15em
- Tagline: `"Automate anything. Visually."` in muted text
- Form uses glass-morphism card: `background: rgba(13,17,23,0.8)`, `backdrop-filter: blur(20px)`
- Input focus ring: `--border-active` blue, 1px solid
- Primary button: full width, `--accent-blue` fill, slight glow on hover `box-shadow: 0 0 20px rgba(56,139,253,0.3)`
- Error state: inline below field, red text, no toast

### API Calls
```typescript
// Supabase Auth — not the Flow API
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signUp({ email, password })

// After successful auth, call:
GET /auth/me  ← creates profile on first visit
```

---

## Page 2 — Dashboard

### Route
`/dashboard`

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ TOPBAR: "Flow" logo | breadcrumb | search | avatar          │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ SIDEBAR  │  [Stats Row — 4 cards]                          │
│          │                                                  │
│ Dashboard│  ┌────────────────────────────────────────────┐ │
│ ─────    │  │  Workflows  [+ New Workflow]  [search...]  │ │
│ Settings │  └────────────────────────────────────────────┘ │
│          │  [Workflow Card] [Workflow Card] [Workflow Card] │
│          │  [Workflow Card] [Workflow Card] [+ New]         │
│          │                                                  │
│          │  Recent Runs ─────────────────────────────────  │
│          │  [Runs Table — last 10 across all workflows]     │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### Stats Row
4 cards in a horizontal row. Each card:

```
┌─────────────────────────┐
│  TOTAL WORKFLOWS        │
│                         │
│  12          ↑ 3 today  │
│                         │
└─────────────────────────┘
```

| Card | Value | Source |
|------|-------|--------|
| Total Workflows | Count of workflows | `GET /api/workflows` → `.length` |
| Active | Count where `isActive: true` | same response |
| Runs Today | Count of executions today | `GET /api/workflows/:id/executions` (aggregated) |
| Success Rate | `success / total * 100` % | same, last 50 runs |

Design: `--bg-surface` card, `--border-muted` border, label in `--text-secondary`, value in `--text-primary` at `2rem` / `IBM Plex Mono`. Accent bar at top in relevant color (blue / green / yellow / green).

### Workflow Cards Grid

3-column responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

```
┌─────────────────────────────────────────┐
│  ● ACTIVE             webhook           │  ← status dot + trigger badge
│                                         │
│  User Signup Flow                       │  ← workflow name (truncate at 1 line)
│  Sends welcome email on new signup      │  ← description (2 lines max)
│                                         │
│  ▪▪▪▪▪▪▪▪▪▫▫  8 nodes                 │  ← node count
│                                         │
│  ● ● ● ● ● ● ● ● ○ ✕                  │  ← last 10 run dots
│  Last run: 2 mins ago                   │
│                                         │
│  [Open Canvas]          [▶ Run]         │
└─────────────────────────────────────────┘
```

**Run dots:** 10 small circles (6px), colored by status:
- `--accent-green` = success
- `--accent-red` = failed
- `--border-muted` = pending/no run

**Trigger badge** (top right):
- `webhook` → teal pill, chain-link icon
- `cron` → yellow pill, clock icon
- `manual` → purple pill, cursor icon
- no trigger → gray pill, "—"

**Active/Inactive toggle:** click the `● ACTIVE` / `○ INACTIVE` badge on the card → calls `PUT /api/workflows/:id` with `{ isActive: !current }`. Optimistic update with rollback on error.

**Hover state:** card lifts `translateY(-2px)` with `box-shadow` deepening. Border changes from `--border-muted` to `--border-active`.

**"+ New Workflow" ghost card:** dashed border, `+` icon centered, opens `CreateWorkflowModal` on click.

### Create Workflow Modal

Slides up from bottom or fades in center.

```
┌─────────────────────────────────────────┐
│  New Workflow                      [✕]  │
│                                         │
│  Name *                                 │
│  ┌─────────────────────────────────┐   │
│  │ My workflow name                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Description                            │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│              [Cancel]  [Create →]       │
└─────────────────────────────────────────┘
```

On submit → `POST /api/workflows` → redirect to `/workflows/:id` (canvas).

### Recent Runs Table

Below the card grid. Shows last 10 runs across ALL workflows.

| Column | Value |
|--------|-------|
| Workflow | Name, clickable |
| Trigger | Badge (webhook / cron / manual) |
| Status | Colored badge |
| Duration | `finishedAt - startedAt` in ms/s |
| Steps | `completedSteps / totalSteps` |
| When | Relative time ("3m ago") |
| → | Link to run detail |

Rows animate in with staggered `fadeInUp` on page load.

### API Calls
```typescript
GET /api/workflows          // workflow list + all data for cards
// For run stats — call for each workflow or batch:
GET /api/workflows/:id/executions  // last 50 per workflow
```

---

## Page 3 — Canvas Editor

### Route
`/workflows/:id`

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ TOPBAR: ← Dashboard | "User Signup Flow" [edit] | [Save ●] │
│         [▶ Run] | [Active ⦿] | status: Saved 2m ago        │
├─────────┬───────────────────────────────────┬───────────────┤
│         │                                   │               │
│ NODE    │                                   │  CONFIG       │
│ PALETTE │      REACT FLOW CANVAS            │  PANEL        │
│         │                                   │  (slides in   │
│ Trigger │   [node] ──→ [node] ──→ [node]   │   when node   │
│ Action  │                                   │   selected)   │
│ Cond.   │                                   │               │
│ Delay   │                                   │               │
│         │                                   │               │
└─────────┴───────────────────────────────────┴───────────────┘
```

### Topbar (Canvas-specific)
- `← Dashboard` back link
- Workflow name — inline editable (click to edit, blur to save `PUT /api/workflows/:id`)
- `Save` button — disabled when no unsaved changes, blue when dirty. Shows `●` indicator when unsaved
- `▶ Run` button — triggers `POST /api/workflows/:id/execute` → opens live run panel
- `Active / Inactive` toggle — calls `PUT /api/workflows/:id` with `isActive`
- Save status: `"Saved"` / `"Saving..."` / `"Unsaved changes"` in muted text

### Node Palette (Left sidebar — 200px wide)

```
┌───────────────┐
│ NODES         │
│               │
│ ┌───────────┐ │
│ │ ⚡ Trigger │ │ ← drag to canvas
│ └───────────┘ │
│               │
│ ┌───────────┐ │
│ │ ⚙ Action  │ │
│ └───────────┘ │
│               │
│ ┌───────────┐ │
│ │ ◈ Condition│ │
│ └───────────┘ │
│               │
│ ┌───────────┐ │
│ │ ⏱ Delay   │ │
│ └───────────┘ │
└───────────────┘
```

Draggable onto canvas using React Flow's `onDrop`. Each palette item shows icon + label. Hover shows a tooltip with description of what the node does.

### Canvas

React Flow with custom styling:

```typescript
// React Flow config
<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}   // custom components
  fitView
  snapToGrid
  snapGrid={[16, 16]}
  defaultEdgeOptions={{
    type: 'smoothstep',
    animated: true,        // dashed animated line while connecting
    style: { stroke: '#388BFD', strokeWidth: 2 }
  }}
  connectionLineStyle={{ stroke: '#388BFD', strokeWidth: 2 }}
>
  <Background color="#21262D" gap={24} variant="dots" />
  <MiniMap
    nodeColor="#161B22"
    maskColor="rgba(8,11,17,0.8)"
    style={{ background: '#0D1117' }}
  />
  <Controls style={{ background: '#161B22', borderColor: '#21262D' }} />
</ReactFlow>
```

### Custom Node Components

**Base node structure (all types share this shell):**
```
┌─────────────────────────────┐
│ [icon] TYPE        [⋮ menu] │  ← header bar (color varies by type)
├─────────────────────────────┤
│  Node Label                 │  ← main label
│  Subtype badge              │  ← e.g. "POST webhook"
├─────────────────────────────┤
│  ● input handle             │  ← React Flow handle
│                  output ●   │
└─────────────────────────────┘
```

**Node type → header color:**
| Type | Header Color | Icon |
|------|-------------|------|
| trigger | `--accent-teal` | ⚡ |
| action | `--accent-blue` | ⚙ |
| condition | `--accent-yellow` | ◈ |
| delay | `--text-muted` | ⏱ |

**During execution (SSE live updates):**
- `pending` → default border
- `running` → pulsing blue border `box-shadow: 0 0 0 2px var(--accent-blue)` + spinner in corner
- `success` → green border, checkmark overlay for 2s then fades
- `failed` → red border, `!` icon, click to see error tooltip

### Node Config Panel (Right sidebar — 320px wide)

Slides in from the right when a node is selected. Hides when nothing is selected.

```
┌─────────────────────────────────────────┐
│  ⚡ Trigger Node              [✕]       │
│  ─────────────────────────────────────  │
│                                         │
│  Label                                  │
│  ┌──────────────────────────────────┐  │
│  │ Webhook Trigger                  │  │
│  └──────────────────────────────────┘  │
│                                         │
│  Trigger Type                           │
│  ○ Webhook   ● Cron   ○ Manual          │
│                                         │
│  — if cron selected:                    │
│  Cron Expression                        │
│  ┌──────────────────────────────────┐  │
│  │ 0 9 * * 1-5                     │  │
│  └──────────────────────────────────┘  │
│  ↳ Runs at 09:00, Mon–Fri              │ ← human-readable cron
│                                         │
│  — if webhook selected:                 │
│  Webhook URL (read-only)               │
│  ┌──────────────────────────────────┐  │
│  │ /api/webhooks/abc-123...  [copy] │  │
│  └──────────────────────────────────┘  │
│  Secret                                 │
│  ┌──────────────────────────────────┐  │
│  │ whsec_••••••••••    [reveal]     │  │
│  └──────────────────────────────────┘  │
│                                         │
│  [Delete Node]              [Apply]     │
└─────────────────────────────────────────┘
```

**Config fields by node type:**

**Action → HTTP Request:**
```
Method:  [GET ▾]
URL:     [https://api.example.com/...]
Headers: [+ Add header]  key: value pairs
Body:    [JSON editor — monaco-lite or textarea]
Timeout: [10000] ms
```

**Action → Transform:**
```
Expression:
┌─────────────────────────────────────┐
│ ({                                  │
│   name: input.firstName + ' ' +     │
│         input.lastName              │
│ })                                  │
└─────────────────────────────────────┘
↳ Hint: use `input` to reference previous step's output
```

**Condition:**
```
Field:    [input.status       ]
Operator: [equals ▾]
Value:    [active             ]
→ True branch  → connects to next node
→ False branch → connects to another node
```

**Delay:**
```
Duration: [5000] ms
          ↳ 5 seconds
```

Changes in the config panel are applied to Zustand store immediately. The `Save` button in the topbar persists everything via:
```typescript
PUT /api/workflows/:id/nodes    // all node positions + configs
PUT /api/workflows/:id/edges    // all edges
```

### Live Run Panel (Bottom drawer)

Opens when user clicks `▶ Run`. Slides up from the bottom, 280px height.

```
┌─────────────────────────────────────────────────────────────┐
│  ▶ Run  #abc123   ●  running    2.3s ago          [✕ close] │
├────────┬─────────────────────────────────────────────────── │
│STEP    │ ✓  Webhook Trigger          0ms                    │
│TIMELINE│ ◉  HTTP Request             running...             │
│        │ ○  Transform                pending                │
│        │ ○  Log Output               pending                │
└────────┴─────────────────────────────────────────────────── │
```

Connected via `GET /api/executions/:executionId/stream` (SSE). Each step updates in real time. On completion → `View Full Report` link appears → `/workflows/:id/runs/:executionId`.

### Unsaved Changes Guard
If `isDirty === true` and user tries to navigate away → browser native `beforeunload` dialog + Next.js router guard.

### API Calls
```typescript
GET  /api/workflows/:id              // load canvas on mount
PUT  /api/workflows/:id              // save name/isActive
PUT  /api/workflows/:workflowId/nodes  // save canvas (nodes)
PUT  /api/workflows/:workflowId/edges  // save canvas (edges)
POST /api/workflows/:id/execute        // manual run
GET  /api/executions/:id/stream        // SSE for live run panel
```

---

## Page 4 — Run History

### Route
`/workflows/:id/runs`

### Layout
```
┌──────────────────────────────────────────────────────┐
│ ← User Signup Flow  /  Runs                          │
│                                                      │
│  [All ▾]  [webhook ▾]  [failed ▾]  [last 7 days ▾]  │ ← filters
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ # │ Trigger │ Status  │ Steps│ Duration│ When│   │
│  ├───┼─────────┼─────────┼──────┼─────────┼─────┤   │
│  │ 1 │ webhook │ success │ 5/5  │ 1.2s    │ 2m  │ →│
│  │ 2 │ manual  │ failed  │ 3/5  │ 0.8s    │ 1h  │ →│
│  │ 3 │ cron    │ success │ 5/5  │ 1.4s    │ 3h  │ →│
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Detail |
|--------|--------|
| # | Short run ID (first 8 chars of UUID), monospace |
| Trigger | Colored badge: `webhook` teal, `cron` yellow, `manual` purple |
| Status | Colored badge with dot |
| Steps | `completedSteps / totalSteps` — mini progress bar below |
| Duration | `finishedAt - startedAt` formatted (`1.2s`, `340ms`) — `—` if still running |
| When | Relative time, full ISO on hover (tooltip) |
| → | Chevron, links to run detail |

**Row hover:** `--bg-overlay` background, cursor pointer.
**Failed rows:** subtle `--accent-red` left border (3px).
**Running rows:** pulsing left border in `--accent-blue`.

### Filters
- Status: All / Success / Failed / Running
- Trigger: All / Webhook / Cron / Manual
- Pagination: Shows `1–50 of 184` with load-more button

### API Calls
```typescript
GET /api/workflows/:workflowId/executions  // last 50, paginated with ?offset=
```

---

## Page 5 — Run Detail

### Route
`/workflows/:id/runs/:executionId`

### Layout
```
┌───────────────────────────────────────────────────────────┐
│ ← Runs  /  Run #abc12345                                  │
│                                                           │
│  ┌──────────────────┐  ┌────────────────────────────────┐│
│  │ SUMMARY          │  │ STEP TIMELINE                  ││
│  │                  │  │                                ││
│  │ Status: ✓ success│  │ 1. ⚡ Webhook Trigger    ✓ 0ms││
│  │ Trigger: webhook │  │    └─ output: { body: {...} }  ││
│  │ Duration: 1.2s   │  │                                ││
│  │ Started: 14:32   │  │ 2. ⚙ HTTP Request      ✓ 847ms││
│  │ Steps:  5/5      │  │    └─ GET https://api...       ││
│  │                  │  │    └─ output: { status: 200 }  ││
│  └──────────────────┘  │                                ││
│                        │ 3. ◈ Condition         ✓  12ms ││
│  TRIGGER PAYLOAD       │    └─ input.status == 'active' ││
│  ┌──────────────────┐  │    └─ branch: true             ││
│  │ {                │  │                                ││
│  │   "userId": "..." │  │ 4. ✕ HTTP Request     ✗ 203ms ││
│  │ }                │  │    └─ Error: 404 Not Found     ││
│  └──────────────────┘  │                                ││
│                        └────────────────────────────────┘│
└───────────────────────────────────────────────────────────┘
```

### Summary Card
- Status badge (large)
- Trigger type badge
- Duration (`finishedAt - startedAt`)
- Started at (full date + time)
- Steps completed (`completedSteps / totalSteps`)
- Error message (if execution-level failure)

### Step Timeline

Each step is an expandable row:

```
┌─────────────────────────────────────────────────────┐
│  ✓  2.  HTTP Request — Fetch User Data        847ms │  ← collapsed
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ✓  2.  HTTP Request — Fetch User Data        847ms │  ← expanded
│  ─────────────────────────────────────────────────  │
│  Attempt: 1                                         │
│                                                     │
│  INPUT ─────────────────────                        │
│  { "userId": "123", "token": "abc" }                │
│                                                     │
│  OUTPUT ────────────────────                        │
│  { "status": 200, "data": { "name": "..." } }       │
│                                                     │
│  12:34:00.123 → 12:34:00.970   (+847ms)             │
└─────────────────────────────────────────────────────┘
```

Step status icons:
- `✓` green — success
- `✕` red — failed
- `◉` blue pulsing — running (live)
- `○` muted — pending
- `⊘` gray — skipped

JSON input/output: syntax highlighted. Use `highlight.js` or a lightweight inline solution. Collapsible with `▾ / ▸` toggle. Copy button on JSON blocks.

### API Calls
```typescript
GET /api/workflows/:workflowId/executions/:executionId        // summary + stepLogs
GET /api/workflows/:workflowId/executions/:executionId/logs   // step logs ordered by startedAt
```

---

## Page 6 — Settings

### Route
`/settings`

### Layout
Single centered form column, max-width 560px.

```
┌───────────────────────────────────────────┐
│  Profile                                  │
│                                           │
│  Avatar                                   │
│  ┌────┐                                   │
│  │ AV │  [Change avatar]                  │
│  └────┘                                   │
│                                           │
│  Username                                 │
│  ┌──────────────────────────────────────┐ │
│  │ johndoe                              │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  Email (read-only)                        │
│  ┌──────────────────────────────────────┐ │
│  │ john@example.com                     │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  [Save Changes]                           │
│                                           │
│  ───────────────────────────────────────  │
│                                           │
│  Danger Zone                              │
│  [Sign Out]                               │
└───────────────────────────────────────────┘
```

### API Calls
```typescript
GET /auth/me   // on mount — load current profile
PUT /auth/me   // on save — { username, avatarUrl }
```

---

## App Shell

### Sidebar (240px wide, collapsible to 64px)

```
┌────────────────────────┐
│  ⚡ Flow               │  ← logo + wordmark
│                        │
│  ─────────────────     │
│                        │
│  ⊞  Dashboard          │  ← active state: left accent bar
│  ⚙  [workflow name]    │  ← shows when inside a workflow
│                        │
│                        │
│                        │
│  ─────────────────     │
│  ◎  Settings           │
│  JD  John Doe          │  ← avatar + name
└────────────────────────┘
```

- Active nav item: `--bg-overlay` background + 2px `--accent-blue` left border
- Collapse button: `«` chevron at bottom, animates sidebar width
- Collapsed state: only icons visible with tooltips on hover

### Topbar (56px tall)
- Left: breadcrumb navigation
- Right: global search `⌘K`, notification bell (future), user avatar (dropdown → settings, sign out)

---

## Component Library

### `<Badge>` variants
```tsx
<Badge variant="success">success</Badge>   // green
<Badge variant="failed">failed</Badge>     // red
<Badge variant="running">running</Badge>   // blue + pulse animation
<Badge variant="pending">pending</Badge>   // muted
<Badge variant="webhook">webhook</Badge>   // teal
<Badge variant="cron">cron</Badge>         // yellow
<Badge variant="manual">manual</Badge>     // purple
```

### `<Button>` variants
```tsx
<Button variant="primary">Save</Button>         // blue fill
<Button variant="ghost">Cancel</Button>         // no bg, muted text
<Button variant="danger">Delete</Button>        // red fill
<Button variant="outline">Open Canvas</Button>  // border only
<Button size="sm|md|lg" loading={bool} />       // loading spinner state
```

### `<StatusDot>`
6px circle with color + optional pulse animation for "running" status.

### `<Card>`
```tsx
<Card hover={true} selected={false}>
  {/* content */}
</Card>
```
`hover` → lift effect on hover. `selected` → `--border-active` border.

### `<Input>`
```tsx
<Input
  label="Name"
  error="Name is required"
  hint="Max 255 characters"
  prefix={<Icon />}
/>
```
Focus ring: `--border-active`. Error state: `--accent-red` border + error text below.

---

## Zustand Store

```typescript
// store/workflowStore.ts

interface WorkflowStore {
  // Canvas state
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';

  // Live execution state
  activeExecutionId: string | null;
  nodeStatuses: Record<string, StepStatus>;  // nodeId → status
  isLivePanelOpen: boolean;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  selectNode: (id: string | null) => void;
  updateNodeConfig: (id: string, config: NodeConfig) => void;
  updateNodePosition: (id: string, position: XYPosition) => void;
  markDirty: () => void;
  markSaved: () => void;

  // Execution
  startExecution: (executionId: string) => void;
  updateNodeStatus: (nodeId: string, status: StepStatus) => void;
  clearExecution: () => void;
}
```

---

## Typed API Client

```typescript
// lib/api.ts — wrapper around fetch with auth token injected

class FlowAPI {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL!;

  private async request<T>(
    path: string,
    options?: RequestInit,
    token?: string
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  // Workflows
  getWorkflows      = (token: string) =>
    this.request<Workflow[]>('/api/workflows', {}, token);

  getWorkflow       = (id: string, token: string) =>
    this.request<Workflow>(`/api/workflows/${id}`, {}, token);

  createWorkflow    = (body: { name: string; description?: string }, token: string) =>
    this.request<Workflow>('/api/workflows', { method: 'POST', body: JSON.stringify(body) }, token);

  updateWorkflow    = (id: string, body: Partial<Workflow>, token: string) =>
    this.request<Workflow>(`/api/workflows/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token);

  deleteWorkflow    = (id: string, token: string) =>
    this.request(`/api/workflows/${id}`, { method: 'DELETE' }, token);

  executeWorkflow   = (id: string, payload: object, token: string) =>
    this.request<{ execution: Execution; message: string }>(
      `/api/workflows/${id}/execute`, { method: 'POST', body: JSON.stringify({ payload }) }, token);

  saveNodes         = (workflowId: string, nodes: WorkflowNode[], token: string) =>
    this.request(`/api/workflows/${workflowId}/nodes`, { method: 'PUT', body: JSON.stringify({ nodes }) }, token);

  saveEdges         = (workflowId: string, edges: WorkflowEdge[], token: string) =>
    this.request(`/api/workflows/${workflowId}/edges`, { method: 'PUT', body: JSON.stringify({ edges }) }, token);

  // Executions
  getExecutions     = (workflowId: string, token: string) =>
    this.request<Execution[]>(`/api/workflows/${workflowId}/executions`, {}, token);

  getExecution      = (workflowId: string, executionId: string, token: string) =>
    this.request<Execution & { stepLogs: StepLog[] }>(
      `/api/workflows/${workflowId}/executions/${executionId}`, {}, token);

  // Auth
  getMe             = (token: string) =>
    this.request<Profile>('/auth/me', {}, token);

  updateMe          = (body: { username?: string; avatarUrl?: string }, token: string) =>
    this.request<Profile>('/auth/me', { method: 'PUT', body: JSON.stringify(body) }, token);
}

export const api = new FlowAPI();
```

---

## SSE Hook

```typescript
// hooks/useSSE.ts

export function useSSE(executionId: string | null, token: string | null) {
  const updateNodeStatus = useWorkflowStore(s => s.updateNodeStatus);
  const [executionStatus, setExecutionStatus] = useState<RunStatus>('running');

  useEffect(() => {
    if (!executionId || !token) return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/executions/${executionId}/stream`;
    const es  = new EventSource(url);  // Note: attach token via query param or cookie for SSE

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'step_update') {
        updateNodeStatus(data.nodeId, data.status);
      }

      if (data.type === 'execution_completed') {
        setExecutionStatus(data.status);
        es.close();
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [executionId, token]);

  return { executionStatus };
}
```

> **SSE Auth Note:** Native `EventSource` does not support custom headers.
> Pass the token as a query param: `/api/executions/:id/stream?token=<jwt>`
> and verify it in the backend stream route.

---

## Loading & Empty States

### Dashboard — no workflows yet
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                    ⚡                           │
│                                                 │
│           No workflows yet                      │
│     Build your first automation in              │
│     minutes — no code required.                 │
│                                                 │
│            [+ Create Workflow]                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Canvas — loading
Skeleton nodes in approximate positions while `GET /api/workflows/:id` resolves. Use CSS `@keyframes shimmer` animation on skeleton elements.

### Run History — no runs
```
○  This workflow hasn't been triggered yet.
   Click [▶ Run] on the canvas to test it.
```

### Error states
Toast notifications (bottom-right, stack up to 3):
```
┌─────────────────────────────────┐
│  ✕  Failed to save workflow     │  ← red left border
│     Network error               │
└─────────────────────────────────┘
```
Auto-dismiss after 5s. Manual dismiss with `✕`.

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `< 768px` (mobile) | Sidebar hidden, hamburger menu, canvas view redirects to run history (canvas not usable on mobile) |
| `768px–1024px` (tablet) | Sidebar collapsed (icons only), 2-col workflow grid |
| `> 1024px` (desktop) | Full layout, 3-col grid, sidebar expanded |

---

## Key Interaction Flows

### Flow 1 — Create & run a workflow
```
Dashboard → [+ New Workflow] → modal → name → [Create]
→ Canvas (empty) → drag Trigger node → configure → drag Action node
→ connect edge → [Save] → [▶ Run] → live panel shows steps executing
→ [View Full Report] → run detail page
```

### Flow 2 — Webhook trigger
```
Canvas → click Trigger node → Config Panel → select "Webhook"
→ copy webhook URL + secret → [Save] → [Active ⦿] toggle ON
→ external service POSTs to webhook URL → run appears in history
```

### Flow 3 — Monitor failures
```
Dashboard → failed dot on workflow card → [Open Canvas]
→ run panel shows failed node in red → click node → see error
→ [View Full Report] → run detail → expand failed step → read error + output
```

---

## Implementation Order

| Order | Component | Depends on |
|-------|-----------|------------|
| 1 | Design tokens + Tailwind config | — |
| 2 | Auth pages (login/signup) | Supabase |
| 3 | AppShell (sidebar + topbar) | Auth hook |
| 4 | Dashboard — stats + workflow cards | `GET /api/workflows` |
| 5 | Create workflow modal | `POST /api/workflows` |
| 6 | Canvas — React Flow + custom nodes | `GET /api/workflows/:id` |
| 7 | Node config panel | Zustand store |
| 8 | Canvas save | `PUT /nodes` + `PUT /edges` |
| 9 | Manual run + live panel | `POST /execute` + SSE hook |
| 10 | Run history page | `GET /executions` |
| 11 | Run detail page | `GET /executions/:id` |
| 12 | Settings page | `GET/PUT /auth/me` |
| 13 | Active/inactive toggle | `PUT /api/workflows/:id` |
| 14 | Webhook config display | workflow.webhookSecret |

---

*Frontend Design v1.0 — Flow Capstone Project*
*Base API: http://localhost:5000 — see API_REFERENCE.md for full route details*
