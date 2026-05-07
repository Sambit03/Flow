import type { RunStatus } from './execution';

/** Published over Redis pub/sub and streamed via SSE */
export interface StepUpdateEvent {
  executionId: string;
  nodeId: string;
  status: RunStatus;
  output?: unknown;
  error?: string;
  timestamp: string;
}

export interface ExecutionCompleteEvent {
  executionId: string;
  status: 'success' | 'failed';
  finishedAt: string;
}

export type SSEEvent = StepUpdateEvent | ExecutionCompleteEvent;
