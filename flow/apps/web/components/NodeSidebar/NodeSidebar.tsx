'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/store';
import styles from './NodeSidebar.module.css';

const TRIGGER_SUBTYPES = ['manual', 'webhook', 'cron'] as const;
const ACTION_SUBTYPES  = ['http_request', 'transform', 'log'] as const;
const HTTP_METHODS     = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={styles.input} {...props} />;
}

function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={styles.textarea} rows={3} {...props} />;
}

/* ── Config panels per type ──────────────────────────── */

function TriggerConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const subtype = (config.subtype as string) || 'manual';
  const set = (key: string, val: unknown) => onChange({ ...config, [key]: val });

  return (
    <>
      <Field label="Trigger type">
        <Select value={subtype} onChange={(v) => set('subtype', v)} options={TRIGGER_SUBTYPES} />
      </Field>
      {subtype === 'webhook' && (
        <Field label="Webhook path">
          <Input placeholder="/my-webhook" value={(config.path as string) || ''} onChange={(e) => set('path', e.target.value)} />
        </Field>
      )}
      {subtype === 'cron' && (
        <Field label="Cron expression">
          <Input placeholder="* * * * *" value={(config.expression as string) || ''} onChange={(e) => set('expression', e.target.value)} />
          <span className={styles.hint}>e.g. "0 9 * * 1-5" — every weekday at 9am</span>
        </Field>
      )}
    </>
  );
}

function ActionConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const subtype = (config.subtype as string) || 'http_request';
  const set = (key: string, val: unknown) => onChange({ ...config, [key]: val });

  return (
    <>
      <Field label="Action type">
        <Select value={subtype} onChange={(v) => set('subtype', v)} options={ACTION_SUBTYPES} />
      </Field>

      {subtype === 'http_request' && (
        <>
          <Field label="URL">
            <Input placeholder="https://api.example.com/data" value={(config.url as string) || ''} onChange={(e) => set('url', e.target.value)} />
          </Field>
          <Field label="Method">
            <Select value={(config.method as string) || 'GET'} onChange={(v) => set('method', v)} options={HTTP_METHODS} />
          </Field>
          <Field label="Body (JSON)">
            <Textarea placeholder='{"key": "{{input.value}}"}' value={(config.body as string) || ''} onChange={(e) => set('body', e.target.value)} />
          </Field>
        </>
      )}

      {subtype === 'transform' && (
        <Field label="Transform expression">
          <Textarea
            placeholder="{ name: input.firstName + ' ' + input.lastName }"
            value={(config.expression as string) || ''}
            onChange={(e) => set('expression', e.target.value)}
            rows={5}
          />
          <span className={styles.hint}>Use <code>input</code> to reference previous step output</span>
        </Field>
      )}

      {subtype === 'log' && (
        <Field label="Message template">
          <Input placeholder="Step completed: {{input.id}}" value={(config.message as string) || ''} onChange={(e) => set('message', e.target.value)} />
        </Field>
      )}
    </>
  );
}

function ConditionConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) => onChange({ ...config, [key]: val });
  const OPERATORS = ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'exists'] as const;

  return (
    <>
      <Field label="Field (from input)">
        <Input placeholder="input.status" value={(config.field as string) || ''} onChange={(e) => set('field', e.target.value)} />
      </Field>
      <Field label="Operator">
        <Select value={(config.operator as string) || 'equals'} onChange={(v) => set('operator', v)} options={OPERATORS} />
      </Field>
      <Field label="Expected value">
        <Input placeholder="200" value={(config.expectedValue as string) || ''} onChange={(e) => set('expectedValue', e.target.value)} />
      </Field>
    </>
  );
}

function DelayConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const ms = Number(config.durationMs) || 1000;
  const seconds = ms / 1000;

  return (
    <Field label="Delay duration (seconds)">
      <Input
        type="number"
        min={0}
        step={0.5}
        value={seconds}
        onChange={(e) => onChange({ ...config, durationMs: Number(e.target.value) * 1000 })}
      />
    </Field>
  );
}

/* ── Main sidebar ────────────────────────────────────── */

export default function NodeSidebar() {
  const { nodes, selectedNodeId, selectNode, updateNodeConfig, updateNodeLabel } = useCanvasStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  const [localLabel, setLocalLabel] = useState('');

  useEffect(() => {
    setLocalLabel(node?.data?.label || '');
  }, [selectedNodeId, node?.data?.label]);

  if (!node) return null;

  function handleLabelBlur() {
    if (localLabel.trim() && selectedNodeId) {
      updateNodeLabel(selectedNodeId, localLabel.trim());
    }
  }

  function handleConfigChange(config: Record<string, unknown>) {
    if (selectedNodeId) updateNodeConfig(selectedNodeId, config);
  }

  const nodeType = node.data.type;
  const config = node.data.config || {};

  const typeColors: Record<string, string> = {
    trigger: '#10b981', action: '#6366f1', condition: '#f59e0b', delay: '#8b5cf6',
  };

  return (
    <aside className={`${styles.sidebar} animate-slide-in`}>
      <div className={styles.sidebarHeader}>
        <div className={styles.typePill} style={{ background: `${typeColors[nodeType]}22`, color: typeColors[nodeType] }}>
          {nodeType}
        </div>
        <button className={styles.closeBtn} onClick={() => selectNode(null)} aria-label="Close panel">✕</button>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Node</h3>
          <div className={styles.field}>
            <label>Label</label>
            <input
              className={styles.input}
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              onBlur={handleLabelBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleLabelBlur()}
              placeholder="Node label"
            />
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Configuration</h3>
          {nodeType === 'trigger'   && <TriggerConfig   config={config} onChange={handleConfigChange} />}
          {nodeType === 'action'    && <ActionConfig    config={config} onChange={handleConfigChange} />}
          {nodeType === 'condition' && <ConditionConfig config={config} onChange={handleConfigChange} />}
          {nodeType === 'delay'     && <DelayConfig     config={config} onChange={handleConfigChange} />}
        </div>

        {node.data.status === 'failed' && (
          <>
            <div className={styles.divider} />
            <div className={styles.errorPanel}>
              <span>⚠ Last run failed</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
