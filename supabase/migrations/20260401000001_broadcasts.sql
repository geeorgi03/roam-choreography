-- Migration 20260401000001: Realtime session broadcasts

CREATE TABLE broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL CHECK (char_length(message) <= 60),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

-- Session owner or participant can read broadcasts.
CREATE POLICY broadcasts_select_session_members ON broadcasts FOR SELECT
  TO authenticated
  USING (public.is_session_member(session_id));

-- Authenticated users can insert their own broadcast rows.
CREATE POLICY broadcasts_insert_own_sender ON broadcasts FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

ALTER TABLE broadcasts REPLICA IDENTITY FULL;
