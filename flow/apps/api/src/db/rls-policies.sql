-- Row Level Security (RLS) Policies for Neon Auth
-- Run these commands in Neon's SQL Editor after migrations are applied
-- Note: Neon Auth provides auth.user_id() function for RLS policies

-- Enable RLS on all tables
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_logs  ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see and edit their own profile
-- Neon Auth: auth.user_id() returns the authenticated user's UUID
CREATE POLICY "profiles: own row only" ON profiles
  FOR ALL USING (auth.user_id() = id);

-- Workflows: users can only see and edit their own workflows
CREATE POLICY "workflows: own rows only" ON workflows
  FOR ALL USING (auth.user_id() = user_id);

-- Nodes: visible if user owns the workflow
CREATE POLICY "nodes: via workflow ownership" ON nodes
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.user_id()
    )
  );

-- Edges: visible if user owns the workflow
CREATE POLICY "edges: via workflow ownership" ON edges
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.user_id()
    )
  );

-- Executions: visible if user owns the workflow
CREATE POLICY "executions: via workflow ownership" ON executions
  FOR ALL USING (
    workflow_id IN (
      SELECT id FROM workflows WHERE user_id = auth.user_id()
    )
  );

-- Step logs: visible if user owns the execution
CREATE POLICY "step_logs: via execution ownership" ON step_logs
  FOR ALL USING (
    execution_id IN (
      SELECT e.id FROM executions e
      JOIN workflows w ON w.id = e.workflow_id
      WHERE w.user_id = auth.user_id()
    )
  );

-- Neon Auth: User signup and profile creation is handled by your API
-- When a user signs up via Neon Auth, your API receives a JWT token
-- and inserts a profile row with the user_id from the JWT.
-- See: apps/api/src/auth/neon-auth.ts for implementation
