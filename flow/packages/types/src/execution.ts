/**
 * Status of a workflow execution run
 */
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Represents a single execution log entry for a node
 */
export interface NodeExecutionLog {
  nodeId: string;
  nodeName: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  output?: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Represents a complete execution log for a workflow run
 */
export interface ExecutionLog {
  id: string;
  workflowId: string;
  userId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  nodes: NodeExecutionLog[];
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
    failedNodeId?: string;
  };
  metadata?: {
    triggeredBy?: string;
    tags?: string[];
    retries?: number;
  };
}

/**
 * Execution log response from API
 */
export type ExecutionLogResponse = ExecutionLog;

/**
 * Payload for triggering a workflow execution
 */
export interface ExecutionTriggerPayload {
  workflowId: string;
  input?: Record<string, unknown>;
  triggeredBy?: string;
}
