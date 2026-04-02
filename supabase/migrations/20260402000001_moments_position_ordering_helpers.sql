-- Moments position ordering helpers:
-- - moments_session_id_position_unique_constraint_exists(): verify unique constraint presence
-- - create_moment_atomic_with_position(): atomic insert using per-session advisory lock

CREATE OR REPLACE FUNCTION moments_session_id_position_unique_constraint_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE c.conname = 'moments_session_id_position_unique'
      AND t.relname = 'moments'
      AND t.relnamespace = 'public'::regnamespace
  );
END;
$$;

CREATE OR REPLACE FUNCTION create_moment_atomic_with_position(
  p_session_id uuid,
  p_name text,
  p_beat_position_ms integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position integer;
  v_m moments%ROWTYPE;
BEGIN
  -- Serialize position allocation per session so duplicate positions cannot be created,
  -- even if the unique constraint migration isn't applied yet.
  PERFORM pg_advisory_xact_lock(hashtext(p_session_id::text));

  SELECT COALESCE(MAX(m.position), -1) + 1
  INTO v_position
  FROM moments m
  WHERE m.session_id = p_session_id;

  INSERT INTO moments (session_id, name, beat_position_ms, position, formation, quality)
  VALUES (p_session_id, p_name, p_beat_position_ms, v_position, NULL, NULL)
  RETURNING * INTO v_m;

  RETURN to_jsonb(v_m);
END;
$$;

-- Lock down RPCs to service_role only (API uses service-role Supabase client).
REVOKE EXECUTE ON FUNCTION moments_session_id_position_unique_constraint_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION moments_session_id_position_unique_constraint_exists() FROM anon;
REVOKE EXECUTE ON FUNCTION moments_session_id_position_unique_constraint_exists() FROM authenticated;
GRANT EXECUTE ON FUNCTION moments_session_id_position_unique_constraint_exists() TO service_role;

REVOKE EXECUTE ON FUNCTION create_moment_atomic_with_position(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_moment_atomic_with_position(uuid, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION create_moment_atomic_with_position(uuid, text, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION create_moment_atomic_with_position(uuid, text, integer) TO service_role;

