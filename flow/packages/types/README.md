# @flow/types

Shared TypeScript type definitions for the Flow workflow automation system.

## Usage

Import types in your web or api apps:

```typescript
import {
  Workflow,
  WorkflowNode,
  ExecutionLog,
  RunStatus,
  ApiResponse,
} from "@flow/types";
```

## Type Definitions

### Workflow Types

- `Workflow` - Complete workflow definition
- `WorkflowNode` - Individual node in a workflow
- `WorkflowInput` - Payload for creating/updating workflows

### Execution Types

- `ExecutionLog` - Record of a workflow execution
- `RunStatus` - Status of a workflow run ('pending' | 'running' | 'completed' | 'failed' | 'cancelled')
- `NodeExecutionLog` - Individual node execution record
- `ExecutionTriggerPayload` - Payload for triggering execution

### Common Types

- `ApiResponse<T>` - Generic API response wrapper
- `PaginatedResponse<T>` - Paginated API response
- `UserContext` - User information
- `EnvironmentConfig` - Environment variable types

## Building

```bash
npm run build --workspace=types
```

Type definitions are emitted as `.d.ts` files in the `dist` directory.
