import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/MarketingNav';

// ── Icons ──────────────────────────────────────────────────────────────────────

function CanvasIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="6.5" height="6.5" rx="1.5" />
      <rect x="11.5" y="2" width="6.5" height="6.5" rx="1.5" />
      <rect x="2" y="11.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="11.5" y="11.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  );
}

function TriggerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 2L4 11h6l-1 7 7-9h-6l1-7z" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3.5" width="16" height="3.5" rx="1" />
      <rect x="2" y="9" width="12" height="3.5" rx="1" />
      <rect x="2" y="14.5" width="8" height="3.5" rx="1" />
    </svg>
  );
}

function LogsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5,13 5,8 8.5,11 12,5.5 15.5,9 19,4" />
      <path d="M1.5 17h17" strokeOpacity="0.35" />
    </svg>
  );
}

function NotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2a5 5 0 0 1 5 5v3.5l1.5 2H3.5l1.5-2V7a5 5 0 0 1 5-5z" />
      <path d="M8 14.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <polyline points="10,5.5 10,10 13,12" />
    </svg>
  );
}

// ── Hero background ────────────────────────────────────────────────────────────

function HeroBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 80% 60% at 50% -15%, rgba(56,139,253,0.15) 0%, transparent 65%)',
            'radial-gradient(ellipse 50% 40% at 88% 85%, rgba(188,140,255,0.07) 0%, transparent 55%)',
          ].join(', '),
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 700"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.07 }}
      >
        <g style={{ animation: 'node-graph-drift 10s ease-in-out infinite' }}>
          <rect x="60" y="130" width="130" height="38" rx="6" stroke="#388BFD" strokeWidth="1.5" fill="none" />
          <rect x="240" y="96" width="110" height="38" rx="6" stroke="#39D353" strokeWidth="1.5" fill="none" />
          <rect x="240" y="172" width="110" height="38" rx="6" stroke="#388BFD" strokeWidth="1.5" fill="none" />
          <line x1="190" y1="149" x2="240" y2="115" stroke="#388BFD" strokeWidth="1.2" />
          <line x1="190" y1="149" x2="240" y2="191" stroke="#388BFD" strokeWidth="1.2" />
        </g>
        <g style={{ animation: 'node-graph-drift 12s 1.5s ease-in-out infinite' }}>
          <rect x="620" y="210" width="120" height="38" rx="6" stroke="#D29922" strokeWidth="1.5" fill="none" />
          <rect x="800" y="170" width="110" height="38" rx="6" stroke="#388BFD" strokeWidth="1.5" fill="none" />
          <rect x="800" y="248" width="110" height="38" rx="6" stroke="#BC8CFF" strokeWidth="1.5" fill="none" />
          <line x1="740" y1="229" x2="800" y2="189" stroke="#388BFD" strokeWidth="1.2" />
          <line x1="740" y1="229" x2="800" y2="267" stroke="#388BFD" strokeWidth="1.2" />
        </g>
        <g style={{ animation: 'node-graph-drift 9s 2.5s ease-in-out infinite' }}>
          <rect x="1120" y="110" width="120" height="38" rx="6" stroke="#39D353" strokeWidth="1.5" fill="none" />
          <rect x="1120" y="188" width="120" height="38" rx="6" stroke="#388BFD" strokeWidth="1.5" fill="none" />
          <rect x="1300" y="149" width="80" height="38" rx="6" stroke="#388BFD" strokeWidth="1.5" fill="none" />
          <line x1="1240" y1="129" x2="1300" y2="168" stroke="#388BFD" strokeWidth="1.2" />
          <line x1="1240" y1="207" x2="1300" y2="168" stroke="#388BFD" strokeWidth="1.2" />
        </g>
        <g style={{ animation: 'node-graph-drift 14s 0.8s ease-in-out infinite' }}>
          <rect x="450" y="45" width="100" height="32" rx="6" stroke="#388BFD" strokeWidth="1" fill="none" />
          <rect x="700" y="35" width="90" height="32" rx="6" stroke="#39D353" strokeWidth="1" fill="none" />
          <line x1="550" y1="61" x2="700" y2="51" stroke="#388BFD" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}

// ── Workflow diagram (Use Case section) ────────────────────────────────────────

function WorkflowDiagram() {
  return (
    <svg
      viewBox="0 0 720 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '720px', height: 'auto' }}
      role="img"
      aria-label="New User Onboarding: Webhook → Fetch User → Check Plan → Send Email or Slack Alert"
    >
      <defs>
        <pattern id="wf-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="0.8" fill="#21262D" />
        </pattern>
      </defs>

      {/* Container */}
      <rect width="720" height="220" rx="10" fill="#0D1117" stroke="#21262D" strokeWidth="1" />
      <rect width="720" height="220" rx="10" fill="url(#wf-grid)" />

      {/* ── Edges ── */}
      {/* Webhook output (132,110) → HTTP input (198,110) */}
      <line x1="132" y1="110" x2="198" y2="110" stroke="#388BFD" strokeWidth="2" strokeOpacity="0.6" />
      {/* HTTP output (312,110) → Condition input (378,110) */}
      <line x1="312" y1="110" x2="378" y2="110" stroke="#388BFD" strokeWidth="2" strokeOpacity="0.6" />
      {/* Condition true handle (492,98) → Email input (571,48) */}
      <path d="M 492 98 C 528 98 528 48 571 48" stroke="#3FB950" strokeWidth="2" strokeOpacity="0.8" />
      {/* Condition false handle (492,122) → Slack input (571,170) */}
      <path d="M 492 122 C 528 122 528 170 571 170" stroke="#388BFD" strokeWidth="2" strokeOpacity="0.5" />

      {/* Branch labels */}
      <text x="509" y="76" fontSize="9" fill="#3FB950" fontFamily="IBM Plex Mono" fontWeight="500">true</text>
      <text x="507" y="150" fontSize="9" fill="#8B949E" fontFamily="IBM Plex Mono">false</text>

      {/* ── Node 1: Webhook Trigger ── translate(10,88) */}
      <g transform="translate(10, 88)">
        <rect width="130" height="44" rx="6" fill="#161B22" stroke="#21262D" strokeWidth="1" />
        <rect width="3" height="44" rx="1.5" fill="#39D353" />
        <text x="14" y="16" fontSize="9" fill="#39D353" fontFamily="IBM Plex Mono" fontWeight="500" letterSpacing="0.06em">TRIGGER</text>
        <text x="14" y="31" fontSize="12" fill="#E6EDF3" fontFamily="IBM Plex Sans" fontWeight="600">Webhook</text>
        {/* output handle */}
        <circle cx="122" cy="22" r="4" fill="#161B22" stroke="#30363D" strokeWidth="1.5" />
      </g>

      {/* ── Node 2: HTTP Request ── translate(190,88) */}
      <g transform="translate(190, 88)">
        <rect width="130" height="44" rx="6" fill="#161B22" stroke="#21262D" strokeWidth="1" />
        <rect width="3" height="44" rx="1.5" fill="#388BFD" />
        <text x="14" y="16" fontSize="9" fill="#388BFD" fontFamily="IBM Plex Mono" fontWeight="500" letterSpacing="0.06em">HTTP</text>
        <text x="14" y="31" fontSize="12" fill="#E6EDF3" fontFamily="IBM Plex Sans" fontWeight="600">Fetch User</text>
        <circle cx="8" cy="22" r="4" fill="#161B22" stroke="#30363D" strokeWidth="1.5" />
        <circle cx="122" cy="22" r="4" fill="#161B22" stroke="#30363D" strokeWidth="1.5" />
      </g>

      {/* ── Node 3: Condition ── translate(370,88) */}
      <g transform="translate(370, 88)">
        <rect width="130" height="44" rx="6" fill="#161B22" stroke="#21262D" strokeWidth="1" />
        <rect width="3" height="44" rx="1.5" fill="#D29922" />
        <text x="14" y="16" fontSize="9" fill="#D29922" fontFamily="IBM Plex Mono" fontWeight="500" letterSpacing="0.06em">CONDITION</text>
        <text x="14" y="31" fontSize="12" fill="#E6EDF3" fontFamily="IBM Plex Sans" fontWeight="600">Check Plan</text>
        <circle cx="8" cy="22" r="4" fill="#161B22" stroke="#30363D" strokeWidth="1.5" />
        {/* true output (top) */}
        <circle cx="122" cy="10" r="4" fill="#161B22" stroke="#3FB950" strokeWidth="1.5" />
        {/* false output (bottom) */}
        <circle cx="122" cy="34" r="4" fill="#161B22" stroke="#30363D" strokeWidth="1.5" />
      </g>

      {/* ── Node 4: Email Notify ── translate(563,26) */}
      <g transform="translate(563, 26)">
        <rect width="130" height="44" rx="6" fill="#161B22" stroke="#21262D" strokeWidth="1" />
        <rect width="3" height="44" rx="1.5" fill="#388BFD" />
        <text x="14" y="16" fontSize="9" fill="#388BFD" fontFamily="IBM Plex Mono" fontWeight="500" letterSpacing="0.06em">NOTIFY</text>
        <text x="14" y="31" fontSize="12" fill="#E6EDF3" fontFamily="IBM Plex Sans" fontWeight="600">Send Email</text>
        <circle cx="8" cy="22" r="4" fill="#161B22" stroke="#30363D" strokeWidth="1.5" />
      </g>

      {/* ── Node 5: Slack Notify ── translate(563,148) */}
      <g transform="translate(563, 148)">
        <rect width="130" height="44" rx="6" fill="#161B22" stroke="#21262D" strokeWidth="1" />
        <rect width="3" height="44" rx="1.5" fill="#388BFD" />
        <text x="14" y="16" fontSize="9" fill="#388BFD" fontFamily="IBM Plex Mono" fontWeight="500" letterSpacing="0.06em">NOTIFY</text>
        <text x="14" y="31" fontSize="12" fill="#E6EDF3" fontFamily="IBM Plex Sans" fontWeight="600">Slack Alert</text>
        <circle cx="8" cy="22" r="4" fill="#161B22" stroke="#30363D" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: CanvasIcon,
    color: '#388BFD',
    title: 'Visual Canvas',
    desc: 'React Flow node editor with drag-and-drop. Build complex workflows visually with custom node types for every operation.',
  },
  {
    Icon: TriggerIcon,
    color: '#39D353',
    title: 'Event Triggers',
    desc: 'Webhook, cron schedule, or manual run. Every trigger type is a first-class node on the canvas.',
  },
  {
    Icon: QueueIcon,
    color: '#BC8CFF',
    title: 'Async Execution',
    desc: 'BullMQ queue with retries, concurrency control, and failure handling baked in. Resilient by default.',
  },
  {
    Icon: LogsIcon,
    color: '#388BFD',
    title: 'Live Logs',
    desc: 'SSE streams node status to the canvas as it runs. Watch every step execute and complete in real time.',
  },
  {
    Icon: NotifyIcon,
    color: '#D29922',
    title: 'Notify',
    desc: 'Send emails or Slack messages as workflow steps. Template variables pull data from any prior node.',
  },
  {
    Icon: HistoryIcon,
    color: '#39D353',
    title: 'Full History',
    desc: 'Step-by-step run logs with input and output for every node. Every execution is recorded and queryable.',
  },
];

const STEPS = [
  { num: '01', color: '#388BFD', title: 'Design', desc: 'Drag and drop nodes onto a canvas. Connect them into a workflow.' },
  { num: '02', color: '#39D353', title: 'Trigger', desc: 'Fire from a webhook, a cron schedule, or manually with one click.' },
  { num: '03', color: '#BC8CFF', title: 'Watch', desc: 'Live execution streams to the canvas. Every step logged in real time.' },
];

const STACK = ['Next.js', 'React Flow', 'Node.js', 'BullMQ', 'Redis', 'PostgreSQL', 'Supabase', 'Turborepo'];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: '#080B11', color: '#E6EDF3', minHeight: '100vh' }}>
      <MarketingNav />

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          minHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '96px 24px 80px',
        }}
      >
        <HeroBg />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto' }}>
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 mb-8"
            style={{
              padding: '5px 16px',
              borderRadius: '9999px',
              background: 'rgba(56,139,253,0.1)',
              border: '1px solid rgba(56,139,253,0.2)',
              color: '#58A6FF',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#388BFD',
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Open Source · Visual Workflow Automation
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(40px, 7vw, 76px)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#E6EDF3',
              marginBottom: '24px',
            }}
          >
            Automate anything.
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #388BFD 0%, #BC8CFF 55%, #39D353 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Visually.
            </span>
          </h1>

          {/* Subheadline */}
          <p
            style={{
              maxWidth: '560px',
              margin: '0 auto 44px',
              fontSize: '18px',
              lineHeight: 1.65,
              color: '#8B949E',
            }}
          >
            Flow is an open-source workflow automation system. Design automations as node
            graphs, trigger them from anywhere, and watch them execute in real time.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(56,139,253,0.3)]"
              style={{
                padding: '13px 26px',
                borderRadius: '6px',
                background: '#388BFD',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
              }}
            >
              Get Started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <a
              href="https://github.com/Sambit03/CAPSTONE"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-all hover:-translate-y-0.5"
              style={{
                padding: '13px 24px',
                borderRadius: '6px',
                background: '#161B22',
                border: '1px solid #30363D',
                color: '#E6EDF3',
                fontWeight: 500,
                fontSize: '15px',
              }}
            >
              <svg height="17" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #21262D', background: '#0D1117' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#E6EDF3',
                marginBottom: '10px',
                letterSpacing: '-0.02em',
              }}
            >
              How it works
            </h2>
            <p style={{ fontSize: '16px', color: '#8B949E' }}>
              From canvas to execution in three steps
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {STEPS.map((step) => (
              <div
                key={step.num}
                style={{
                  background: '#161B22',
                  border: '1px solid #21262D',
                  borderRadius: '10px',
                  padding: '36px 32px',
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 600,
                    color: step.color,
                    letterSpacing: '0.1em',
                    marginBottom: '20px',
                    opacity: 0.85,
                  }}
                >
                  {step.num}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#E6EDF3', marginBottom: '10px' }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.65, color: '#8B949E' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #21262D', background: '#080B11' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#E6EDF3',
                marginBottom: '10px',
                letterSpacing: '-0.02em',
              }}
            >
              Everything you need
            </h2>
            <p style={{ fontSize: '16px', color: '#8B949E' }}>
              A complete automation runtime, out of the box
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {FEATURES.map(({ Icon, color, title, desc }) => (
              <div
                key={title}
                className="hover:-translate-y-0.5 transition-all duration-200"
                style={{
                  background: '#0D1117',
                  border: '1px solid #21262D',
                  borderRadius: '10px',
                  padding: '28px',
                }}
              >
                <div
                  className="inline-flex items-center justify-center mb-4"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: `${color}18`,
                    color,
                  }}
                >
                  <Icon />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#E6EDF3', marginBottom: '8px' }}>
                  {title}
                </h3>
                <p style={{ fontSize: '13px', lineHeight: 1.65, color: '#8B949E' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Case ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #21262D', background: '#0D1117' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#E6EDF3',
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}
          >
            From idea to automation in minutes
          </h2>
          <p style={{ fontSize: '16px', color: '#8B949E', marginBottom: '48px' }}>
            Build a real workflow without writing a single line of code
          </p>

          <div className="flex justify-center">
            <WorkflowDiagram />
          </div>

          <p
            style={{
              marginTop: '20px',
              fontSize: '13px',
              color: '#484F58',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Webhook fires on signup → fetch user → check plan → send personalised email or Slack alert
          </p>
        </div>
      </section>

      {/* ── Tech Stack ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '64px 24px', borderTop: '1px solid #21262D', background: '#080B11' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.09em',
              color: '#484F58',
              textTransform: 'uppercase',
              marginBottom: '28px',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            Built with
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {STACK.map((tech) => (
              <span
                key={tech}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: '#161B22',
                  border: '1px solid #21262D',
                  color: '#8B949E',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: '100px 24px',
          borderTop: '1px solid #21262D',
          background: '#0D1117',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 700,
              color: '#E6EDF3',
              letterSpacing: '-0.02em',
              marginBottom: '14px',
            }}
          >
            Start building your first workflow
          </h2>
          <p style={{ fontSize: '16px', color: '#8B949E', marginBottom: '36px' }}>
            Free to use. Open source. Self-hostable.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(56,139,253,0.3)]"
            style={{
              padding: '14px 32px',
              borderRadius: '6px',
              background: '#388BFD',
              color: '#fff',
              fontWeight: 600,
              fontSize: '16px',
            }}
          >
            Create Free Account
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer bar ────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid #21262D',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div className="flex items-center gap-2" style={{ fontWeight: 600, fontSize: '14px', color: '#E6EDF3' }}>
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="10" fill="#0D1117" stroke="#388BFD" strokeWidth="1.5" />
            <circle cx="7.5" cy="8.5" r="2" fill="#39D353" />
            <circle cx="14.5" cy="8.5" r="2" fill="#388BFD" />
            <circle cx="11" cy="15" r="2" fill="#D29922" />
          </svg>
          Flow
        </div>
        <p style={{ fontSize: '13px', color: '#484F58' }}>Capstone project · Visual workflow automation</p>
        <a
          href="https://github.com/Sambit03/CAPSTONE"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#E6EDF3] transition-colors"
          style={{ fontSize: '13px', color: '#8B949E' }}
        >
          GitHub →
        </a>
      </footer>
    </div>
  );
}
