-- Create loops table
CREATE TABLE IF NOT EXISTS loops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  start_ms integer NOT NULL,
  end_ms integer NOT NULL,
  color text NOT NULL,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE loops ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SELECT - session members
CREATE POLICY loops_select_session_members ON loops
  FOR SELECT USING (public.is_session_member(session_id));

-- INSERT - session members
CREATE POLICY loops_insert_session_members ON loops
  FOR INSERT WITH CHECK (public.is_session_member(session_id));

-- UPDATE - session members
CREATE POLICY loops_update_session_members ON loops
  FOR UPDATE USING (public.is_session_member(session_id));

-- DELETE - session owner only
CREATE POLICY loops_delete_session_owner ON loops
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = loops.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- Index for performance
CREATE INDEX idx_loops_session_source ON loops (session_id, source_url);

-- Set REPLICA IDENTITY FULL for replication
ALTER TABLE loops REPLICA IDENTITY FULL;
