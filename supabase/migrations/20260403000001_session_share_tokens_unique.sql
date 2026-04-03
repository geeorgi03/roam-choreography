-- Migration: Add unique constraint for active session-level share tokens
-- Ensures only one non-revoked token can exist per session (clip_id IS NULL)

CREATE UNIQUE INDEX IF NOT EXISTS share_tokens_active_session_unique
  ON share_tokens (session_id)
  WHERE clip_id IS NULL AND revoked_at IS NULL;
