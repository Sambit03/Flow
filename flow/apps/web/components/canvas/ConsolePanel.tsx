'use client';

import { useState } from 'react';
import { useCanvasStore, type ConsoleEntry } from '@/store';

type Level = ConsoleEntry['level'];
type Filter = 'all' | 'error' | 'warning' | 'log';

const LEVEL_ICON: Record<Level, string> = {
  error:   '✕',
  warning: '⚠',
  log:     '·',
};

const LEVEL_COLOR: Record<Level, string> = {
  error:   '#F85149',
  warning: '#D29922',
  log:     '#484F58',
};

const FILTER_LABELS: Record<Filter, string> = {
  all:     'All',
  error:   'Errors',
  warning: 'Warnings',
  log:     'Logs',
};

const FILTERS: Filter[] = ['all', 'error', 'warning', 'log'];

function formatTime(ts: number): string {
  return new Date(ts).toISOString().slice(11, 23);
}

export function ConsolePanel() {
  const consoleLogs      = useCanvasStore((s) => s.consoleLogs);
  const isConsoleOpen    = useCanvasStore((s) => s.isConsoleOpen);
  const consoleFilter    = useCanvasStore((s) => s.consoleFilter);
  const clearConsoleLogs = useCanvasStore((s) => s.clearConsoleLogs);
  const closeConsole     = useCanvasStore((s) => s.closeConsole);
  const setConsoleFilter = useCanvasStore((s) => s.setConsoleFilter);
  const selectNode       = useCanvasStore((s) => s.selectNode);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = consoleFilter === 'all'
    ? consoleLogs
    : consoleLogs.filter((e) => e.level === consoleFilter);

  if (!isConsoleOpen) return null;

  return (
    <div
      className="animate-slide-up"
      style={{
        height: 240,
        background: '#0D1117',
        borderTop: '1px solid #21262D',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          height: 36,
          borderBottom: '1px solid #21262D',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#E6EDF3',
            fontFamily: 'IBM Plex Mono, monospace',
          }}
        >
          Console
        </span>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setConsoleFilter(f)}
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                border: 'none',
                background: consoleFilter === f ? '#21262D' : 'transparent',
                color: consoleFilter === f ? '#E6EDF3' : '#484F58',
                cursor: 'pointer',
              }}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={clearConsoleLogs}
          style={{
            fontSize: 11,
            color: '#484F58',
            padding: '2px 8px',
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>

        <button
          onClick={closeConsole}
          style={{
            fontSize: 13,
            color: '#484F58',
            padding: '2px 6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>

      {/* Log rows */}
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'IBM Plex Mono, monospace' }}>
        {filtered.length === 0 && (
          <div
            style={{
              padding: '20px 16px',
              textAlign: 'center',
              color: '#484F58',
              fontSize: 12,
            }}
          >
            No output
          </div>
        )}

        {filtered.map((entry) => {
          const isError     = entry.level === 'error';
          const isExpanded  = expandedId === entry.id;
          const hasDetail   = entry.input !== undefined || entry.output !== undefined;

          return (
            <div key={entry.id}>
              <div
                onClick={() => {
                  if (isError) selectNode(entry.nodeId);
                  if (hasDetail) setExpandedId(isExpanded ? null : entry.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 12px',
                  background: isError ? 'rgba(248,81,73,0.05)' : 'transparent',
                  borderLeft: isError ? '2px solid #F85149' : '2px solid transparent',
                  borderBottom: '1px solid #21262D',
                  cursor: isError || hasDetail ? 'pointer' : 'default',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isError && !hasDetail) return;
                  (e.currentTarget as HTMLElement).style.background = isError
                    ? 'rgba(248,81,73,0.1)'
                    : 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isError
                    ? 'rgba(248,81,73,0.05)'
                    : 'transparent';
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: LEVEL_COLOR[entry.level],
                    width: 10,
                    flexShrink: 0,
                    textAlign: 'center',
                  }}
                >
                  {LEVEL_ICON[entry.level]}
                </span>

                <span style={{ fontSize: 10, color: '#484F58', width: 88, flexShrink: 0 }}>
                  {formatTime(entry.timestamp)}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: '#8B949E',
                    width: 120,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.nodeLabel}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: isError ? '#F85149' : '#8B949E',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.message}
                </span>

                {hasDetail && (
                  <span style={{ fontSize: 10, color: '#484F58', flexShrink: 0 }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                )}
              </div>

              {isExpanded && hasDetail && (
                <div
                  style={{
                    padding: '8px 12px 8px 36px',
                    background: '#161B22',
                    borderBottom: '1px solid #21262D',
                    fontSize: 10,
                    color: '#8B949E',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                  }}
                >
                  {entry.input !== undefined && (
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ color: '#484F58' }}>input  </span>
                      {JSON.stringify(entry.input, null, 2)}
                    </div>
                  )}
                  {entry.output !== undefined && (
                    <div>
                      <span style={{ color: '#484F58' }}>output </span>
                      {JSON.stringify(entry.output, null, 2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
