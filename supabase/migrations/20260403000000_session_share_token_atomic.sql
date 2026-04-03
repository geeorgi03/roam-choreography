-- Session share token atomic creation helper:
-- - create_or_get_session_share_token(): atomic create-or-get for session share tokens

CREATE OR REPLACE FUNCTION create_or_get_session_share_token(p_session_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_token uuid;
  new_token uuid;
BEGIN
  -- Lock on session row to serialize owners
  PERFORM pg_advisory_xact_lock(hashtext(p_session_id::text));

  -- Check for existing active session token
  SELECT token INTO existing_token
  FROM share_tokens
  WHERE session_id = p_session_id AND clip_id IS NULL AND revoked_at IS NULL
  FOR UPDATE SKIP LOCKED LIMIT 1;

  IF existing_token IS NOT NULL THEN
    RETURN existing_token;
  END IF;

  -- Create new token
  new_token := gen_random_uuid();
  
  INSERT INTO share_tokens (session_id, token, clip_id)
  VALUES (p_session_id, new_token, NULL);
  
  RETURN new_token;
END;
$$;

-- Lock down RPC to service_role only (API uses service-role Supabase client).
REVOKE EXECUTE ON FUNCTION create_or_get_session_share_token(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_or_get_session_share_token(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION create_or_get_session_share_token(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION create_or_get_session_share_token(uuid) TO service_role;
