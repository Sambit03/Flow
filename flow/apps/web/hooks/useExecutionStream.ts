'use client';

import { useEffect, useRef, useState } from 'react';
import { useCanvasStore, useAuthStore } from '@/store';
import { authClient } from '@/lib/auth/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type ExecutionResult = 'success' | 'failed' | null;

export function useExecutionStream() {
  const activeExecutionId  = useCanvasStore((s) => s.activeExecutionId);
  const setNodeStatus      = useCanvasStore((s) => s.setNodeStatus);
  const clearNodeStatuses  = useCanvasStore((s) => s.clearNodeStatuses);
  const setActiveExecution = useCanvasStore((s) => s.setActiveExecution);

  const [isStreaming,  setIsStreaming]  = useState(false);
  const [lastResult,   setLastResult]   = useState<ExecutionResult>(null);

  // Keep an abort controller so we can cancel the stream when the component
  // unmounts or when a new execution starts before the previous one finishes.
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!activeExecutionId) return;

    // Cancel any in-progress stream from a previous run
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    // Reset state for the new run
    clearNodeStatuses();
    setIsStreaming(true);
    setLastResult(null);

    async function stream() {
      // Fetch a fresh token at stream-open time (same pattern as api.ts getToken)
      const { data } = await authClient.getSession();
      const token = data?.session?.token ?? useAuthStore.getState().token;

      try {
        const res = await fetch(
          `${API_URL}/api/executions/${activeExecutionId}/stream`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: abort.signal,
          },
        );

        if (!res.ok || !res.body) {
          throw new Error(`Stream failed: ${res.status}`);
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        // Buffer accumulates partial SSE events across chunks
        let buf = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });

          // SSE events are separated by blank lines (\n\n)
          const parts = buf.split('\n\n');
          buf = parts.pop() ?? '';

          for (const part of parts) {
            for (const line of part.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              try {
                const ev = JSON.parse(line.slice(6));

                if (ev.type === 'step_update' && ev.nodeId) {
                  setNodeStatus(ev.nodeId, ev.status);
                }

                if (ev.type === 'execution_completed') {
                  const result: ExecutionResult =
                    ev.status === 'success' ? 'success' : 'failed';
                  setLastResult(result);
                  setIsStreaming(false);
                  setActiveExecution(null);
                  return;
                }
              } catch {
                // Ignore malformed JSON lines
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[useExecutionStream] stream error:', err);
      } finally {
        setIsStreaming(false);
        // If the stream closed without an execution_completed event (e.g. error
        // or server restart) clear the active execution so the UI isn't stuck.
        setActiveExecution(null);
      }
    }

    stream();

    return () => {
      abort.abort();
    };
  // We intentionally depend only on activeExecutionId — the store setters are
  // stable references and don't need to be in the dep array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeExecutionId]);

  return { isStreaming, lastResult };
}
