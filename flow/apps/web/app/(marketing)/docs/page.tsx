import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Docs' };

// ── Reusable primitives ────────────────────────────────────────────────────────

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '12px',
        background: '#161B22',
        border: '1px solid #21262D',
        borderRadius: '4px',
        padding: '2px 6px',
        color: '#E6EDF3',
      }}
    >
      {children}
    </code>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: '#0D1117',
        border: '1px solid #21262D',
        borderRadius: '6px',
        padding: '16px 20px',
        overflowX: 'auto',
        fontSize: '13px',
        lineHeight: 1.65,
        color: '#E6EDF3',
        fontFamily: "'IBM Plex Mono', monospace",
        margin: '16px 0',
      }}
    >
      {children}
    </pre>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ overflowX: 'auto', margin: '20px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderBottom: '2px solid #21262D',
                  color: '#8B949E',
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #21262D' }}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: '10px 12px',
                    color: '#E6EDF3',
                    verticalAlign: 'top',
                    lineHeight: 1.6,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        fontSize: '22px',
        fontWeight: 700,
        color: '#E6EDF3',
        letterSpacing: '-0.02em',
        marginTop: '60px',
        marginBottom: '12px',
        paddingTop: '24px',
        borderTop: '1px solid #21262D',
        scrollMarginTop: '80px',
      }}
    >
      {children}
    </h2>
  );
}

function H3({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      style={{
        fontSize: '16px',
        fontWeight: 600,
        color: '#E6EDF3',
        marginTop: '36px',
        marginBottom: '10px',
        scrollMarginTop: '80px',
      }}
    >
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#8B949E', marginBottom: '12px' }}>
      {children}
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'rgba(56,139,253,0.07)',
        border: '1px solid rgba(56,139,253,0.2)',
        borderRadius: '6px',
        padding: '12px 16px',
        fontSize: '13px',
        color: '#8B949E',
        lineHeight: 1.65,
        margin: '16px 0',
      }}
    >
      {children}
    </div>
  );
}

// ── Sidebar nav ────────────────────────────────────────────────────────────────

const NAV = [
  {
    group: 'Getting Started',
    items: [
      { label: 'What is Flow', href: '#what-is-flow' },
      { label: 'Quick Start', href: '#quick-start' },
      { label: 'Example Workflow', href: '#example-workflow' },
    ],
  },
  {
    group: 'Nodes',
    items: [
      { label: 'Trigger Node', href: '#trigger-node' },
      { label: 'HTTP Request', href: '#http-request' },
      { label: 'Transform', href: '#transform' },
      { label: 'Condition', href: '#condition' },
      { label: 'Delay', href: '#delay' },
      { label: 'Notify', href: '#notify' },
    ],
  },
  {
    group: 'Triggers',
    items: [
      { label: 'Webhook', href: '#webhook' },
      { label: 'Cron Schedule', href: '#cron-schedule' },
      { label: 'Manual', href: '#manual' },
    ],
  },
  {
    group: 'Execution',
    items: [
      { label: 'How it works', href: '#how-execution-works' },
      { label: 'Retries & failures', href: '#retries-failures' },
      { label: 'Live logs (SSE)', href: '#live-logs' },
    ],
  },
  {
    group: 'API Reference',
    items: [
      { label: 'Auth', href: '#api-auth' },
      { label: 'Workflows', href: '#api-workflows' },
      { label: 'Nodes & Edges', href: '#api-nodes-edges' },
      { label: 'Executions', href: '#api-executions' },
      { label: 'Webhooks', href: '#api-webhooks' },
      { label: 'Streams', href: '#api-streams' },
    ],
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

      {/* ── Sidebar ── */}
      <aside
        className="hidden md:block"
        style={{
          width: '252px',
          flexShrink: 0,
          position: 'sticky',
          top: '56px',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
          borderRight: '1px solid #21262D',
          padding: '28px 0',
        }}
      >
        {NAV.map((section) => (
          <div key={section.group} style={{ marginBottom: '24px' }}>
            <p
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#484F58',
                padding: '0 20px',
                marginBottom: '4px',
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              {section.group}
            </p>
            {section.items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block px-5 py-1.5 text-sm hover:text-[#E6EDF3] hover:bg-[#161B22] transition-colors"
                style={{ color: '#8B949E', textDecoration: 'none', fontSize: '13px' }}
              >
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </aside>

      {/* ── Content ── */}
      <main style={{ flex: 1, minWidth: 0, padding: '48px 56px 96px' }}>
        <div style={{ maxWidth: '800px' }}>

          {/* page title */}
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#388BFD',
              fontFamily: "'IBM Plex Mono', monospace",
              marginBottom: '8px',
            }}
          >
            Documentation
          </p>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#E6EDF3',
              letterSpacing: '-0.02em',
              marginBottom: '8px',
            }}
          >
            Flow
          </h1>
          <p style={{ fontSize: '16px', color: '#8B949E', marginBottom: '0' }}>
            Visual workflow automation — reference and guides.
          </p>

          {/* ══════════════════════════════════════════════════════════════════
              GETTING STARTED
          ══════════════════════════════════════════════════════════════════ */}

          <H2 id="what-is-flow">What is Flow</H2>
          <P>
            Flow is a visual, event-driven workflow automation system. Build automations as node
            graphs — nodes are steps, edges are connections. Every workflow has a trigger that fires
            it, and one or more action nodes that execute in sequence.
          </P>
          <P>
            Flow replaces hardcoded automation scripts with a flexible visual execution engine.
            You design the workflow once on a drag-and-drop canvas, and the engine handles queuing,
            retries, live logging, and failure recovery.
          </P>
          <DocTable
            headers={['Concept', 'What it is']}
            rows={[
              ['Workflow', 'A named graph of nodes and edges. Has one trigger and one or more action nodes.'],
              ['Node', 'A single step — a trigger, HTTP call, transformation, condition, delay, or notification.'],
              ['Edge', 'A directional connection from one node to the next. Condition nodes have true/false edges.'],
              ['Execution', 'A single run of a workflow. Stores status and step-by-step input/output logs.'],
              ['Step log', 'The recorded input, output, status, and timing for one node within one execution.'],
            ]}
          />

          <H3 id="quick-start">Quick Start</H3>
          <ol
            style={{
              paddingLeft: '20px',
              margin: '0 0 16px',
              color: '#8B949E',
              fontSize: '14px',
              lineHeight: 2.1,
            }}
          >
            <li>Sign up and open the dashboard</li>
            <li>
              Click <strong style={{ color: '#E6EDF3' }}>New Workflow</strong> — give it a name
            </li>
            <li>
              Add a <strong style={{ color: '#39D353' }}>Manual Trigger</strong> node from the
              left sidebar
            </li>
            <li>
              Add an <strong style={{ color: '#388BFD' }}>HTTP Request</strong> node —{' '}
              <Code>GET https://official-joke-api.appspot.com/random_joke</Code>
            </li>
            <li>
              Add a <strong style={{ color: '#388BFD' }}>Notify</strong> node — choose Email or
              Slack and fill in the config
            </li>
            <li>Connect the nodes: Trigger → HTTP Request → Notify</li>
            <li>
              Click <strong style={{ color: '#E6EDF3' }}>Save</strong> then{' '}
              <strong style={{ color: '#E6EDF3' }}>Run</strong>
            </li>
            <li>Watch the canvas — each node turns green as it completes</li>
          </ol>

          <H3 id="example-workflow">Example Workflow</H3>
          <P>
            The New User Onboarding workflow fires when a user signs up, fetches their profile,
            checks their plan tier, then sends a personalised email or Slack alert depending on
            the result.
          </P>
          <Pre>{`Webhook (user.signup)
  → HTTP Request  GET /api/users/{{input.userId}}
  → Condition     input.plan === "pro"
      true  → Notify  Email  "Welcome to Pro, {{input.name}}!"
      false → Notify  Slack  "#sales: new free signup — {{input.email}}"`}</Pre>

          {/* ══════════════════════════════════════════════════════════════════
              NODES
          ══════════════════════════════════════════════════════════════════ */}

          <H2 id="trigger-node">Trigger Node</H2>
          <P>
            Every workflow starts with exactly one Trigger node. The subtype determines how the
            workflow is activated. The trigger&apos;s output becomes the <Code>input</Code> received
            by the first action node.
          </P>
          <DocTable
            headers={['Subtype', 'How it fires', 'Key config']}
            rows={[
              [
                <Code key="wh">webhook</Code>,
                'HTTP POST to the workflow\'s unique URL',
                <><Code key="ws">webhookSecret</Code> — required header value</>,
              ],
              [
                <Code key="cr">cron</Code>,
                'On a recurring schedule',
                <><Code key="ce">cronExpression</Code> — standard 5-field cron</>,
              ],
              [
                <Code key="mn">manual</Code>,
                'Clicking Run in the canvas or POST /execute',
                'Optional payload object',
              ],
            ]}
          />

          <H3 id="http-request">HTTP Request</H3>
          <P>
            Makes an outbound HTTP call and passes the parsed JSON response body as output to
            the next node.
          </P>
          <DocTable
            headers={['Field', 'Type', 'Description']}
            rows={[
              ['method', 'GET | POST | PUT | PATCH | DELETE', 'HTTP verb'],
              ['url', 'string', <>Request URL. Supports <Code>{'{{input.field}}'}</Code> interpolation</>],
              ['headers', 'object', 'Key-value pairs sent as request headers'],
              ['body', 'object', <>Request body for POST/PUT/PATCH. Supports <Code>{'{{input.x}}'}</Code></>],
              ['timeoutMs', 'number', 'Request timeout in milliseconds (default: 10 000)'],
            ]}
          />
          <P>
            Use <Code>{'{{input.field}}'}</Code> anywhere in url, headers, or body to pull values
            from the previous node&apos;s output.
          </P>
          <Pre>{`{
  "method": "POST",
  "url": "https://api.example.com/users/{{input.userId}}",
  "headers": { "Authorization": "Bearer {{input.token}}" },
  "body":    { "status": "active", "plan": "{{input.plan}}" },
  "timeoutMs": 5000
}`}</Pre>

          <H3 id="transform">Transform</H3>
          <P>
            Evaluates a JavaScript expression to reshape, filter, or compute data. The expression
            receives <Code>input</Code> (the previous node&apos;s output) and must return a plain
            object or primitive.
          </P>
          <Pre>{`// Rename / combine fields
({ name: input.firstName + ' ' + input.lastName })

// Derive a boolean
({ isPremium: input.plan === 'pro' })

// Compute a value
({ discountPct: input.plan === 'pro' ? 20 : 0 })

// Pluck a nested field
({ userId: input.data.user.id })

// Pass through unchanged
input`}</Pre>
          <Note>
            The expression runs in a sandboxed Node.js VM. Network calls and filesystem access
            are not available. Keep transforms pure and fast.
          </Note>

          <H3 id="condition">Condition</H3>
          <P>
            Evaluates a boolean expression against <Code>input</Code> and routes execution down
            the <strong style={{ color: '#3FB950' }}>true</strong> or{' '}
            <strong style={{ color: '#8B949E' }}>false</strong> branch. Connect a node to each
            handle on the canvas — leaving a branch empty skips it silently.
          </P>
          <DocTable
            headers={['Operator', 'Passes when…']}
            rows={[
              [<Code key="eq">eq</Code>, 'field === value (strict equality)'],
              [<Code key="neq">neq</Code>, 'field !== value'],
              [<Code key="gt">gt</Code>, 'field > value (numeric)'],
              [<Code key="lt">lt</Code>, 'field < value (numeric)'],
              [<Code key="con">contains</Code>, 'string field includes value'],
              [<Code key="ex">exists</Code>, 'field is not null or undefined'],
            ]}
          />
          <Pre>{`{
  "field":    "plan",
  "operator": "eq",
  "value":    "pro"
}`}</Pre>

          <H3 id="delay">Delay</H3>
          <P>
            Pauses execution for a fixed duration before passing <Code>input</Code> unchanged to
            the next node. Useful for rate-limiting, waiting for external systems, or staggering
            notifications.
          </P>
          <DocTable
            headers={['Field', 'Type', 'Description']}
            rows={[
              ['durationMs', 'number', 'How long to pause in milliseconds'],
            ]}
          />
          <Pre>{`{ "durationMs": 3000 }   // pause for 3 seconds`}</Pre>

          <H3 id="notify">Notify</H3>
          <P>
            Sends an email or Slack message as a workflow step.{' '}
            <Code>{'{{input.field}}'}</Code> interpolation works in every text field.
          </P>
          <P>
            <strong style={{ color: '#E6EDF3' }}>Email</strong>
          </P>
          <DocTable
            headers={['Field', 'Description']}
            rows={[
              ['to', <>Recipient address. Supports <Code>{'{{input.x}}'}</Code></>],
              ['subject', <>Email subject. Supports <Code>{'{{input.x}}'}</Code></>],
              ['body', <>Plain-text or HTML body. Supports <Code>{'{{input.x}}'}</Code></>],
            ]}
          />
          <P>
            <strong style={{ color: '#E6EDF3' }}>Slack</strong>
          </P>
          <DocTable
            headers={['Field', 'Description']}
            rows={[
              ['webhookUrl', 'Slack incoming webhook URL (from your Slack app settings)'],
              ['message', <>Message text. Supports <Code>{'{{input.x}}'}</Code> and Slack mrkdwn</>],
            ]}
          />
          <Pre>{`// Email config
{
  "to":      "{{input.email}}",
  "subject": "Welcome to Flow, {{input.name}}!",
  "body":    "Your account is ready. Plan: {{input.plan}}"
}

// Slack config
{
  "webhookUrl": "https://hooks.slack.com/services/...",
  "message":    "*New signup:* {{input.email}} (plan: {{input.plan}})"
}`}</Pre>

          {/* ══════════════════════════════════════════════════════════════════
              TRIGGERS
          ══════════════════════════════════════════════════════════════════ */}

          <H2 id="webhook">Webhook</H2>
          <P>
            Webhook-triggered workflows fire when a valid POST hits the workflow&apos;s unique
            endpoint. Every workflow generates a <Code>webhookSecret</Code> on creation — pass it
            as the <Code>x-flow-secret</Code> header.
          </P>
          <Pre>{`curl -X POST https://your-api/api/webhooks/<workflowId> \\
  -H "Content-Type: application/json" \\
  -H "x-flow-secret: <webhookSecret>" \\
  -d '{"userId": "abc123", "plan": "pro"}'

# 202 Accepted
{ "executionId": "uuid", "message": "Execution queued" }`}</Pre>
          <P>
            The request body becomes the trigger node&apos;s output and flows into the first action
            node as <Code>input</Code>. Execution is async — you get the <Code>executionId</Code>{' '}
            immediately and can stream updates via SSE.
          </P>
          <DocTable
            headers={['Response code', 'Reason']}
            rows={[
              ['202', 'Accepted — execution queued'],
              ['401', 'Missing or invalid x-flow-secret'],
              ['403', 'Workflow is inactive (isActive: false)'],
              ['404', 'Workflow not found'],
            ]}
          />

          <H3 id="cron-schedule">Cron Schedule</H3>
          <P>
            Set <Code>cronExpression</Code> on any workflow to make it fire on a schedule. The
            workflow must also have <Code>isActive: true</Code>. Uses standard 5-field cron syntax.
          </P>
          <DocTable
            headers={['Expression', 'Fires…']}
            rows={[
              [<Code key="1">{'0 * * * *'}</Code>, 'Every hour on the hour'],
              [<Code key="2">{'0 9 * * 1-5'}</Code>, 'Weekdays at 09:00'],
              [<Code key="3">{'*/15 * * * *'}</Code>, 'Every 15 minutes'],
              [<Code key="4">{'0 0 1 * *'}</Code>, 'First day of every month at midnight'],
              [<Code key="5">{'30 18 * * 5'}</Code>, 'Fridays at 18:30'],
            ]}
          />
          <P>
            Update via <Code>PUT /api/workflows/:id</Code> with <Code>cronExpression</Code> and{' '}
            <Code>{"isActive: true"}</Code>.
          </P>
          <Pre>{`curl -X PUT https://your-api/api/workflows/<id> \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"isActive": true, "cronExpression": "0 9 * * 1-5"}'`}</Pre>

          <H3 id="manual">Manual</H3>
          <P>
            Click <strong style={{ color: '#E6EDF3' }}>Run</strong> in the canvas toolbar to fire
            immediately, or call the execute endpoint programmatically:
          </P>
          <Pre>{`curl -X POST https://your-api/api/workflows/<workflowId>/execute \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"payload": {"key": "value"}}'`}</Pre>
          <P>
            The <Code>payload</Code> object becomes the trigger node&apos;s output and is available
            as <Code>input</Code> in the first action node.
          </P>

          {/* ══════════════════════════════════════════════════════════════════
              EXECUTION
          ══════════════════════════════════════════════════════════════════ */}

          <H2 id="how-execution-works">How execution works</H2>
          <P>
            Every execution is async. The trigger creates an execution record, then steps are
            processed one at a time by a BullMQ worker. Each step receives the previous step&apos;s
            output as its input.
          </P>
          <Pre>{`Trigger fires
  → API creates execution (status: running)
  → Step 1 enqueued in BullMQ
  → Worker picks up job
      → runs node logic
      → persists output + timing
  → Step 2 enqueued with Step 1 output as input
  → ...
  → Final step completes
  → Execution marked success`}</Pre>
          <P>
            Each step&apos;s input, output, status, attempt number, and timing are persisted in the
            database — every run is fully auditable in the run history view.
          </P>
          <DocTable
            headers={['Execution status', 'Meaning']}
            rows={[
              [<Code key="q">queued</Code>, 'Trigger received, not yet started'],
              [<Code key="r">running</Code>, 'One or more steps currently executing'],
              [<Code key="s">success</Code>, 'All steps completed successfully'],
              [<Code key="f">failed</Code>, 'A step failed after all retry attempts'],
              [<Code key="c">cancelled</Code>, 'Manually cancelled via the API or canvas'],
            ]}
          />

          <H3 id="retries-failures">Retries & failures</H3>
          <P>
            BullMQ automatically retries failed jobs with exponential backoff. By default, a step
            retries up to <strong style={{ color: '#E6EDF3' }}>3 times</strong>. If all attempts
            fail, the step is marked <Code>failed</Code> and execution halts.
          </P>
          <DocTable
            headers={['Step status', 'Meaning']}
            rows={[
              [<Code key="p">pending</Code>, 'Waiting to be picked up by the worker'],
              [<Code key="r">running</Code>, 'Currently executing (this attempt)'],
              [<Code key="s">success</Code>, 'Completed successfully'],
              [<Code key="f">failed</Code>, 'All retry attempts exhausted'],
              [<Code key="sk">skipped</Code>, 'Condition branch not taken — node bypassed'],
            ]}
          />
          <P>
            The full error message is stored on the step log and visible in the run history view
            under each failed node.
          </P>

          <H3 id="live-logs">Live logs (SSE)</H3>
          <P>
            While an execution is running, subscribe to its SSE stream for real-time node status
            updates. The canvas does this automatically when you run a workflow.
          </P>
          <Pre>{`GET /api/executions/:executionId/stream
Authorization: Bearer <token>
Accept: text/event-stream`}</Pre>
          <P>Three event types are emitted:</P>
          <Pre>{`// Connection confirmed
data: {"type":"connected","executionId":"uuid"}

// Node status update
data: {
  "type":       "step_update",
  "stepLogId":  "uuid",
  "nodeId":     "uuid",
  "nodeLabel":  "Fetch User",
  "status":     "running",
  "output":     null,
  "error":      null,
  "startedAt":  "2025-05-09T10:00:00Z",
  "finishedAt": null
}

// Execution finished
data: {
  "type":       "execution_completed",
  "status":     "success",
  "finishedAt": "2025-05-09T10:00:05Z",
  "error":      null
}

// Keep-alive (every 30 s — not a data event)
: keep-alive`}</Pre>

          {/* ══════════════════════════════════════════════════════════════════
              API REFERENCE
          ══════════════════════════════════════════════════════════════════ */}

          <H2 id="api-reference">API Reference</H2>
          <P>
            Base URL: <Code>http://localhost:5000</Code>
          </P>
          <P>
            All protected routes require{' '}
            <Code>Authorization: Bearer &lt;supabase-jwt&gt;</Code>. Obtain a token via Supabase
            after signing in.
          </P>

          <H3 id="api-auth">Auth</H3>
          <DocTable
            headers={['Method', 'Endpoint', 'Auth', 'Returns']}
            rows={[
              ['GET', '/auth/me', 'JWT', 'Current user profile — creates one on first visit'],
              ['PUT', '/auth/me', 'JWT', 'Updated profile'],
            ]}
          />
          <Pre>{`# GET /auth/me
{ "id": "uuid", "username": "sambit", "avatarUrl": "...", "createdAt": "..." }

# PUT /auth/me
{ "username": "string", "avatarUrl": "string" }`}</Pre>

          <H3 id="api-workflows">Workflows</H3>
          <DocTable
            headers={['Method', 'Endpoint', 'Auth', 'Returns']}
            rows={[
              ['GET', '/api/workflows', 'JWT', 'Array of all non-deleted workflows'],
              ['GET', '/api/workflows/:id', 'JWT', 'Workflow with nested nodes and edges'],
              ['POST', '/api/workflows', 'JWT', 'Newly created workflow'],
              ['PUT', '/api/workflows/:id', 'JWT', 'Updated workflow'],
              ['DELETE', '/api/workflows/:id', 'JWT', 'Soft-deleted workflow'],
              ['POST', '/api/workflows/:id/execute', 'JWT', '{ executionId, message }'],
            ]}
          />
          <Pre>{`# POST /api/workflows
{ "name": "My Workflow", "description": "Optional description" }

# PUT /api/workflows/:id
{
  "name":           "string",
  "description":    "string",
  "isActive":       true,
  "cronExpression": "0 9 * * 1-5"
}

# POST /api/workflows/:id/execute
{ "payload": {} }`}</Pre>

          <H3 id="api-nodes-edges">Nodes & Edges</H3>
          <DocTable
            headers={['Method', 'Endpoint', 'Auth', 'Description']}
            rows={[
              ['PUT', '/api/workflows/:wfId/nodes', 'JWT', 'Transactional replace of all nodes'],
              ['POST', '/api/workflows/:wfId/nodes/:nodeId', 'JWT', 'Update a single node'],
              ['DELETE', '/api/workflows/:wfId/nodes/:nodeId', 'JWT', 'Soft-delete a node'],
              ['PUT', '/api/workflows/:wfId/edges', 'JWT', 'Replace all edges'],
              ['DELETE', '/api/workflows/:wfId/edges/:edgeId', 'JWT', 'Hard-delete an edge'],
            ]}
          />
          <Pre>{`# PUT /api/workflows/:wfId/nodes
{
  "nodes": [
    {
      "id":         "uuid",
      "type":       "httpRequest",
      "label":      "Fetch User",
      "config":     { "method": "GET", "url": "https://example.com/users/{{input.id}}" },
      "positionX":  200,
      "positionY":  100,
      "orderIndex": 1
    }
  ]
}

# PUT /api/workflows/:wfId/edges
{
  "edges": [
    {
      "id":       "uuid",
      "sourceId": "node-uuid-a",
      "targetId": "node-uuid-b",
      "branch":   null
    }
  ]
}
# branch is "true" or "false" for Condition node outputs, null otherwise`}</Pre>

          <H3 id="api-executions">Executions</H3>
          <DocTable
            headers={['Method', 'Endpoint', 'Auth', 'Returns']}
            rows={[
              ['GET', '/api/workflows/:wfId/executions', 'JWT', 'Last 50 executions, newest first'],
              ['GET', '/api/workflows/:wfId/executions/:execId', 'JWT', 'Execution + stepLogs array'],
              ['GET', '/api/workflows/:wfId/executions/:execId/logs', 'JWT', 'Step logs ordered by startedAt'],
              ['DELETE', '/api/workflows/:wfId/executions/:execId', 'JWT', 'Cancel a running execution'],
            ]}
          />
          <P>Step log object shape:</P>
          <Pre>{`{
  "id":            "uuid",
  "executionId":   "uuid",
  "nodeId":        "uuid",
  "nodeType":      "httpRequest",
  "nodeLabel":     "Fetch User",
  "status":        "success",
  "attemptNumber": 1,
  "input":         { ... },
  "output":        { ... },
  "error":         null,
  "startedAt":     "2025-05-09T10:00:00Z",
  "finishedAt":    "2025-05-09T10:00:01Z"
}`}</Pre>

          <H3 id="api-webhooks">Webhooks</H3>
          <DocTable
            headers={['Method', 'Endpoint', 'Auth', 'Returns']}
            rows={[
              ['POST', '/api/webhooks/:workflowId', 'x-flow-secret header', '202 — { executionId, message }'],
            ]}
          />
          <Pre>{`curl -X POST http://localhost:5000/api/webhooks/<workflowId> \\
  -H "x-flow-secret: <webhookSecret>" \\
  -H "Content-Type: application/json" \\
  -d '{"event": "user.signup", "userId": "abc123", "plan": "pro"}'

# 202 Accepted
{ "executionId": "uuid", "message": "Execution queued" }`}</Pre>

          <H3 id="api-streams">Streams</H3>
          <DocTable
            headers={['Method', 'Endpoint', 'Auth', 'Returns']}
            rows={[
              ['GET', '/api/executions/:execId/stream', 'JWT', 'text/event-stream — real-time events'],
            ]}
          />
          <Pre>{`curl -N http://localhost:5000/api/executions/<execId>/stream \\
  -H "Authorization: Bearer <token>" \\
  -H "Accept: text/event-stream"

data: {"type":"connected","executionId":"..."}
data: {"type":"step_update","nodeId":"...","status":"running",...}
data: {"type":"step_update","nodeId":"...","status":"success","output":{...},...}
data: {"type":"execution_completed","status":"success","finishedAt":"..."}
: keep-alive`}</Pre>

        </div>
      </main>
    </div>
  );
}
