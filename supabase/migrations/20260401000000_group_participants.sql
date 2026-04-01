-- Migration 20260401000000: Realtime group participants

CREATE TABLE group_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  color text NOT NULL,
  role text NOT NULL DEFAULT 'dancer' CHECK (role IN ('choreographer', 'dancer')),
  position_x float,
  position_y float,
  position_note text,
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, user_id)
);

ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper to evaluate membership without recursive RLS policy evaluation.
CREATE OR REPLACE FUNCTION public.is_session_member(target_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_id uuid := auth.uid();
BEGIN
  IF requester_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM sessions s
    WHERE s.id = target_session_id
      AND s.user_id = requester_id
  )
  OR EXISTS (
    SELECT 1
    FROM group_participants gp
    WHERE gp.session_id = target_session_id
      AND gp.user_id = requester_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_session_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_session_member(uuid) TO authenticated;

-- Session owner or session participant can read participant rows.
CREATE POLICY group_participants_select_session_members ON group_participants FOR SELECT
  TO authenticated
  USING (public.is_session_member(session_id));

-- Only the row owner can update their participant row.
CREATE POLICY group_participants_update_own ON group_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE group_participants REPLICA IDENTITY FULL;
