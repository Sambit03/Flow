/**
 * Represents a single node in a workflow
 */
export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'webhook';
  label: string;
  description?: string;
  config: Record<string, unknown>;
  position: {
    x: number;
    y: number;
  };
  inputs: string[]; // Array of node IDs this node depends on
  outputs: string[]; // Array of node IDs this node feeds into
  metadata?: {
    createdAt?: string;
    updatedAt?: string;
    version?: string;
  };
}

/**
 * Represents a complete workflow definition
 */
export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  enabled: boolean;
  nodes: WorkflowNode[];
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
  variables?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
}

/**
 * Partial workflow for creation/updates
 */
export type WorkflowInput = Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>;

/**
 * Workflow response from API
 */
export type WorkflowResponse = Workflow;
