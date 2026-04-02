-- Migration 20260401000002: Moments table with formation + quality JSONB columns

CREATE TABLE moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  beat_position_ms integer NOT NULL DEFAULT 0,
  formation jsonb,
  quality jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY moments_select_session_members
ON moments
FOR SELECT
TO authenticated
USING (public.is_session_member(session_id));

CREATE POLICY moments_insert_session_members
ON moments
FOR INSERT
TO authenticated
WITH CHECK (public.is_session_member(session_id));

CREATE POLICY moments_update_session_members
ON moments
FOR UPDATE
TO authenticated
USING (public.is_session_member(session_id))
WITH CHECK (public.is_session_member(session_id));

CREATE POLICY moments_delete_session_owner
ON moments
FOR DELETE
TO authenticated
USING (session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid()));

ALTER TABLE moments REPLICA IDENTITY FULL;

CREATE INDEX idx_moments_session_position ON moments (session_id, position);
