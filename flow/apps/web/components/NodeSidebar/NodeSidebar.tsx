'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const TRIGGER_SUBTYPES = ['manual', 'webhook', 'cron'] as const;
const ACTION_SUBTYPES  = ['http_request', 'transform', 'log', 'notify'] as const;
const HTTP_METHODS     = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const OPERATORS        = ['eq', 'neq', 'contains', 'gt', 'lt', 'exists'] as const;
const OPERATOR_LABELS: Record<string, string> = {
  eq: 'equals', neq: 'not equals', contains: 'contains', gt: 'greater than', lt: 'less than', exists: 'exists',
};

const TYPE_COLORS: Record<string, string> = {
  trigger: '#39D353', action: '#388BFD', condition: '#D29922', delay: '#8B949E',
};

/* ── Shared field primitives ─────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%', height: 32, padding: '0 10px', fontSize: 12,
  background: '#080B11', color: '#E6EDF3', border: '1px solid #30363D',
  borderRadius: 5, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.12s',
};

const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 12,
  background: '#080B11', color: '#E6EDF3', border: '1px solid #30363D',
  borderRadius: 5, outline: 'none', fontFamily: 'IBM Plex Mono, monospace',
  resize: 'vertical', lineHeight: 1.5,
};

const selectStyle: React.CSSProperties = {
  width: '100%', height: 32, padding: '0 10px', fontSize: 12,
  background: '#080B11', color: '#E6EDF3', border: '1px solid #30363D',
  borderRadius: 5, outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 500, color: '#8B949E',
  textTransform: 'uppercase', letterSpacing: '0.08em',
};

const hintStyle: React.CSSProperties = {
  fontSize: 11, color: '#484F58', lineHeight: 1.4,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}
      style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 4,
        border: '1px solid #30363D', background: 'transparent',
        color: copied ? '#3FB950' : '#8B949E', cursor: 'pointer', transition: 'color 0.12s',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

/* ── Config panels ─────────────────────────────────────── */

function TriggerConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const subtype = (config.subtype as string) || 'manual';
  const set = (key: string, val: unknown) => onChange({ ...config, [key]: val });
  const { workflowId, webhookSecret } = useCanvasStore();
  const webhookUrl = workflowId ? `${API_URL}/api/webhooks/${workflowId}` : '';

  return (
    <>
      <Field label="Trigger Type">
        <select style={selectStyle} value={subtype} onChange={(e) => set('subtype', e.target.value)}>
          {TRIGGER_SUBTYPES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>

      {subtype === 'webhook' && workflowId && (
        <>
          <Field label="Webhook URL">
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <code style={{ ...inputStyle, flex: 1, fontSize: 10, color: '#8B949E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {webhookUrl}
              </code>
              <CopyButton text={webhookUrl} />
            </div>
            <span style={hintStyle}>POST to this URL to trigger the workflow</span>
          </Field>
          {webhookSecret && (
            <Field label="Secret (x-flow-secret)">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <code style={{ ...inputStyle, flex: 1, fontSize: 10, color: '#8B949E' }}>
                  {webhookSecret}
                </code>
                <CopyButton text={webhookSecret} />
              </div>
            </Field>
          )}
        </>
      )}

      {subtype === 'cron' && (
        <Field label="Cron Expression">
          <input
            style={inputStyle}
            placeholder="0 9 * * 1-5"
            value={(config.expression as string) || ''}
            onChange={(e) => set('expression', e.target.value)}
          />
          <span style={hintStyle}>e.g. "0 9 * * 1-5" = every weekday at 9am. Save canvas to apply.</span>
        </Field>
      )}
    </>
  );
}

function ActionConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const subtype = (config.subtype as string) || 'http_request';
  const method = (config.method as string) || 'GET';
  // Always include subtype+method so defaults are persisted even if the user never touches those dropdowns
  const set = (key: string, val: unknown) => onChange({ ...config, subtype, method, [key]: val });

  return (
    <>
      <Field label="Action Type">
        <select style={selectStyle} value={subtype} onChange={(e) => set('subtype', e.target.value)}>
          {ACTION_SUBTYPES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>

      {subtype === 'http_request' && (
        <>
          <Field label="URL">
            <input style={inputStyle} placeholder="https://api.example.com/data" value={(config.url as string) || ''} onChange={(e) => set('url', e.target.value)} />
          </Field>
          <Field label="Method">
            <select style={selectStyle} value={(config.method as string) || 'GET'} onChange={(e) => set('method', e.target.value)}>
              {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Body (JSON)">
            <textarea style={{ ...textareaStyle, minHeight: 72 }} placeholder='{"key": "value"}' value={(config.body as string) || ''} onChange={(e) => set('body', e.target.value)} rows={3} />
          </Field>
        </>
      )}

      {subtype === 'transform' && (
        <Field label="Transform Expression">
          <textarea style={{ ...textareaStyle, minHeight: 96 }} placeholder="{ name: input.firstName + ' ' + input.lastName }" value={(config.expression as string) || ''} onChange={(e) => set('expression', e.target.value)} rows={4} />
          <span style={hintStyle}>Use <code>input</code> to reference previous step output</span>
        </Field>
      )}

      {subtype === 'log' && (
        <Field label="Message Template">
          <input style={inputStyle} placeholder="Step completed: {{input.id}}" value={(config.message as string) || ''} onChange={(e) => set('message', e.target.value)} />
        </Field>
      )}

      {subtype === 'notify' && <NotifyConfig config={config} onChange={onChange} />}
    </>
  );
}

function NotifyConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const channel = (config.channel as string) || 'email';
  const set = (key: string, val: unknown) => onChange({ ...config, subtype: 'notify', channel, [key]: val });
  const setChannel = (val: string) => onChange({ subtype: 'notify', channel: val });

  return (
    <>
      <Field label="Channel">
        <select style={selectStyle} value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="email">Email</option>
          <option value="slack">Slack</option>
        </select>
      </Field>

      {channel === 'email' && (
        <>
          <Field label="To">
            <input style={inputStyle} placeholder="{{input.email}}" value={(config.to as string) || ''} onChange={(e) => set('to', e.target.value)} />
            <span style={hintStyle}>Supports {'{{input.field}}'}</span>
          </Field>
          <Field label="Subject">
            <input style={inputStyle} placeholder="Hello, {{input.name}}!" value={(config.subject as string) || ''} onChange={(e) => set('subject', e.target.value)} />
          </Field>
          <Field label="Body">
            <textarea style={{ ...textareaStyle, minHeight: 100 }} placeholder={'Hi {{input.name}}, your workflow just ran.'} value={(config.body as string) || ''} onChange={(e) => set('body', e.target.value)} rows={5} />
            <span style={hintStyle}>Plain text or HTML</span>
          </Field>
        </>
      )}

      {channel === 'slack' && (
        <>
          <Field label="Slack Webhook URL">
            <input style={inputStyle} placeholder="https://hooks.slack.com/services/..." value={(config.webhookUrl as string) || ''} onChange={(e) => set('webhookUrl', e.target.value)} />
          </Field>
          <Field label="Message">
            <textarea style={{ ...textareaStyle, minHeight: 80 }} placeholder={'🚨 {{input.name}} triggered a workflow'} value={(config.message as string) || ''} onChange={(e) => set('message', e.target.value)} rows={4} />
          </Field>
          <Field label="Emoji (optional)">
            <input style={inputStyle} placeholder=":zap:" value={(config.emoji as string) || ''} onChange={(e) => set('emoji', e.target.value)} />
          </Field>
        </>
      )}
    </>
  );
}

function ConditionConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) => onChange({ ...config, [key]: val });

  return (
    <>
      <Field label="Field">
        <input style={inputStyle} placeholder="input.status" value={(config.field as string) || ''} onChange={(e) => set('field', e.target.value)} />
        <span style={hintStyle}>Dot-path into input, e.g. body.status</span>
      </Field>
      <Field label="Operator">
        <select style={selectStyle} value={(config.operator as string) || 'eq'} onChange={(e) => set('operator', e.target.value)}>
          {OPERATORS.map((o) => <option key={o} value={o}>{OPERATOR_LABELS[o]}</option>)}
        </select>
      </Field>
      {(config.operator as string) !== 'exists' && (
        <Field label="Value">
          <input style={inputStyle} placeholder="active" value={(config.value as string) || ''} onChange={(e) => set('value', e.target.value)} />
        </Field>
      )}
    </>
  );
}

function DelayConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const ms = Number(config.durationMs) || 1000;
  const [localValue, setLocalValue] = useState(String(ms / 1000));

  useEffect(() => {
    setLocalValue(String(Number(config.durationMs) / 1000 || 1));
  }, [config.durationMs]);

  const displayMs = Number(localValue) * 1000;
  const label = displayMs < 1000 ? `${displayMs}ms` : `${Number(localValue)}s`;

  return (
    <Field label="Duration (seconds)">
      <input
        style={inputStyle}
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9.]/g, '');
          setLocalValue(raw);
          const num = Number(raw);
          if (!isNaN(num) && num > 0) {
            onChange({ ...config, durationMs: num * 1000 });
          }
        }}
      />
      <span style={hintStyle}>= {label}</span>
    </Field>
  );
}

/* ── Main sidebar ────────────────────────────────────────── */

export default function NodeSidebar() {
  const { nodes, selectedNodeId, selectNode, updateNodeConfig, updateNodeLabel } = useCanvasStore();
  const node = nodes.find((n) => n.id === selectedNodeId);
  const [localLabel, setLocalLabel] = useState('');

  useEffect(() => {
    setLocalLabel(node?.data?.label || '');
  }, [selectedNodeId, node?.data?.label]);

  if (!node) return null;

  const nodeType = node.data.type;
  const config   = node.data.config || {};
  const color    = TYPE_COLORS[nodeType] ?? '#8B949E';

  function handleLabelBlur() {
    if (localLabel.trim() && selectedNodeId) updateNodeLabel(selectedNodeId, localLabel.trim());
  }

  function handleConfigChange(c: Record<string, unknown>) {
    if (selectedNodeId) updateNodeConfig(selectedNodeId, c);
  }

  return (
    <aside
      className="animate-slide-in"
      style={{
        width: 300,
        flexShrink: 0,
        height: '100%',
        background: '#0D1117',
        borderLeft: '1px solid #21262D',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #21262D',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontFamily: 'IBM Plex Mono, monospace',
            fontWeight: 600,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '2px 8px',
            background: `${color}18`,
            border: `1px solid ${color}30`,
            borderRadius: 4,
          }}
        >
          {nodeType}
        </span>
        <button
          onClick={() => selectNode(null)}
          style={{ color: '#484F58', fontSize: 14, padding: '4px 6px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
        {/* Label */}
        <Field label="Label">
          <input
            style={inputStyle}
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleLabelBlur()}
            placeholder="Node label"
          />
        </Field>

        <div style={{ height: 1, background: '#21262D' }} />

        {/* Config section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#484F58', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Configuration
          </span>
          {nodeType === 'trigger'   && <TriggerConfig   config={config} onChange={handleConfigChange} />}
          {nodeType === 'action'    && <ActionConfig    config={config} onChange={handleConfigChange} />}
          {nodeType === 'condition' && <ConditionConfig config={config} onChange={handleConfigChange} />}
          {nodeType === 'delay'     && <DelayConfig     config={config} onChange={handleConfigChange} />}
        </div>

        {/* Failed state callout */}
        {node.data.status === 'failed' && (
          <>
            <div style={{ height: 1, background: '#21262D' }} />
            <div style={{ padding: '10px 12px', background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.25)', borderRadius: 6, fontSize: 12, color: '#F85149' }}>
              ⚠ Last run step failed
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
